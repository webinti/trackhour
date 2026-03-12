import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import type { Plan } from "@/lib/supabase/types";

// Use service role directly (no cookie-based auth needed for webhooks)
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getPlanFromPriceId(priceId: string): Plan {
  if (
    priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
  ) return "premium";
  if (
    priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID
  ) return "business";
  return "free";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const teamId = session.metadata?.team_id;
        if (!teamId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(priceId);

        await supabase.from("teams").update({
          stripe_subscription_id: subscription.id,
          plan,
          plan_status: subscription.status,
          plan_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", teamId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const priceId = subscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(priceId);

        await supabase.from("teams").update({
          plan,
          plan_status: subscription.status,
          plan_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await supabase.from("teams").update({
          plan: "free",
          plan_status: "canceled",
          stripe_subscription_id: null,
          plan_period_end: null,
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscription.id);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
