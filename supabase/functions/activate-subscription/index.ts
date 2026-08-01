/**
 * Edge Function: activate-subscription
 *
 * "Activate my subscription now" for a MONTHLY trialing user. Ends their EXISTING
 * Stripe trial immediately (trial_end='now') so Stripe charges the card captured
 * at signup RIGHT NOW and converts the subscription to `active`. Mutating the
 * existing subscription is the whole point — it avoids the duplicate-subscription
 * bug the in-app "Upgrade" payment link caused (which started a second $0 trial).
 *
 * FAIL-CLOSED: we only report/cache paid when Stripe actually reports the
 * subscription `active` (or past_due grace) AFTER the charge. A declined card
 * leaves it incomplete/unpaid → we keep the user limited and return an error.
 *
 * Auth: requires the user's Supabase JWT (they're logged in). Yearly plans are
 * out of scope — they charge immediately at signup and are never `trialing`.
 */
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.177.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { pickBestStatus } from "../_shared/subscriptionStatus.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const listSubs = (customerId: string) =>
  stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return errorResponse("Unauthorized", 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve the Stripe customer: prefer the durable join key on the profile,
    // else fall back to email (choose a customer that actually has a sub).
    const { data: prof } = await admin
      .from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
    let customerId = (prof?.stripe_customer_id as string | null) ?? null;
    if (!customerId && user.email) {
      const list = await stripe.customers.list({ email: user.email.trim().toLowerCase(), limit: 100 });
      for (const c of list.data) {
        const subs = await listSubs(c.id);
        if (subs.data.some((s) => s.status === "trialing" || s.status === "active" || s.status === "past_due")) {
          customerId = c.id;
          break;
        }
      }
      if (!customerId && list.data.length) customerId = list.data[0].id;
    }
    if (!customerId) {
      return errorResponse("No subscription found for this account. Start a subscription first.", 404);
    }

    // Already paid? Nothing to do — report success (idempotent).
    const subs = await listSubs(customerId);
    const alreadyPaid = subs.data.find((s) => s.status === "active" || s.status === "past_due");
    const trialing = subs.data.find((s) => s.status === "trialing");

    if (!alreadyPaid) {
      if (!trialing) {
        return errorResponse("No trial subscription to activate.", 409);
      }
      // End the trial NOW → immediate full-period invoice + charge on file.
      // proration_behavior:'none' = a clean full charge (no partial proration).
      await stripe.subscriptions.update(trialing.id, {
        trial_end: "now",
        proration_behavior: "none",
      });
    }

    // Re-read the customer's TRUE best status after the charge attempt. A failed
    // charge leaves it incomplete/unpaid/past_due — never silently "active".
    const fresh = await listSubs(customerId);
    const best = pickBestStatus(fresh.data.map((s) => ({ status: s.status, trial_end: s.trial_end })));
    const status = best?.status ?? null;
    const isPaid = status === "active" || status === "past_due";

    // Cache inline for INSTANT unlock — but only the real status (fail-closed:
    // we never write 'active' unless Stripe says so). The webhook also confirms
    // via customer.subscription.updated / invoice.paid as backup.
    await admin.from("profiles").update({
      subscription_status: status,
      trial_ends_at: best?.trialEnd ? new Date(best.trialEnd * 1000).toISOString() : null,
      subscription_synced_at: new Date().toISOString(),
      stripe_customer_id: customerId,
    }).eq("id", user.id);

    if (!isPaid) {
      // 200 with isPaid:false so the client can show the message cleanly; access
      // stays limited because we did NOT cache a paid status.
      return jsonResponse({
        status,
        isPaid: false,
        error: "We couldn't charge the card on file. Please update your payment method in Manage subscription and try again.",
      });
    }
    return jsonResponse({ status, isPaid: true });
  } catch (err) {
    return errorResponse((err as Error)?.message ?? String(err), 500);
  }
});
