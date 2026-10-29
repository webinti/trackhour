import { createClient } from "@supabase/supabase-js";
import type { Plan } from "@/lib/supabase/types";

// Service role: used by the webhook (no user session) and by the post-checkout sync.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function getPlanFromPriceId(priceId: string | undefined): Plan {
  if (
    priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
  ) return "premium";
  if (
    priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID
  ) return "business";
  return "free";
}

// Since Stripe API 2025-03-31, current_period_end lives on subscription items.
function periodEnd(subscription: any): string | null {
  const ts = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export function teamValuesFromSubscription(subscription: any) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const plan: Plan = ACTIVE_STATUSES.has(subscription.status) ? getPlanFromPriceId(priceId) : "free";
  const customer = subscription.customer;
  return {
    plan,
    plan_status: subscription.status as string,
    plan_period_end: plan === "free" ? null : periodEnd(subscription),
    stripe_subscription_id: plan === "free" ? null : (subscription.id as string),
    stripe_customer_id: (typeof customer === "string" ? customer : customer?.id) ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function findTeamId(subscription: any): Promise<string | null> {
  const fromMetadata = subscription.metadata?.team_id;
  if (fromMetadata) return fromMetadata;
  const { data } = await admin
    .from("teams")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  return data?.id ?? null;
}

export type SyncResult =
  | { matched: false }
  | { matched: true; plan: Plan; skipped?: boolean };

// Applies a Stripe subscription to the team it belongs to. Throws on database errors
// so webhook callers can return 500 and let Stripe retry.
export async function syncSubscriptionToTeam(
  subscription: any,
  teamId?: string
): Promise<SyncResult> {
  const id = teamId || (await findTeamId(subscription));
  if (!id) return { matched: false };

  const values = teamValuesFromSubscription(subscription);

  if (values.plan === "free") {
    // A late cancellation event for an old subscription must not wipe a newer one.
    const { data: team } = await admin.from("teams").select("stripe_subscription_id").eq("id", id).maybeSingle();
    if (team?.stripe_subscription_id && team.stripe_subscription_id !== subscription.id) {
      return { matched: true, plan: values.plan, skipped: true };
    }
  }

  const { data, error } = await admin.from("teams").update(values).eq("id", id).select("id");
  if (error) throw new Error(`teams update failed for ${id}: ${error.message}`);
  if (!data?.length) return { matched: false };
  return { matched: true, plan: values.plan };
}
