import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getPrimaryTeam } from "@/lib/team";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await getPrimaryTeam(supabase, user.id, { ownedOnly: true });
  if (!team?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement trouvé" }, { status: 404 });
  }

  const appUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://trackhour.fr";
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: team.stripe_customer_id,
      return_url: `${appUrl}/settings?tab=abonnement`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: err?.message || "Erreur Stripe" }, { status: 500 });
  }
}
