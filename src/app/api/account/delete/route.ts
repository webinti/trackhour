import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Block deletion if user has an active paid plan
  const { data: team } = await serviceClient
    .from("teams")
    .select("id, plan")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (team && team.plan !== "free") {
    return NextResponse.json(
      { error: "Abonnement actif. Veuillez d'abord résilier votre abonnement." },
      { status: 403 }
    );
  }

  // Delete owned team data manually (no cascade from auth.users to teams)
  if (team) {
    const { data: projects } = await serviceClient
      .from("projects")
      .select("id")
      .eq("team_id", team.id);

    if (projects && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      await serviceClient.from("tasks").delete().in("project_id", projectIds);
    }

    await serviceClient.from("team_members").delete().eq("team_id", team.id);
    await serviceClient.from("projects").delete().eq("team_id", team.id);
    await serviceClient.from("clients").delete().eq("team_id", team.id);
    await serviceClient.from("teams").delete().eq("id", team.id);
  }

  // Delete user's own memberships in other teams
  await serviceClient.from("team_members").delete().eq("user_id", user.id);

  // Delete time entries
  await serviceClient.from("time_entries").delete().eq("user_id", user.id);

  // Delete auth user — Supabase cascades the profile deletion automatically
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[DELETE ACCOUNT] deleteUser error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte : " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
