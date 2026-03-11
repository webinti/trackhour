import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamsPage } from "@/components/dashboard/teams/teams-page";

export const metadata = {
  title: "Équipes — TrackHour",
};

export default async function EquipesRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // Get current team (for now, first owned team)
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .single();

  const teamId = teams?.id;

  return <TeamsPage teamId={teamId} />;
}
