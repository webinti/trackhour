import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/dashboard/settings/settings-page";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paramètres" };

export default async function ParametresRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: profile }, { data: team }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("teams").select("*").eq("owner_id", user.id).single(),
  ]);

  return (
    <Suspense>
      <SettingsPage profile={profile} email={user.email || ""} team={team} />
    </Suspense>
  );
}
