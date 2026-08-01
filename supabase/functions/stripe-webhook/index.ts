// Stripe webhook — closes the "paid but no account" gap.
//
// AUTH: this endpoint is public (deployed --no-verify-jwt, because Stripe can't
// send a Supabase JWT). It is authenticated instead by verifying Stripe's
// signature against STRIPE_WEBHOOK_SECRET. Requests without a valid signature
// are rejected before any work happens.
//
// It does NOT go live until the endpoint + secret are configured in Stripe.
// Until then it is deployed but receives no events.
//
// Events handled:
//   checkout.session.completed          -> resolve/create the account, link it,
//                                          cache status, email a magic link (new only)
//   customer.subscription.created/updated/deleted, invoice.paid
//                                       -> refresh the cached status on an
//                                          already-linked account (never creates)
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&deno-std=0.177.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { pickBestStatus } from "../_shared/subscriptionStatus.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const FROM = "PlansK12 <hello@plansk12.com>";
const SITE = "https://plansk12.com";

// ── Account matching / provisioning ──────────────────────────────────────────
// Returns the Supabase user id for a payer email, creating the account if none
// exists. This is the piece that must never link the wrong person, so the three
// tricky cases are handled explicitly:
//
//   • email already exists            -> we LINK to that existing account and
//                                        create nothing (created:false).
//   • email exists in a different case-> we normalize to lower() on BOTH the
//                                        lookup and the create. Supabase stores
//                                        emails lower-cased and unique, so
//                                        "Jane@x.com" and "jane@x.com" resolve to
//                                        the same single account — never a dup.
//   • two Stripe customers, one email -> auth allows only ONE account per email,
//                                        so both Stripe customers map to that one
//                                        account (this is the Doreen case: dup
//                                        customers, same person). We link it and
//                                        let entitlement resolve by email (which
//                                        picks the best status across all her
//                                        subscriptions). No second account, no
//                                        wrong link.
//
// Residual risk we CANNOT resolve here (documented, not hidden): if someone pays
// with an email that a *different* real person already registered (a shared or
// family inbox), email-as-key links them to that existing account. The only true
// fix is identity-at-checkout (client_reference_id), which the payment-link
// funnel doesn't force. Flagged for the owner.
async function resolveOrCreateUser(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const existing = await admin.rpc("get_user_id_by_email", { p_email: email });
  if (existing.data) return { userId: existing.data as string, email, created: false };

  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) {
    // Race: a concurrent event just created it. Re-look-up and link; never dup.
    const again = await admin.rpc("get_user_id_by_email", { p_email: email });
    if (again.data) return { userId: again.data as string, email, created: false };
    throw created.error;
  }
  return { userId: created.data.user.id, email, created: true };
}

async function cacheStatus(
  userId: string,
  customerId: string | null,
  status: string | null,
  trialEnd: number | null,
) {
  const patch: Record<string, unknown> = {
    subscription_status: status,
    trial_ends_at: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
    subscription_synced_at: new Date().toISOString(),
  };
  if (customerId) patch.stripe_customer_id = customerId;
  await admin.from("profiles").update(patch).eq("id", userId);
}

// Write the Stripe customer's name to full_name, but ONLY when it is currently
// null — never overwrite a name the teacher has since set. Additive to the
// provisioning writes; does not touch stripe_customer_id / status handling.
async function setNameIfNull(userId: string, name: string | null | undefined) {
  if (!name) return;
  await admin.from("profiles").update({ full_name: name }).eq("id", userId).is("full_name", null);
}

// Branded magic-link email (own Resend template, not Supabase's default), so it
// matches the /welcome page copy and reads as legitimate, not a scam or a charge.
async function sendSetupEmail(email: string) {
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
      <p>Thanks for subscribing to PlansK12 — your 7-day free trial is active. You won't be charged until it ends, and you can cancel anytime.</p>
      <p><strong>One tap to log in</strong> — no password needed:</p>
      <p><a href="${actionLink}" style="display:inline-block;background:#4f46e5;color:#fff;
         padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">
         Log in to PlansK12</a></p>
      <p style="color:#6b7280;font-size:13px">Tap the button above to log in and build your first lesson — it takes about a minute. You can set a password later so you can skip the link next time.</p>
      <p style="color:#9aa4b0;font-size:12px">If you didn't subscribe to PlansK12, you can ignore this email.</p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [email], subject: "You're in — here's your PlansK12 login", html }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

// Look up an already-linked user for subscription/invoice events (no creation).
async function findLinkedUser(customerId: string, email: string | null) {
  // Primary + durable: match on the Stripe customer id (the join key).
  const byCust = await admin.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  if (byCust.data?.id) return byCust.data.id as string;

  // Email fallback — link ONLY an account that has NO customer id yet (a genuinely
  // new payer). If the account already has a DIFFERENT, deliberately-set
  // stripe_customer_id (byCust didn't match above, so it isn't this customer), we
  // must NOT link this event to it: caching it would clobber that keeper with a
  // different — often duplicate or canceled — customer's status (the exact bug
  // that broke every duplicate-trial cleanup). Such an event is genuinely
  // unmatched to this customer, so the caller logs it instead of overwriting.
  if (email) {
    const byEmail = await admin.rpc("get_user_id_by_email", { p_email: email.trim().toLowerCase() });
    const uid = byEmail.data as string | null;
    if (uid) {
      const { data: prof } = await admin
        .from("profiles").select("stripe_customer_id").eq("id", uid).maybeSingle();
      if ((prof?.stripe_customer_id ?? null) === null) return uid; // no keeper set yet → safe to link
    }
  }
  return null;
}

// The customer's BEST current status across ALL their subscriptions (mirrors
// Stripe, incl. downgrades). THROWS on a Stripe API error — the caller must let
// it propagate so the event 500s and Stripe retries, rather than caching a
// downgrade from a failed read (fail closed).
async function bestStatusForCustomer(customerId: string) {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  return pickBestStatus(subs.data.map((s) => ({ status: s.status, trial_end: s.trial_end })));
}

// Record a Stripe customer we could not attach to any account, so unmatched
// payers surface instead of failing silently. Repeats bump seen_count.
async function logUnmatched(
  customerId: string | null,
  email: string | null,
  eventType: string,
  status: string | null,
  amountCents: number | null,
) {
  await admin.rpc("log_billing_unmatched", {
    p_customer_id: customerId,
    p_email: email,
    p_event_type: eventType,
    p_status: status,
    p_amount: amountCents,
  });
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();
  if (!sig || !secret) return new Response("missing signature/secret", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret, undefined, cryptoProvider);
  } catch (err) {
    return new Response(`signature verification failed: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const email = s.customer_details?.email ?? s.customer_email;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
        if (!email) {
          // No email to link on — surface it instead of silently dropping.
          await logUnmatched(customerId, null, event.type, null, null);
          break;
        }
        const { userId, created } = await resolveOrCreateUser(email);

        // Mirror Stripe: cache the customer's BEST current status across all subs
        // (not a single guessed one). Throws on Stripe error → event 500s & retries.
        const best = customerId ? await bestStatusForCustomer(customerId) : null;
        await cacheStatus(userId, customerId, best?.status ?? null, best?.trialEnd ?? null);
        await setNameIfNull(userId, s.customer_details?.name ?? null); // seed full_name from Stripe (if unset)
        if (created) await sendSetupEmail(email); // magic link ONLY for brand-new accounts
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const cust = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = await findLinkedUser(customerId, cust.email ?? null);
        if (!userId) {
          await logUnmatched(customerId, cust.email ?? null, event.type, sub.status, null);
          break; // never creates an account off a bare subscription event
        }
        // Best-of-all-subs so a canceled-sub event can't hide a still-active one,
        // and a genuine cancellation correctly downgrades. Throws on Stripe error.
        const best = await bestStatusForCustomer(customerId);
        await cacheStatus(userId, customerId, best?.status ?? null, best?.trialEnd ?? null);
        await setNameIfNull(userId, (cust as Stripe.Customer).name ?? null);
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null;
        if (!customerId) break;
        const cust = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userId = await findLinkedUser(customerId, cust.email ?? null);
        if (!userId) {
          // Paid but unmatched — the exact "charged, no account" case to surface.
          await logUnmatched(customerId, cust.email ?? null, event.type, null, inv.amount_paid ?? null);
          break;
        }
        const best = await bestStatusForCustomer(customerId);
        await cacheStatus(userId, customerId, best?.status ?? "active", best?.trialEnd ?? null);
        await setNameIfNull(userId, (cust as Stripe.Customer).name ?? null);
        break;
      }
    }
  } catch (err) {
    // Non-2xx makes Stripe retry (good — transient failures self-heal).
    console.error(`handler error for ${event.type}:`, err?.message ?? err);
    return new Response(`handler error: ${err?.message ?? err}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
