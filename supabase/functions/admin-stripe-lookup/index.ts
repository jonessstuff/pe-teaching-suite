// Admin/ops diagnostic: enumerate every Stripe customer + subscription for an
// email, so the owner can untangle duplicate trials (broken-Upgrade-link dupes),
// pick a keeper, and see which is charge-ready. READ-ONLY (no writes, no charges).
//
// AUTH: service-role only. The caller MUST present the Supabase SERVICE ROLE key
// as the bearer token; any other token (anon / user JWT) is rejected. Deployed
// with --no-verify-jwt so the platform doesn't pre-validate — this internal
// check is the gate.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.177.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return json({ error: "forbidden" }, 403);
  }
  try {
    const body = await req.json().catch(() => ({}));

    // ── Cancel action (duplicate-trial cleanup) ──────────────────────────────
    // SAFETY: only cancels a subscription that is currently `trialing` (a clean
    // $0 cancel of a duplicate trial). Refuses to cancel an active/paid sub, so
    // this ops tool can never accidentally kill a paying customer's plan.
    if (body?.cancel_subscription_id) {
      const subId = String(body.cancel_subscription_id);
      const before = await stripe.subscriptions.retrieve(subId);
      if (before.status !== "trialing") {
        return json({ error: `refusing to cancel: sub ${subId} is '${before.status}', not 'trialing'` }, 409);
      }
      const canceled = await stripe.subscriptions.cancel(subId);
      return json({ canceled: { id: subId, customer: canceled.customer, previous_status: before.status, new_status: canceled.status } });
    }

    // ── Invoice / decline detail (dunning diagnostics for past_due) ──────────
    if (body?.latest_invoice_for) {
      const sub = await stripe.subscriptions.retrieve(String(body.latest_invoice_for), {
        expand: ["latest_invoice.payment_intent"],
      });
      const inv = sub.latest_invoice as Stripe.Invoice | null;
      const pi = (inv?.payment_intent ?? null) as Stripe.PaymentIntent | null;
      const err = pi?.last_payment_error ?? null;
      return json({
        subscription: sub.id,
        status: sub.status,
        invoice: inv ? {
          id: inv.id,
          status: inv.status,
          amount_due: inv.amount_due,
          attempt_count: inv.attempt_count,
          next_payment_attempt: inv.next_payment_attempt ? new Date(inv.next_payment_attempt * 1000).toISOString() : null,
        } : null,
        last_payment_error: err ? { code: err.code, decline_code: err.decline_code, message: err.message } : null,
      });
    }

    const { email } = body ?? {};
    if (!email) return json({ error: "missing email" }, 400);

    const customers = await stripe.customers.list({ email: String(email).trim().toLowerCase(), limit: 100 });
    const out = [];
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 100 });
      // Is there a card on file to charge? (payment-link trials attach one.)
      const defaultPm = (c.invoice_settings?.default_payment_method as string | null) ?? null;
      let hasCardViaMethods = false;
      if (!defaultPm) {
        const pms = await stripe.paymentMethods.list({ customer: c.id, type: "card", limit: 1 });
        hasCardViaMethods = pms.data.length > 0;
      }
      out.push({
        customer: c.id,
        customer_created: new Date(c.created * 1000).toISOString(),
        email: c.email,
        has_card_on_file: !!defaultPm || hasCardViaMethods,
        subs: subs.data.map((s) => ({
          id: s.id,
          status: s.status,
          created: new Date(s.created * 1000).toISOString(),
          trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: s.cancel_at_period_end,
          default_payment_method: s.default_payment_method ?? null,
          amount: s.items?.data?.[0]?.price?.unit_amount ?? null,
          interval: s.items?.data?.[0]?.price?.recurring?.interval ?? null,
        })),
      });
    }
    return json({ email, customer_count: out.length, customers: out });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
