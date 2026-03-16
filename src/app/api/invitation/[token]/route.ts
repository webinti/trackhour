import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data, error } = await serviceClient
    .from("team_members")
    .select("id, role, status, invited_email, teams(name)")
    .eq("invitation_token", token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Check invitation exists and is pending
  const { data: invitation, error: fetchError } = await serviceClient
    .from("team_members")
    .select("id, status")
    .eq("invitation_token", token)
    .maybeSingle();

  if (fetchError || !invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  if (invitation.status === "active") {
    return NextResponse.json({ error: "Déjà acceptée" }, { status: 409 });
  }

  const { error: updateError } = await serviceClient
    .from("team_members")
    .update({ status: "active", user_id: userId, invitation_token: null })
    .eq("id", invitation.id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur lors de l'acceptation" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
