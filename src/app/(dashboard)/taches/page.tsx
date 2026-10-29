import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryTeam } from "@/lib/team";
import { TasksPage } from "@/components/dashboard/tasks/tasks-page";

export const metadata = {
  title: "Tâches — TrackHour",
};

export default async function TasksRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const team = await getPrimaryTeam(supabase, user.id);

  return <TasksPage teamId={team?.id} />;
}
