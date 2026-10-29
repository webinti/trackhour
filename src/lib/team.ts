import type { SupabaseClient } from "@supabase/supabase-js";
import type { Team } from "@/lib/supabase/types";

// The team used for billing, plan limits and data: a paid owned team first,
// then the oldest owned team, then (unless ownedOnly) the first team the user joined.
export async function getPrimaryTeam(
  supabase: SupabaseClient<any>,
  userId: string,
  { ownedOnly = false }: { ownedOnly?: boolean } = {}
): Promise<Team | null> {
  const { data: owned } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  const ownedTeams = (owned || []) as Team[];
  const paid = ownedTeams.find((t) => t.plan !== "free" || t.stripe_subscription_id);
  if (paid) return paid;
  if (ownedTeams[0]) return ownedTeams[0];
  if (ownedOnly) return null;

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1);

  const teamId = memberships?.[0]?.team_id;
  if (!teamId) return null;

  const { data: team } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
  return (team as Team) || null;
}
