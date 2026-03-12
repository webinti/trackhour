import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectsPage } from "@/components/dashboard/projects/projects-page";

export const metadata = {
  title: "Projets — TrackHour",
};

export default async function ProjetsRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // Get current team
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .single();

  const teamId = teams?.id;

  return <ProjectsPage teamId={teamId} plan={teams?.plan || "free"} />;
}
