import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

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

  // Get or auto-create the user's owned team
  let { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!team) {
    const { data: newTeam } = await supabase
      .from("teams")
      .insert({ name: "Mon équipe", owner_id: user.id })
      .select()
      .single();
    team = newTeam;
  }

  if (!team) return NextResponse.json({ error: "Impossible de créer l'équipe" }, { status: 500 });

  // Get or create Stripe customer
  let customerId = team.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { team_id: team.id, user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("teams").update({ stripe_customer_id: customerId }).eq("id", team.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/parametres?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/parametres`,
    metadata: { team_id: team.id },
    subscription_data: {
      metadata: { team_id: team.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
