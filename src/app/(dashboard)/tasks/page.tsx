import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TasksPage } from "@/components/dashboard/tasks/tasks-page";

export const metadata = {
  title: "Tasks — TrackHour",
};

export default async function TasksRoute() {
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

  return <TasksPage teamId={teamId} />;
}
