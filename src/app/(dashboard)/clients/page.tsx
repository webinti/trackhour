import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryTeam } from "@/lib/team";
import { ClientsPage } from "@/components/dashboard/clients/clients-page";

export const metadata = {
  title: "Clients — TrackHour",
};

export default async function ClientsRoute({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: openNew } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const team = await getPrimaryTeam(supabase, user.id);
  return <ClientsPage teamId={team?.id} plan={team?.plan || "free"} openForm={openNew === "1"} />;
}
