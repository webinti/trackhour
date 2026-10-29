import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryTeam } from "@/lib/team";
import { ProjectsPage } from "@/components/dashboard/projects/projects-page";

export const metadata = {
  title: "Projects — TrackHour",
};

export default async function ProjectsRoute({
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
    redirect("/login");
  }

  const team = await getPrimaryTeam(supabase, user.id);

  return (
    <ProjectsPage
      teamId={team?.id}
      plan={team?.plan || "free"}
      openForm={openNew === "1"}
    />
  );
}
