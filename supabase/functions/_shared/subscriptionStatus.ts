// Shared Stripe subscription-status ranking.
//
// A customer (or duplicate customers with the same email) can hold several
// subscriptions at once. Entitlement must always reflect the BEST current one,
// and the cached status must MIRROR Stripe — including DOWNGRADES (a genuine
// cancellation should turn access off), never ratcheting upward.
//
// CRITICAL — callers must fail CLOSED: only ever write the cache from a
// SUCCESSFUL Stripe read. On a thrown/failed Stripe call, skip the write and
// leave the existing cached value untouched — never null it, never downgrade on
// a transient error. `pickBestStatus` returning null therefore means a GENUINE
// "no subscriptions" (an empty but successful list), not "the call failed".

export const STATUS_RANK: Record<string, number> = {
  active: 6,
  trialing: 5,
  past_due: 4,
  paused: 3,
  unpaid: 2,
  canceled: 1,
  incomplete: 0,
  incomplete_expired: 0,
};

export function pickBestStatus(
  subs: Array<{ status: string; trial_end: number | null }>,
): { status: string; trialEnd: number | null } | null {
  let best: { status: string; trialEnd: number | null } | null = null;
  for (const s of subs) {
    const rank = STATUS_RANK[s.status] ?? 0;
    if (best === null || rank > (STATUS_RANK[best.status] ?? 0)) {
      best = { status: s.status, trialEnd: s.trial_end ?? null };
    }
  }
  return best;
}
