import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getPrimaryTeam } from "@/lib/team";
import { syncSubscriptionToTeam } from "@/lib/stripe-sync";

// Called when the user lands back from Stripe Checkout, so the plan is activated
// even if the webhook is late or misconfigured.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session_id: sessionId } = await req.json().catch(() => ({}));
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "session_id invalide" }, { status: 400 });
  }

  const team = await getPrimaryTeam(supabase, user.id, { ownedOnly: true });
  if (!team) return NextResponse.json({ error: "Aucune équipe" }, { status: 404 });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.team_id !== team.id) {
      return NextResponse.json({ error: "Session inconnue" }, { status: 403 });
    }
    if (!session.subscription) {
      return NextResponse.json({ plan: team.plan, status: session.status });
    }
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const result = await syncSubscriptionToTeam(subscription, team.id);
    return NextResponse.json({
      plan: result.matched ? result.plan : team.plan,
      status: subscription.status,
    });
  } catch (err: any) {
    console.error("Stripe sync error:", err);
    return NextResponse.json({ error: err?.message || "Erreur Stripe" }, { status: 500 });
  }
}
