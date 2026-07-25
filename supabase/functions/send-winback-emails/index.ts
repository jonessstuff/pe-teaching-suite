/**
 * Edge Function: send-winback-emails
 *
 * Win-back campaign — re-engages users who canceled a subscription or let their
 * trial expire, showing them how much the platform has grown ("look what's new
 * since you left"). Warm, no-pressure; a low-friction /try free-lesson link plus
 * a come-back CTA.
 *
 * WHO gets it (classified LIVE against Stripe — there is no cached status column
 * in this DB, and a lapsed user who never logged back in would have a stale one):
 *   - Canceled/unpaid/incomplete_expired/paused Stripe subscription, and it has
 *     been >= WINBACK_DELAY_DAYS since it ended.
 *   - OR no Stripe subscription at all and the free trial elapsed long ago
 *     (created_at + TRIAL_DAYS + WINBACK_DELAY_DAYS in the past).
 * SKIPPED: owners, opted-out users (email_opt_out), anyone currently
 *   active/trialing/past_due (they came back), and anyone already sent (the
 *   winback_emails table is a hard one-per-user idempotency guard).
 *
 * The same sweep serves BOTH the one-time backlog send and the ongoing
 * automation: on its first run it reaches everyone already past the delay; on
 * later daily runs it picks up each user as they cross the delay threshold.
 *
 * Modes (POST body):
 *   {"mode":"sweep"}                 -> live send (default)
 *   {"mode":"sweep","dryRun":true}   -> classify only, send nothing, return the list
 *   {"mode":"test","to":"x@y.com"}   -> send the win-back template to `to`, no tracking
 *
 * Auth: header  x-cron-secret: <CRON_SECRET>. Deployed with --no-verify-jwt.
 *
 * Secrets (project-wide Edge Function secrets, already configured):
 *   RESEND_API_KEY, STRIPE_SECRET_KEY, CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const FROM = "PlansK12 <hello@plansk12.com>";
const APP_URL = "https://plansk12.com";
const TRY_URL = `${APP_URL}/try`;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;          // free-trial length (matches send-trial-emails)
const WINBACK_DELAY_DAYS = 21; // ~3 weeks after the lapse before we reach out

// Stripe statuses that mean "currently engaged" -> never a win-back target.
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
// Stripe statuses that mean "lapsed" -> candidate once the delay elapses.
const LAPSED_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired", "paused"]);

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
    <p style="color:#9aa4b0;font-size:12px;margin:0;">You're getting this because you had a PlansK12 account. <a href="${unsubUrl}" style="color:#9aa4b0;text-decoration:underline;">Unsubscribe</a> — no hard feelings.</p>
  </td></tr></table>
</div>`;
}

function h1(text: string): string {
  return `<h1 style="font-size:20px;color:#1a1a2e;margin:8px 0 12px;">${text}</h1>`;
}

function winbackEmail(name: string, unsubUrl: string) {
  return {
    subject: "Look what's new at PlansK12 since you left",
    html: wrap(
      h1(`Hi ${name} — it's been a while`) +
      `<p>You tried PlansK12 back when it was mostly a handful of modules. It has grown a <i>lot</i> since then — we're now past <b>20+ specialties</b>, most of them built for the teachers no one else makes tools for.</p>` +
      `<p>A few that are new or much deeper since you last looked:</p>` +
      `<ul style="padding-left:18px;margin:12px 0;">` +
      `<li style="margin-bottom:7px;"><b>Gifted &amp; Talented</b>, <b>Special Education</b>, and <b>ESL / ELL</b> planning</li>` +
      `<li style="margin-bottom:7px;"><b>School Counselors</b> and <b>Speech-Language Pathology</b></li>` +
      `<li style="margin-bottom:7px;"><b>Reading &amp; Math Specialists</b> — with a dedicated <b>Tutoring Mode</b></li>` +
      `<li style="margin-bottom:7px;">A full <b>Classroom Management</b> suite (behavior notes, ABC data, CICO, parent comms)</li>` +
      `<li style="margin-bottom:7px;"><b>Intervention / MTSS</b> planning and <b>Staff PD</b> for building leaders</li>` +
      `<li style="margin-bottom:7px;">…and more, across PE, Art, Music, Library, STEM, CTE and early childhood</li>` +
      `</ul>` +
      `<p>No pressure at all — you don't need to start a trial just to see how far it's come. The quickest way is to build one real lesson, free, no sign-in:</p>` +
      `<p style="margin:22px 0;">${button("Try a free lesson", TRY_URL)}</p>` +
      `<p style="color:#3a4451;">If it clicks and you want everything back, you can jump in and start a fresh trial anytime:</p>` +
      `<p style="margin:18px 0 8px;">${button("Come back to PlansK12", APP_URL)}</p>` +
      `<p style="color:#7a8592;font-size:13px;margin-top:20px;">Either way, thanks for giving us a look the first time. Reply if there's a subject you wish we covered — a real person reads it.</p>`,
      unsubUrl,
    ),
  };
}

// ── Stripe classification ────────────────────────────────────────────────────
function stripeGet(path: string) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  }).then((r) => r.json());
}

/**
 * Returns { state, lapseAtMs } where state is:
 *   'active'        -> currently engaged; skip
 *   'lapsed_sub'    -> had a subscription that ended at lapseAtMs
 *   'trial_expired' -> never subscribed; trial ended at lapseAtMs (created+TRIAL_DAYS)
 */
async function classify(email: string | undefined, createdAt: string): Promise<{ state: string; lapseAtMs: number | null }> {
  let bestActive = false;
  let lapseAtMs: number | null = null;

  if (STRIPE_SECRET_KEY && email) {
    const custData = await stripeGet(`customers?email=${encodeURIComponent(email)}&limit=100`);
    const customers = custData?.data ?? [];
    for (const cust of customers) {
      const subData = await stripeGet(`subscriptions?customer=${cust.id}&status=all&limit=100`);
      for (const sub of subData?.data ?? []) {
        if (ACTIVE_STATUSES.has(sub.status)) {
          bestActive = true;
        } else if (LAPSED_STATUSES.has(sub.status)) {
          // Prefer canceled_at/ended_at; fall back to period end if absent.
          const endedSec = sub.canceled_at ?? sub.ended_at ?? sub.current_period_end ?? null;
          if (endedSec) {
            const ms = endedSec * 1000;
            if (lapseAtMs === null || ms > lapseAtMs) lapseAtMs = ms;
          }
        }
      }
    }
  }

  if (bestActive) return { state: "active", lapseAtMs: null };
  if (lapseAtMs !== null) return { state: "lapsed_sub", lapseAtMs };
  // No active and no lapsed subscription on record -> treat as expired trial.
  const trialLapse = new Date(createdAt).getTime() + TRIAL_DAYS * MS_PER_DAY;
  return { state: "trial_expired", lapseAtMs: trialLapse };
}

async function sendViaResend(to: string, subject: string, html: string, unsubUrl?: string): Promise<string | null> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const payload: any = { from: FROM, to: [to], subject, html };
  if (unsubUrl) {
    // One-click unsubscribe for deliverability (RFC 8058).
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
    // Deliverability/preview test — renders the real template to `to`, no tracking.
    if (mode === "test") {
      const to = body?.to;
      if (!to) return errorResponse("test mode requires 'to'", 400);
      const { subject, html } = winbackEmail(body?.name ?? "there", unsubscribeUrl("preview-token"));
      const id = await sendViaResend(to, `[TEST] ${subject}`, html);
      return jsonResponse({ ok: true, mode: "test", to, resend_id: id });
    }

    const dryRun = body?.dryRun === true;

    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id, full_name, created_at, is_owner, email_opt_out, unsubscribe_token");
    if (pErr) throw pErr;

    const { data: userList, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (uErr) throw uErr;
    const emailById = new Map<string, string | undefined>((userList?.users ?? []).map((u) => [u.id, u.email]));

    const { data: sentRows, error: sErr } = await admin.from("winback_emails").select("user_id");
    if (sErr) throw sErr;
    const sent = new Set((sentRows ?? []).map((r: any) => r.user_id));

    const now = Date.now();
    const results: any[] = [];

    for (const p of (profiles ?? []) as any[]) {
      if (p.is_owner === true) continue;
      if (p.email_opt_out === true) continue;
      if (sent.has(p.id)) continue;
      const email = emailById.get(p.id);
      if (!email || !p.created_at) continue;

      const { state, lapseAtMs } = await classify(email, p.created_at);
      if (state === "active" || lapseAtMs === null) continue;

      const daysSinceLapse = Math.floor((now - lapseAtMs) / MS_PER_DAY);
      if (daysSinceLapse < WINBACK_DELAY_DAYS) continue; // still inside the grace window

      const firstName = (p.full_name ?? "").trim().split(/\s+/)[0] || "there";
      const lapseDate = new Date(lapseAtMs).toISOString().slice(0, 10);

      if (dryRun) {
        results.push({ user: p.id, email, state, lapsed_on: lapseDate, days_since_lapse: daysSinceLapse });
        continue;
      }

      // Claim the send atomically (insert-first; on conflict returns [] -> skip).
      const { data: claim, error: cErr } = await admin
        .from("winback_emails")
        .upsert({ user_id: p.id }, { onConflict: "user_id", ignoreDuplicates: true })
        .select();
      if (cErr) { results.push({ user: p.id, error: cErr.message }); continue; }
      if (!claim || claim.length === 0) continue; // already claimed by a prior run

      try {
        const unsubUrl = unsubscribeUrl(p.unsubscribe_token);
        const { subject, html } = winbackEmail(firstName, unsubUrl);
        const id = await sendViaResend(email, subject, html, unsubUrl);
        await admin.from("winback_emails")
          .update({ resend_id: id, sent_at: new Date().toISOString() })
          .eq("user_id", p.id);
        results.push({ user: p.id, email, state, lapsed_on: lapseDate, sent: true, resend_id: id });
      } catch (sendErr) {
        // Release the claim so a later sweep retries this send.
        await admin.from("winback_emails").delete().eq("user_id", p.id);
        results.push({ user: p.id, email, error: String((sendErr as any)?.message ?? sendErr) });
      }
    }

    return jsonResponse({ ok: true, mode: "sweep", dryRun, count: results.length, results });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
