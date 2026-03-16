import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Fetch teams where user is owner or active member
  const { data: userTeams } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", user.id);

  let allTeams = userTeams || [];

  // Also fetch teams where user is a member
  const { data: memberTeams } = await supabase
    .from("team_members")
    .select("teams(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (memberTeams && memberTeams.length > 0) {
    const memberTeamsList = memberTeams
      .map((m: any) => m.teams)
      .filter(Boolean);
    allTeams = [
      ...allTeams,
      ...memberTeamsList.filter(
        (t: any) => !allTeams.some((existing: any) => existing.id === t.id)
      ),
    ];
  }

  const uniqueTeams = allTeams;
  const firstTeamId = uniqueTeams[0]?.id;

  // Onboarding checks (parallel)
  const [{ count: projectCount }, { count: clientCount }, { count: timerCount }] = await Promise.all([
    firstTeamId
      ? supabase.from("projects").select("*", { count: "exact", head: true }).eq("team_id", firstTeamId)
      : Promise.resolve({ count: 0 }),
    firstTeamId
      ? supabase.from("clients").select("*", { count: "exact", head: true }).eq("team_id", firstTeamId)
      : Promise.resolve({ count: 0 }),
    supabase.from("time_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).not("ended_at", "is", null),
  ]);

  const onboarding = {
    hasTeam: uniqueTeams.length > 0,
    hasProject: (projectCount || 0) > 0,
    hasClient: (clientCount || 0) > 0,
    hasTimer: (timerCount || 0) > 0,
  };

  // Active timer
  const { data: activeTimer } = await supabase
    .from("time_entries")
    .select(`*, projects(name, color), tasks(name)`)
    .eq("user_id", user.id)
    .is("ended_at", null)
    .single();

  // Recent time entries (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentEntries } = await supabase
    .from("time_entries")
    .select(`*, projects(name, color, clients(name)), tasks(name)`)
    .eq("user_id", user.id)
    .gte("started_at", sevenDaysAgo.toISOString())
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(10);

  return (
    <DashboardOverview
      teams={uniqueTeams || []}
      activeTimer={activeTimer}
      recentEntries={recentEntries || []}
      onboarding={onboarding}
    />
  );
}
