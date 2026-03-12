import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";

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
    supabase.from("teams").select("id").eq("owner_id", user.id),
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
    { count: projectsCount },
    { count: clientsCount },
    { count: tasksCount },
    { count: membersCount },
  ] = await Promise.all([
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
    projects: projectsCount || 0,
    clients: clientsCount || 0,
    tasks: tasksCount || 0,
    members: membersCount || 0,
  };

  return (
    <div className="flex h-screen bg-[#F2F2F2] overflow-hidden" suppressHydrationWarning>
      <Sidebar profile={profile} counts={counts} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
