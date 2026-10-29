import { createClient } from "@/lib/supabase/server";
import { getPrimaryTeam } from "@/lib/team";
import { redirect } from "next/navigation";
import { TimerPage } from "@/components/timer/timer-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Timer" };

export default async function TimerRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: timeEntries }, team] = await Promise.all([
    supabase
      .from("time_entries")
      .select(`*, projects(id, name, color, clients(name)), tasks(id, name, hourly_rate)`)
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(50),
    getPrimaryTeam(supabase, user.id),
  ]);

  const currency = (team?.currency as any) || "EUR";

  return <TimerPage timeEntries={timeEntries || []} userId={user.id} currency={currency} />;
}
