import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
