import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectsPage } from "@/components/dashboard/projects/projects-page";

export const metadata = {
  title: "Projects — TrackHour",
};

export default async function ProjectsRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current team
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .single();

  const teamId = teams?.id;

  return <ProjectsPage teamId={teamId} />;
}
