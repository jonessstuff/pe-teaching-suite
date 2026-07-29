/**
 * Edge Function: get-subscription-status
 *
 * There is no subscription table in this project's database — Stripe is the
 * source of truth. This function looks up the authenticated user's Stripe
 * subscription status (matched by email), caches it on their profile row, and
 * returns it. The cached columns (subscription_status, trial_ends_at,
 * stripe_customer_id, subscription_synced_at) are what the client and the
 * increment_export_count() RPC read to decide paid vs trial.
 *
 * Effective status mapping used by the app:
 *   active / past_due                        -> paid (past_due = grace period)
 *   trialing                                 -> still on the 14-day trial (gated)
 *   canceled / unpaid / incomplete_expired   -> expired (gated)
 *   (no Stripe subscription)                 -> null; client falls back to
 *                                               created_at + 14-day inference
 *
 * Requires these Supabase Edge Function secrets:
 *   STRIPE_SECRET_KEY          — Stripe secret key (sk_live_... / sk_test_...)
 *   SUPABASE_SERVICE_ROLE_KEY  — to write the cache columns (bypasses RLS)
 * (SUPABASE_URL and SUPABASE_ANON_KEY are provided automatically.)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { pickBestStatus, STATUS_RANK } from "../_shared/subscriptionStatus.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

// STATUS_RANK + pickBestStatus now live in ../_shared/subscriptionStatus.ts so
// the webhook, activate-checkout, and this function all rank identically
// (active > trialing > past_due > … > canceled).

async function stripeGet(path: string) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const body = await r.json();
  // Fail CLOSED: a non-2xx is a FAILED call, not "no data". Throw so the outer
  // handler skips the cache write entirely, leaving the existing value intact —
  // a transient Stripe error must never null or downgrade the cache.
  if (!r.ok) throw new Error(`stripe ${r.status}: ${body?.error?.message ?? "request failed"}`);
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("Missing Authorization header", 401);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    let status: string | null = null;
    let trialEndsAt: string | null = null;
    let customerId: string | null = null;

    const admin = SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    // Prefer the customer id already stored on the profile: entitlement resolves
    // by the Stripe CUSTOMER, not by email — so a mismatch between the account's
    // email and the payer's Stripe email no longer locks anyone out, and the
    // owner's manual stripe_customer_id backfills become the source of truth.
    let storedCustomerId: string | null = null;
    if (admin) {
      const { data: prof } = await admin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle();
      storedCustomerId = (prof?.stripe_customer_id as string | null) ?? null;
    }

    if (STRIPE_SECRET_KEY && storedCustomerId) {
      // PRIMARY PATH — by stored customer id. (stripeGet throws on API error →
      // outer catch skips the write; an empty-but-successful list is a genuine
      // "no subscription" and is allowed to downgrade, mirroring Stripe.)
      customerId = storedCustomerId;
      const subData = await stripeGet(
        `subscriptions?customer=${encodeURIComponent(storedCustomerId)}&status=all&limit=100`,
      );
      const best = pickBestStatus(
        (subData?.data ?? []).map((s: { status: string; trial_end: number | null }) => ({
          status: s.status,
          trial_end: s.trial_end,
        })),
      );
      if (best) {
        status = best.status;
        trialEndsAt = best.trialEnd ? new Date(best.trialEnd * 1000).toISOString() : null;
      }
    } else if (STRIPE_SECRET_KEY && user.email) {
      // FALLBACK — by email (unchanged), for accounts with no stored customer id
      // yet. Find Stripe customer(s) by email (there can be duplicates).
      const custData = await stripeGet(
        `customers?email=${encodeURIComponent(user.email)}&limit=100`,
      );
      const customers = custData?.data ?? [];

      for (const cust of customers) {
        const subData = await stripeGet(
          `subscriptions?customer=${cust.id}&status=all&limit=100`,
        );
        const best = pickBestStatus(
          (subData?.data ?? []).map((s: { status: string; trial_end: number | null }) => ({
            status: s.status,
            trial_end: s.trial_end,
          })),
        );
        if (best && (status === null || (STATUS_RANK[best.status] ?? 0) > (STATUS_RANK[status] ?? 0))) {
          status = best.status;
          customerId = cust.id;
          trialEndsAt = best.trialEnd ? new Date(best.trialEnd * 1000).toISOString() : null;
        }
      }

      // Customer exists but no subscription yet — still record the customer id
      // so the billing portal can be opened.
      if (!customerId && customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // Cache on the profile via the service role (bypasses RLS). Reached ONLY on a
    // successful Stripe read (a thrown error skips this via the outer catch), and
    // NEVER nulls stripe_customer_id — the column is a durable join key and may
    // hold a manual backfill; only overwrite it with a real, non-null value.
    if (admin) {
      const patch: Record<string, unknown> = {
        subscription_status: status,
        trial_ends_at: trialEndsAt,
        subscription_synced_at: new Date().toISOString(),
      };
      if (customerId) patch.stripe_customer_id = customerId;
      await admin.from("profiles").update(patch).eq("id", user.id);
    }

    const isPaid = status === "active" || status === "past_due";
    return jsonResponse({
      status,
      isPaid,
      isTrial: status === "trialing",
      trialEndsAt,
    });
  } catch (err) {
    return errorResponse((err as Error).message ?? String(err), 500);
  }
});
