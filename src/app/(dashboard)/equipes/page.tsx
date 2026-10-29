import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryTeam } from "@/lib/team";
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

  const team = await getPrimaryTeam(supabase, user.id);

  return <TeamsPage teamId={team?.id} plan={team?.plan || "free"} />;
}
