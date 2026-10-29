import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/dashboard/settings/settings-page";
import { Suspense } from "react";
import { getPrimaryTeam } from "@/lib/team";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: profile }, team] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getPrimaryTeam(supabase, user.id, { ownedOnly: true }),
  ]);

  return (
    <Suspense>
      <SettingsPage profile={profile} email={user.email || ""} team={team} />
    </Suspense>
  );
}
