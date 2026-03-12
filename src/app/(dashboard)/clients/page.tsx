import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientsPage } from "@/components/dashboard/clients/clients-page";

export const metadata = {
  title: "Clients — TrackHour",
};

export default async function ClientsRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // Get current team (owner or first team where user is member)
  const { data: userTeams } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1);

  let teamId = userTeams?.[0]?.id;

  // If no owned team, get first team where user is a member
  if (!teamId) {
    const { data: memberTeams } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    teamId = memberTeams?.[0]?.team_id;
  }

  const plan = userTeams?.[0]?.plan || "free";
  return <ClientsPage teamId={teamId} plan={plan} />;
}
