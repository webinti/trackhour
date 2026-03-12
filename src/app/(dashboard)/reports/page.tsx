import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsPage } from "@/components/dashboard/reports/reports-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rapports" };

export default async function ReportsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*, projects(id, name, color, clients(name)), tasks(id, name, hourly_rate)")
    .eq("user_id", user.id)
    .not("ended_at", "is", null)
    .gte("started_at", twelveMonthsAgo.toISOString())
    .order("started_at", { ascending: true });

  return <ReportsPage timeEntries={timeEntries || []} />;
}
