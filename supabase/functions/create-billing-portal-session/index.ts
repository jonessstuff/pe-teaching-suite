/**
 * Edge Function: create-billing-portal-session
 *
 * Creates a Stripe billing portal session for the authenticated user so they
 * can manage (or cancel) their subscription without contacting support.
 *
 * Requires these Supabase Edge Function secrets:
 *   STRIPE_SECRET_KEY  — your Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_PORTAL_URL  — (optional) static Stripe portal URL as fallback when
 *                        the user's stripe_customer_id is not yet populated.
 *                        Configure via Dashboard → Billing → Customer portal → Link.
 *
 * The user's stripe_customer_id is stored in profiles.stripe_customer_id and
 * should be populated by a Stripe webhook (customer.subscription.created /
 * customer.subscription.updated) that writes the Stripe customer ID back to
 * the profile row matching the user's email.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_PORTAL_URL = Deno.env.get("STRIPE_PORTAL_URL");

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const stripeCustomerId = profile?.stripe_customer_id;

    // Optional: deep-link straight to the card-update screen (used by the
    // /update-card dunning flow) instead of the portal home.
    const reqBody = await req.json().catch(() => ({}));
    const wantsCardUpdate = reqBody?.flow === "payment_method_update";

    // Preferred path: create a personalized portal session via Stripe API
    if (stripeCustomerId && STRIPE_SECRET_KEY) {
      const origin = req.headers.get("origin") ?? "https://pehealthk12.netlify.app";
      const params = new URLSearchParams({
        customer: stripeCustomerId,
        return_url: `${origin}/settings`,
      });
      if (wantsCardUpdate) {
        params.append("flow_data[type]", "payment_method_update");
      }

      const stripeRes = await fetch(
        "https://api.stripe.com/v1/billing_portal/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const session = await stripeRes.json();

      if (!stripeRes.ok) {
        return errorResponse(
          session.error?.message ?? "Stripe returned an error",
          502
        );
      }

      return jsonResponse({ url: session.url });
    }

    // Fallback: return the static portal URL (customer authenticates via email)
    if (STRIPE_PORTAL_URL) {
      return jsonResponse({ url: STRIPE_PORTAL_URL });
    }

    return errorResponse(
      "Billing portal not configured. Please contact support to manage your subscription.",
      503
    );
  } catch (err) {
    return errorResponse(err.message ?? String(err), 500);
  }
});
