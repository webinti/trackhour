import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryTeam } from "@/lib/team";
import { TeamsPage } from "@/components/dashboard/teams/teams-page";

export const metadata = {
  title: "Teams — TrackHour",
};

export default async function TeamsRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const team = await getPrimaryTeam(supabase, user.id);

  return <TeamsPage teamId={team?.id} plan={team?.plan || "free"} />;
}
