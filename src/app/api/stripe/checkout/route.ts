import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getPrimaryTeam } from "@/lib/team";
import { getPlanFromPriceId, syncSubscriptionToTeam } from "@/lib/stripe-sync";

const UPDATABLE_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planKey, period } = await req.json();
  if (!planKey || !period) return NextResponse.json({ error: "Missing planKey or period" }, { status: 400 });

  const PRICE_MAP: Record<string, string | undefined> = {
    premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    business_monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    business_yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
  };
  const priceId = PRICE_MAP[`${planKey}_${period}`];
  if (!priceId) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

  let team = await getPrimaryTeam(supabase, user.id, { ownedOnly: true });
  if (!team) {
    const { data: newTeam } = await supabase
      .from("teams")
      .insert({ name: "Mon équipe", owner_id: user.id })
      .select()
      .single();
    team = newTeam;
  }
  if (!team) return NextResponse.json({ error: "Impossible de créer l'équipe" }, { status: 500 });

  // Already subscribed: change the existing subscription's price instead of
  // creating a second subscription that would bill in parallel.
  if (team.stripe_subscription_id) {
    try {
      const current = await stripe.subscriptions.retrieve(team.stripe_subscription_id);
      if (UPDATABLE_STATUSES.has(current.status)) {
        const item = current.items.data[0];
        if (item.price.id === priceId) {
          return NextResponse.json({ updated: true, plan: getPlanFromPriceId(priceId) });
        }
        const updated = await stripe.subscriptions.update(current.id, {
          items: [{ id: item.id, price: priceId }],
          proration_behavior: "always_invoice",
          payment_behavior: "error_if_incomplete",
          cancel_at_period_end: false,
          metadata: { team_id: team.id },
        });
        await syncSubscriptionToTeam(updated, team.id);
        return NextResponse.json({ updated: true, plan: getPlanFromPriceId(priceId) });
      }
    } catch (err: any) {
      if (err?.code !== "resource_missing") {
        console.error("Stripe subscription update error:", err);
        return NextResponse.json(
          { error: err?.message || "Impossible de modifier l'abonnement" },
          { status: err?.statusCode === 402 ? 402 : 500 }
        );
      }
    }
  }

  let customerId = team.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { team_id: team.id, user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("teams").update({ stripe_customer_id: customerId }).eq("id", team.id);
  }

  // The browser's Origin header reflects the domain the user is actually on.
  const appUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://trackhour.fr";
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?tab=abonnement`,
      client_reference_id: team.id,
      allow_promotion_codes: true,
      metadata: { team_id: team.id },
      subscription_data: {
        metadata: { team_id: team.id },
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err?.message || "Erreur Stripe" }, { status: 500 });
  }
}
