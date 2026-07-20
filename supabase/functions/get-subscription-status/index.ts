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

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

// Higher rank = "better" status. When a customer (or duplicate customers with
// the same email) has multiple subscriptions, we report the best one.
const STATUS_RANK: Record<string, number> = {
  active: 6,
  trialing: 5,
  past_due: 4,
  paused: 3,
  unpaid: 2,
  canceled: 1,
  incomplete: 0,
  incomplete_expired: 0,
};

function stripeGet(path: string) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  }).then((r) => r.json());
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

    if (STRIPE_SECRET_KEY && user.email) {
      // Find Stripe customer(s) by email (there can be duplicates).
      const custData = await stripeGet(
        `customers?email=${encodeURIComponent(user.email)}&limit=100`,
      );
      const customers = custData?.data ?? [];

      for (const cust of customers) {
        const subData = await stripeGet(
          `subscriptions?customer=${cust.id}&status=all&limit=100`,
        );
        for (const sub of subData?.data ?? []) {
          const rank = STATUS_RANK[sub.status] ?? 0;
          if (status === null || rank > (STATUS_RANK[status] ?? 0)) {
            status = sub.status;
            customerId = cust.id;
            trialEndsAt = sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null;
          }
        }
      }

      // Customer exists but no subscription yet — still record the customer id
      // so the billing portal can be opened.
      if (!customerId && customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // Cache on the profile via the service role (bypasses RLS).
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await admin
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          subscription_status: status,
          trial_ends_at: trialEndsAt,
          subscription_synced_at: new Date().toISOString(),
        })
        .eq("id", user.id);
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
