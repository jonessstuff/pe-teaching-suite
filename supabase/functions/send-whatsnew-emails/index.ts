/**
 * Edge Function: send-whatsnew-emails
 *
 * One-time "here's everything that's new" update to CURRENT ACTIVE PAYING
 * subscribers — a warm thank-you + highlight reel of how much the platform has
 * grown.
 *
 * AUDIENCE IS SOURCED FROM STRIPE, not from profiles. "Who is paying" lives in
 * Stripe; some payers subscribed via a payment link and have NO PlansK12 account
 * (or pay under a different email than their login), so an accounts-first sweep
 * silently misses them. We list every subscription with status === "active",
 * take the customer email, and:
 *   - match it to a profile (by login email) when one exists — for the first
 *     name, the profiles-based unsubscribe token, and the email_opt_out flag;
 *   - for account-less payers, use an email-based unsubscribe (marketing_optouts).
 * SKIPPED: owners, opted-out (profiles.email_opt_out OR marketing_optouts), and
 *   anyone already sent (whatsnew_emails is keyed by email — a hard one-per-
 *   address idempotency guard).
 *
 * Modes (POST body):
 *   {"mode":"sweep","dryRun":true}   -> classify only, send nothing, return the list  (SAFE)
 *   {"mode":"test","to":"x@y.com"}   -> send the real template to `to`, no tracking
 *   {"mode":"sweep"}                 -> LIVE bulk send to all active payers
 *
 * Auth: header  x-cron-secret: <CRON_SECRET>. Deploy with --no-verify-jwt.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const FROM = "PlansK12 <hello@plansk12.com>"; // same sender as the win-back campaign
const APP_URL = "https://plansk12.com";

// ── email template ───────────────────────────────────────────────────────────
function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#4F7FFA;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${text}</a>`;
}

function wrap(inner: string, unsubUrl: string): string {
  return `<div style="background:#f4f6f8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e6eaee;">
      <tr><td style="padding:24px 32px 6px;">
        <span style="font-size:18px;font-weight:600;color:#1a1a2e;">Plans<span style="color:#4F7FFA;">K12</span></span>
      </td></tr>
      <tr><td style="padding:6px 32px 28px;color:#3a4451;font-size:15px;line-height:1.6;">${inner}</td></tr>
    </table>
    <p style="color:#9aa4b0;font-size:12px;margin:16px 0 4px;">PlansK12 · Built for the teachers everyone forgets about</p>
    <p style="color:#9aa4b0;font-size:12px;margin:0;">You're getting this because you have a PlansK12 subscription. <a href="${unsubUrl}" style="color:#9aa4b0;text-decoration:underline;">Unsubscribe from updates</a>.</p>
  </td></tr></table>
</div>`;
}

function h1(text: string): string {
  return `<h1 style="font-size:20px;color:#1a1a2e;margin:8px 0 12px;">${text}</h1>`;
}

function whatsnewEmail(name: string, unsubUrl: string) {
  return {
    subject: "Look how much PlansK12 has grown",
    html: wrap(
      h1(`Hi ${name} — a look at everything that's new`) +
      `<p>When you subscribed, PlansK12 turned a topic into a ready-to-teach lesson in seconds. Since then it has grown into something a good deal bigger — and because you're one of the teachers who's been here supporting it, I wanted to show you what's new. It's all already included in your subscription.</p>` +
      `<ul style="padding-left:18px;margin:14px 0;">` +
      `<li style="margin-bottom:9px;"><b>Every module now has a real home base.</b> Not just a generator — a dashboard with the tools that actually save time: a schedule that auto-fills your periods, an Assessment Bank, a Standards Tracker, a Pacing Guide, an Activity Bank, an end-of-year narrative writer, and a portfolio builder (wherever they fit the subject).</li>` +
      `<li style="margin-bottom:9px;"><b>Every lesson now has one-click follow-ups.</b> Generate a lesson, then spin off a quiz, a rubric, a sub plan, a parent note, an exit ticket, or a differentiated version — right from the lesson, wherever it makes sense.</li>` +
      `<li style="margin-bottom:9px;"><b>Dozens of new specialties.</b> All 16 CTE pathways are complete; OT, PT, SLP, Teacher of the Visually Impaired and Deaf/Hard-of-Hearing; World Languages, Theater, Dance, JROTC, Elementary Technology, Instructional Coaching, After-School Clubs (68 club types), Test Prep — and more.</li>` +
      `<li style="margin-bottom:9px;"><b>Favorites.</b> Pin the modules you use most so they sit right at the top.</li>` +
      `<li style="margin-bottom:9px;"><b>A reliable multi-day Unit Builder.</b> Plan a whole unit day-by-day, with each day building on the last — across every module.</li>` +
      `<li style="margin-bottom:9px;"><b>Add it to your phone.</b> PlansK12 now installs to your home screen with a real branded app icon.</li>` +
      `</ul>` +
      `<p style="margin:22px 0;">${button("Explore what's new", APP_URL)}</p>` +
      `<p style="color:#7a8592;font-size:13px;margin-top:20px;">Thank you for being here — genuinely. Teachers like you are the reason this keeps growing. Reply anytime; a real person reads every message, and if there's something you wish PlansK12 did, I want to hear it.</p>`,
      unsubUrl,
    ),
  };
}

// ── Stripe ───────────────────────────────────────────────────────────────────
function stripeGet(path: string) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  }).then((r) => r.json());
}

// Every Stripe customer with a subscription currently in status "active"
// (paying) — deduped by lowercased email. Excludes trialing/past_due/canceled.
async function activePayers(): Promise<Map<string, { email: string; name: string }>> {
  const out = new Map<string, { email: string; name: string }>();
  if (!STRIPE_SECRET_KEY) return out;
  let startingAfter: string | null = null;
  do {
    const q = `subscriptions?status=active&limit=100&expand[]=data.customer${startingAfter ? `&starting_after=${startingAfter}` : ""}`;
    const page = await stripeGet(q);
    const data = page?.data ?? [];
    for (const sub of data) {
      const cust = sub?.customer;
      const email = typeof cust === "object" ? cust?.email : null;
      if (email && !cust?.deleted) {
        out.set(String(email).toLowerCase(), { email, name: cust?.name ?? "" });
      }
    }
    startingAfter = page?.has_more && data.length ? data[data.length - 1].id : null;
  } while (startingAfter);
  return out;
}

function firstNameFrom(...candidates: (string | undefined | null)[]): string {
  for (const c of candidates) {
    const n = (c ?? "").trim().split(/\s+/)[0];
    if (n) return n;
  }
  return "there";
}

async function sendViaResend(to: string, subject: string, html: string, unsubUrl?: string): Promise<string | null> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const payload: any = { from: FROM, to: [to], subject, html };
  if (unsubUrl) {
    payload.headers = {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(data as any)?.message ?? JSON.stringify(data)}`);
  return (data as any)?.id ?? null;
}

function unsubscribeUrl(token: string): string {
  return `${SUPABASE_URL}/functions/v1/email-unsubscribe?token=${token}`;
}

// ── handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return errorResponse("Unauthorized", 401);
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body = sweep */ }
  const mode = body?.mode ?? "sweep";

  const admin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string);

  try {
    if (mode === "test") {
      const to = body?.to;
      if (!to) return errorResponse("test mode requires 'to'", 400);
      const { subject, html } = whatsnewEmail(body?.name ?? "there", unsubscribeUrl("preview-token"));
      const id = await sendViaResend(to, `[TEST] ${subject}`, html);
      return jsonResponse({ ok: true, mode: "test", to, resend_id: id });
    }

    const dryRun = body?.dryRun === true;

    // 1) Audience = active Stripe payers.
    const payers = await activePayers();

    // 2) Match to accounts (by login email) for name / opt-out / unsubscribe token.
    const { data: profiles, error: pErr } = await admin
      .from("profiles").select("id, full_name, is_owner, email_opt_out, unsubscribe_token");
    if (pErr) throw pErr;
    const { data: userList, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (uErr) throw uErr;
    const emailById = new Map<string, string>((userList?.users ?? []).map((u) => [u.id, (u.email ?? "").toLowerCase()]));
    const profileByEmail = new Map<string, any>();
    for (const p of (profiles ?? []) as any[]) {
      const em = emailById.get(p.id);
      if (em) profileByEmail.set(em, p);
    }

    // 3) Suppression + dedup sets.
    const { data: optRows } = await admin.from("marketing_optouts").select("email, opted_out");
    const emailOptedOut = new Set((optRows ?? []).filter((r: any) => r.opted_out).map((r: any) => String(r.email).toLowerCase()));
    const { data: sentRows, error: sErr } = await admin.from("whatsnew_emails").select("email");
    if (sErr) throw sErr;
    const alreadySent = new Set((sentRows ?? []).map((r: any) => String(r.email).toLowerCase()));

    const results: any[] = [];
    let skippedOwner = 0, skippedOptOut = 0, skippedSent = 0;

    for (const [lowerEmail, cust] of payers) {
      const profile = profileByEmail.get(lowerEmail);
      if (profile?.is_owner === true) { skippedOwner++; continue; }
      if (profile?.email_opt_out === true) { skippedOptOut++; continue; }
      if (!profile && emailOptedOut.has(lowerEmail)) { skippedOptOut++; continue; }
      if (alreadySent.has(lowerEmail)) { skippedSent++; continue; }

      const firstName = firstNameFrom(profile?.full_name, cust.name);
      const hasAccount = !!profile;

      if (dryRun) {
        results.push({ email: cust.email, first_name: firstName, has_account: hasAccount });
        continue;
      }

      // Resolve the unsubscribe token: profile token, or an email-based one.
      let token: string | undefined = profile?.unsubscribe_token;
      if (!token) {
        const { data: opt, error: oErr } = await admin
          .from("marketing_optouts")
          .upsert({ email: lowerEmail }, { onConflict: "email", ignoreDuplicates: false })
          .select("token")
          .single();
        if (oErr) { results.push({ email: cust.email, error: `optout upsert: ${oErr.message}` }); continue; }
        token = opt?.token;
      }

      // Claim the send atomically by email (insert-first; conflict -> skip).
      const { data: claim, error: cErr } = await admin
        .from("whatsnew_emails")
        .upsert({ email: lowerEmail, user_id: profile?.id ?? null }, { onConflict: "email", ignoreDuplicates: true })
        .select();
      if (cErr) { results.push({ email: cust.email, error: cErr.message }); continue; }
      if (!claim || claim.length === 0) { skippedSent++; continue; }

      try {
        const unsubUrl = unsubscribeUrl(token as string);
        const { subject, html } = whatsnewEmail(firstName, unsubUrl);
        const id = await sendViaResend(cust.email, subject, html, unsubUrl);
        await admin.from("whatsnew_emails").update({ resend_id: id }).eq("email", lowerEmail);
        results.push({ email: cust.email, has_account: hasAccount, sent: true, resend_id: id });
      } catch (sendErr) {
        await admin.from("whatsnew_emails").delete().eq("email", lowerEmail); // release for retry
        results.push({ email: cust.email, error: String((sendErr as any)?.message ?? sendErr) });
      }
    }

    return jsonResponse({
      ok: true, mode: "sweep", dryRun,
      active_payers_found: payers.size,
      skipped: { owner: skippedOwner, opted_out: skippedOptOut, already_sent: skippedSent },
      count: results.length, results,
    });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
