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
  const { data: ownedTeams } = await supabase
    .from("teams")
    .select("id, plan")
    .eq("owner_id", user.id)
    .limit(1);

  const team = ownedTeams?.[0];

  return <ProjectsPage teamId={team?.id} plan={(team?.plan as any) || "free"} />;
}
