// Called by the /welcome page after a payment-link checkout redirects back with
// ?session_id=…. It confirms the checkout, ensures the buyer's account exists
// (closing the race where the redirect beats the webhook), and — on the Resend
// button — (re)sends a one-tap magic link. New accounts already get that email
// from the stripe-webhook; this is the on-screen continuity + a safety net.
//
// Public (no user JWT — the buyer isn't logged in yet). It can only ever email
// the address that PAID on the given session, so a leaked session_id can't be
// used to send login links anywhere else.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.177.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { pickBestStatus } from "../_shared/subscriptionStatus.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const FROM = "PlansK12 <hello@plansk12.com>";
const SITE = "https://plansk12.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Same branded magic-link email the webhook sends, so resends look identical.
async function sendMagicLink(email: string) {
  const link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${SITE}/dashboard` },
  });
  if (link.error || !link.data?.properties?.action_link) throw link.error ?? new Error("no link");
  const actionLink = link.data.properties.action_link;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e">
      <h2 style="color:#1a1a2e">You're in — payment received ✅</h2>
      <p>Thanks for subscribing to PlansK12. Your subscription is active.</p>
      <p><strong>One tap to log in</strong> — no password needed:</p>
      <p><a href="${actionLink}" style="display:inline-block;background:#4f46e5;color:#fff;
         padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">
         Log in to PlansK12</a></p>
      <p style="color:#6b7280;font-size:13px">You won't be charged again to set this up —
         your subscription is already active. You can add a password later from Settings.</p>
      <p style="color:#9aa4b0;font-size:12px">If you didn't subscribe to PlansK12, you can ignore this email.</p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [email], subject: "Finish setting up your PlansK12 account", html }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { session_id, resend } = await req.json().catch(() => ({}));
    if (!session_id) return json({ error: "missing session_id" }, 400);

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email = session.customer_details?.email ?? session.customer_email;
    if (!email) return json({ error: "no email on session" }, 404);
    // Only act on genuinely completed/paid checkouts.
    if (session.status !== "complete" && session.payment_status !== "paid") {
      return json({ email });
    }

    const norm = email.trim().toLowerCase();
    let uid = (await admin.rpc("get_user_id_by_email", { p_email: norm })).data as string | null;
    let created = false;
    if (!uid) {
      const c = await admin.auth.admin.createUser({ email: norm, email_confirm: true });
      if (c.error) {
        // race: webhook (or a concurrent call) just made it — link, don't dup
        uid = (await admin.rpc("get_user_id_by_email", { p_email: norm })).data as string | null;
        if (!uid) throw c.error;
      } else {
        uid = c.data.user.id;
        created = true;
      }
    }

    // Capture the Stripe customer id (the durable join key) + best status at
    // account-creation time, so entitlement never depends on email matching.
    // Fail CLOSED: the customer id comes from the already-retrieved session (no
    // extra call), so we always persist it; status comes from a separate subs
    // read, and on a transient Stripe error we KEEP the customer-id write and
    // SKIP status rather than downgrading/nulling a just-paid account.
    const customerId = typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
    if (uid) {
      const patch: Record<string, unknown> = { subscription_synced_at: new Date().toISOString() };
      if (customerId) patch.stripe_customer_id = customerId; // never null
      try {
        if (customerId) {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
          const best = pickBestStatus(subs.data.map((s) => ({ status: s.status, trial_end: s.trial_end })));
          if (best) {
            patch.subscription_status = best.status;
            patch.trial_ends_at = best.trialEnd ? new Date(best.trialEnd * 1000).toISOString() : null;
          }
        }
      } catch (_err) {
        // Transient Stripe error — keep the customer-id write, skip status.
      }
      await admin.from("profiles").update(patch).eq("id", uid);
    }

    // Send if we created the account (webhook hadn't) or the user hit Resend.
    // A pre-existing account with no resend gets no duplicate email.
    if (created || resend) await sendMagicLink(norm);
    return json({ email: norm });
  } catch (err) {
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
