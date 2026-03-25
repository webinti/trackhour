import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { BottomNav } from "@/components/dashboard/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch team IDs for this user
  const [{ data: ownedTeams }, { data: memberTeams }] = await Promise.all([
    supabase.from("teams").select("id, plan").eq("owner_id", user.id),
    supabase.from("team_members").select("team_id").eq("user_id", user.id).eq("status", "active"),
  ]);

  const allTeamIds = [
    ...new Set([
      ...((ownedTeams || []).map((t: any) => t.id)),
      ...((memberTeams || []).map((m: any) => m.team_id)),
    ]),
  ];

  // Fetch counts in parallel
  const [
    { count: timersCount },
    { count: projectsCount },
    { count: clientsCount },
    { count: tasksCount },
    { count: membersCount },
  ] = await Promise.all([
    supabase.from("time_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).not("ended_at", "is", null),
    allTeamIds.length > 0
      ? supabase.from("projects").select("*", { count: "exact", head: true }).in("team_id", allTeamIds)
      : Promise.resolve({ count: 0 }),
    allTeamIds.length > 0
      ? supabase.from("clients").select("*", { count: "exact", head: true }).in("team_id", allTeamIds)
      : Promise.resolve({ count: 0 }),
    allTeamIds.length > 0
      ? supabase.from("tasks").select("projects!inner(team_id)", { count: "exact", head: true }).in("projects.team_id", allTeamIds)
      : Promise.resolve({ count: 0 }),
    allTeamIds.length > 0
      ? supabase.from("team_members").select("*", { count: "exact", head: true }).in("team_id", allTeamIds).eq("status", "active")
      : Promise.resolve({ count: 0 }),
  ]);

  const counts = {
    timers: timersCount || 0,
    projects: projectsCount || 0,
    clients: clientsCount || 0,
    tasks: tasksCount || 0,
    members: membersCount || 0,
  };

  const plan = (ownedTeams?.[0] as any)?.plan || "free";

  return (
    <div className="flex h-screen bg-[#F2F2F2] overflow-hidden" suppressHydrationWarning>
      <Sidebar profile={profile} counts={counts} plan={plan} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
