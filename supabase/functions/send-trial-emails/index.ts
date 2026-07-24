/**
 * Edge Function: send-trial-emails
 *
 * Drives the trial-to-paid email sequence via Resend:
 *   welcome   — first sweep after signup (day 0)
 *   midtrial  — day 3+ of the 7-day trial (feature discovery)
 *   nudge     — day 5+ (trial ending, upgrade CTA)
 *
 * Designed to run as a scheduled sweep (pg_cron -> pg_net -> this function,
 * every 15 min). Idempotent: each send is "claimed" by inserting into
 * trial_emails first (unique on user_id+email_type), so it never double-sends.
 * Only users still inside the created_at + TRIAL_DAYS window are considered;
 * owners and paid accounts are skipped.
 *
 * Auth: requires header  x-cron-secret: <CRON_SECRET>  (the sweep is invoked by
 * cron; a matching value gates all modes). Deployed with --no-verify-jwt.
 *
 * Secrets (Supabase Edge Function secrets):
 *   RESEND_API_KEY             — Resend API key (set by the project owner)
 *   CRON_SECRET                — shared secret gating this function
 *   SUPABASE_SERVICE_ROLE_KEY  — provided automatically; used to read auth.users
 *                                and profiles and to write trial_emails
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const FROM = "PlansK12 <hello@plansk12.com>";
const APP_URL = "https://plansk12.com";
// Existing-user upgrade Stripe link (immediate charge, no second trial).
const UPGRADE_URL = "https://buy.stripe.com/9B6aEP2858WkbG98820kE06";
const TRIAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PAID_STATUSES = new Set(["active", "past_due"]);

// ── email templates ──────────────────────────────────────────────────────────
function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#4F7FFA;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${text}</a>`;
}

function wrap(inner: string): string {
  return `<div style="background:#f4f6f8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e6eaee;">
      <tr><td style="padding:24px 32px 6px;">
        <span style="font-size:18px;font-weight:600;color:#1a1a2e;">Plans<span style="color:#4F7FFA;">K12</span></span>
      </td></tr>
      <tr><td style="padding:6px 32px 28px;color:#3a4451;font-size:15px;line-height:1.6;">${inner}</td></tr>
    </table>
    <p style="color:#9aa4b0;font-size:12px;margin:16px 0 0;">PlansK12 · Built for the teachers everyone forgets about</p>
  </td></tr></table>
</div>`;
}

function h1(text: string): string {
  return `<h1 style="font-size:20px;color:#1a1a2e;margin:8px 0 12px;">${text}</h1>`;
}

function welcomeEmail(name: string) {
  return {
    subject: "Welcome to PlansK12 — let's plan your first lesson",
    html: wrap(
      h1(`Welcome, ${name}!`) +
      `<p>You just started your 7-day free trial — you won't be charged until it ends, and you can cancel anytime before then. PlansK12 builds real, standards-aligned lesson plans in minutes for the subjects nobody else builds tools for.</p>` +
      `<p>Pick your module — PE, Art, Music, Library, STEM, CTE, reading &amp; math intervention, special education, ESL, counseling, early childhood and more — tell us your topic, and get a ready-to-teach plan.</p>` +
      `<p style="margin:24px 0;">${button("Create your first lesson", APP_URL)}</p>` +
      `<p style="color:#7a8592;font-size:13px;">Reply to this email if you get stuck — a real person reads it.</p>`
    ),
  };
}

function midtrialEmail(name: string) {
  return {
    subject: "A few PlansK12 tools you might've missed",
    html: wrap(
      h1(`You're a few days in, ${name} —`) +
      `<p>Here are a few things trial teachers often discover late:</p>` +
      `<ul style="padding-left:18px;margin:12px 0;">` +
      `<li style="margin-bottom:8px;"><b>Sub plans in seconds</b> — turn any lesson into a plan any substitute can follow.</li>` +
      `<li style="margin-bottom:8px;"><b>Full-year pacing guides</b> — map your whole year to your state's standards.</li>` +
      `<li style="margin-bottom:8px;"><b>Quizzes, rubrics &amp; exit tickets</b> — generated straight from the lesson you built.</li>` +
      `<li style="margin-bottom:8px;"><b>Parent newsletters</b> — jargon-free updates families actually read.</li>` +
      `</ul>` +
      `<p style="margin:24px 0;">${button("Explore your tools", APP_URL)}</p>`
    ),
  };
}

function nudgeEmail(name: string) {
  return {
    subject: "Your PlansK12 trial ends soon",
    html: wrap(
      h1(`Your trial is almost up, ${name}`) +
      `<p>Your 7-day free trial ends in a day or two. Keep every module, unlimited lessons, sub plans, quizzes, and exports by upgrading — it locks in the founding-teacher rate of <b>$6.99/month</b> (regularly $9.99).</p>` +
      `<p style="margin:24px 0;">${button("Upgrade &amp; keep planning", UPGRADE_URL)}</p>` +
      `<p style="color:#7a8592;font-size:13px;">Cancel anytime. Questions? Just reply.</p>`
    ),
  };
}

const TEMPLATES: Record<string, (name: string) => { subject: string; html: string }> = {
  welcome: welcomeEmail,
  midtrial: midtrialEmail,
  nudge: nudgeEmail,
};

async function sendViaResend(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(data as any)?.message ?? JSON.stringify(data)}`);
  return (data as any)?.id ?? null;
}

// ── handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  // Shared-secret gate (cron sends this header; also used for manual test/dry-run).
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return errorResponse("Unauthorized", 401);
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body = sweep */ }
  const mode = body?.mode ?? "sweep";

  const admin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string);

  try {
    // One-off deliverability test — sends the welcome template to `to`, no tracking.
    if (mode === "test") {
      const to = body?.to;
      if (!to) return errorResponse("test mode requires 'to'", 400);
      const { subject, html } = welcomeEmail(body?.name ?? "there");
      const id = await sendViaResend(to, `[TEST] ${subject}`, html);
      return jsonResponse({ ok: true, mode: "test", to, resend_id: id });
    }

    const dryRun = body?.dryRun === true;

    const { data: profiles, error: pErr } = await admin.from("profiles").select("*");
    if (pErr) throw pErr;

    const { data: userList, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (uErr) throw uErr;
    const emailById = new Map<string, string | undefined>((userList?.users ?? []).map((u) => [u.id, u.email]));

    const { data: sentRows, error: sErr } = await admin.from("trial_emails").select("user_id, email_type");
    if (sErr) throw sErr;
    const sent = new Set((sentRows ?? []).map((r: any) => `${r.user_id}:${r.email_type}`));

    const now = Date.now();
    const results: any[] = [];

    for (const p of (profiles ?? []) as any[]) {
      if (p.is_owner === true) continue;
      if (PAID_STATUSES.has(p.subscription_status ?? "")) continue;
      const email = emailById.get(p.id);
      if (!email || !p.created_at) continue;

      const days = Math.floor((now - new Date(p.created_at).getTime()) / MS_PER_DAY);
      if (days < 0 || days >= TRIAL_DAYS) continue; // only within the trial window

      const due: string[] = [];
      if (!sent.has(`${p.id}:welcome`)) due.push("welcome");
      if (days >= 3 && !sent.has(`${p.id}:midtrial`)) due.push("midtrial");
      if (days >= 5 && !sent.has(`${p.id}:nudge`)) due.push("nudge");
      if (due.length === 0) continue;

      const firstName = (p.full_name ?? "").trim().split(/\s+/)[0] || "there";

      for (const type of due) {
        if (dryRun) { results.push({ user: p.id, email, type, days, dryRun: true }); continue; }

        // Claim the send atomically. Insert-first; on conflict this returns [] and we skip.
        const { data: claim, error: cErr } = await admin
          .from("trial_emails")
          .upsert({ user_id: p.id, email_type: type }, { onConflict: "user_id,email_type", ignoreDuplicates: true })
          .select();
        if (cErr) { results.push({ user: p.id, type, error: cErr.message }); continue; }
        if (!claim || claim.length === 0) continue; // already claimed by a prior run

        try {
          const { subject, html } = TEMPLATES[type](firstName);
          const id = await sendViaResend(email, subject, html);
          await admin.from("trial_emails")
            .update({ resend_id: id, sent_at: new Date().toISOString() })
            .eq("user_id", p.id).eq("email_type", type);
          results.push({ user: p.id, type, sent: true, resend_id: id });
        } catch (sendErr) {
          // Release the claim so a later sweep retries this send.
          await admin.from("trial_emails").delete().eq("user_id", p.id).eq("email_type", type);
          results.push({ user: p.id, type, error: String((sendErr as any)?.message ?? sendErr) });
        }
      }
    }

    return jsonResponse({ ok: true, mode: "sweep", dryRun, count: results.length, results });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
