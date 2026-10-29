import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionToTeam } from "@/lib/stripe-sync";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });

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
        const result = await syncSubscriptionToTeam(subscription, teamId);
        if (!result.matched) {
          // The team was deleted between checkout and payment: nothing to activate.
          console.warn(`Webhook ${event.type}: team ${teamId} not found`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const result = await syncSubscriptionToTeam(subscription);
        if (!result.matched) {
          // Subscriptions created outside this app (other integrations on the same Stripe account).
          console.warn(`Webhook ${event.type}: no team for subscription ${subscription.id}, ignored`);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
