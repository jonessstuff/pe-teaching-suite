/**
 * Edge Function: send-activation-emails
 *
 * One-off ACTIVATION campaign — a personal note from Stacey to trial/free users
 * who signed up and got in but never generated a lesson. Plain, personal; the
 * same wrap()/footer/unsubscribe shell as the other campaigns.
 *
 * WHO is encoded in the activation_campaign_recipients() SECURITY DEFINER RPC so
 * it matches the owner-reviewed segment EXACTLY: not owner, not opted out
 * (email_opt_out / marketing_optouts), email confirmed + has signed in,
 * subscription_status <> 'canceled', excluding test/hand-emailed addresses,
 * zero rows in lessons, and NOT already in activation_emails (one-per-user guard).
 *
 * Modes (POST body):
 *   {"mode":"sweep"}               -> LIVE send to all recipients in a single pass
 *   {"mode":"sweep","dryRun":true} -> resolve only; send nothing; return list + sample HTML
 *   {"mode":"test","to":"x@y.com"} -> send the real template to `to`, no tracking
 *
 * Auth: header  x-activation-secret: <ACTIVATION_CRON_SECRET>. Deployed --no-verify-jwt.
 * Secrets: RESEND_API_KEY, ACTIVATION_CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ACTIVATION_SECRET = Deno.env.get("ACTIVATION_CRON_SECRET");

const FROM = "PlansK12 <hello@plansk12.com>";
const REPLY_TO = "plansk12.com@gmail.com";
const SUBJECT = "The one thing that makes these lessons actually good";

// ── email template (same shell as the winback/whatsnew campaigns) ─────────────
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
    <p style="color:#9aa4b0;font-size:12px;margin:0;">You're getting this because you created a PlansK12 account. <a href="${unsubUrl}" style="color:#9aa4b0;text-decoration:underline;">Unsubscribe</a> — no hard feelings.</p>
  </td></tr></table>
</div>`;
}

function activationEmail(unsubUrl: string) {
  const inner = `
<p style="margin:0 0 14px;">Hi there,</p>
<p style="margin:0 0 14px;">Stacey here — PE and Health teacher, 27 years, and the person who built PlansK12.</p>
<p style="margin:0 0 14px;">You signed up and haven't made a lesson yet, and I have a guess as to why: you opened it, saw a list of modules, and weren't sure which one was yours or what to type in. That's a design problem on my end and I'm working on it.</p>
<p style="margin:0 0 14px;">In the meantime, here's the shortest path that works:</p>
<p style="margin:0 0 14px;">Pick the module closest to what you teach — close enough is fine, they overlap more than you'd think. Then when it asks what you need, be more specific than feels reasonable. Not "basketball unit" but "7th grade, 42 minutes, one gym shared with another class, eight balls, half my kids have never dribbled." The constraints are what make it good. Vague in, vague out.</p>
<p style="margin:0 0 14px;">That's it. Two minutes and you'll have something you could teach tomorrow.</p>
<p style="margin:18px 0 0;">Stacey Jones<br>PE &amp; Health teacher, 27 years<br><a href="https://plansk12.com" style="color:#4F7FFA;text-decoration:none;">plansk12.com</a></p>`;
  return { subject: SUBJECT, html: wrap(inner, unsubUrl) };
}

function unsubscribeUrl(token: string): string {
  return `${SUPABASE_URL}/functions/v1/email-unsubscribe?token=${token}`;
}

async function sendViaResend(to: string, subject: string, html: string, unsubUrl?: string): Promise<string | null> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const payload: Record<string, unknown> = { from: FROM, to: [to], reply_to: REPLY_TO, subject, html };
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
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(data as { message?: string })?.message ?? JSON.stringify(data)}`);
  return (data as { id?: string })?.id ?? null;
}

// ── handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);
  if (!ACTIVATION_SECRET || req.headers.get("x-activation-secret") !== ACTIVATION_SECRET) {
    return errorResponse("Unauthorized", 401);
  }

  let body: { mode?: string; dryRun?: boolean; to?: string } = {};
  try { body = await req.json(); } catch { /* empty body = sweep */ }
  const mode = body?.mode ?? "sweep";

  const admin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string);

  try {
    // Deliverability/preview test — renders the real template to `to`, no tracking.
    if (mode === "test") {
      const to = body?.to;
      if (!to) return errorResponse("test mode requires 'to'", 400);
      const { subject, html } = activationEmail(unsubscribeUrl("preview-token"));
      const id = await sendViaResend(to, `[TEST] ${subject}`, html, unsubscribeUrl("preview-token"));
      return jsonResponse({ ok: true, mode: "test", to, resend_id: id });
    }

    const dryRun = body?.dryRun === true;

    const { data: recips, error: rErr } = await admin.rpc("activation_campaign_recipients");
    if (rErr) throw rErr;
    const recipients = (recips ?? []) as Array<{ user_id: string; email: string; unsubscribe_token: string }>;

    if (dryRun) {
      const { html } = activationEmail(unsubscribeUrl("preview-token"));
      return jsonResponse({
        ok: true,
        dryRun: true,
        count: recipients.length,
        recipients: recipients.map((r) => r.email),
        reply_to: REPLY_TO,
        subject: SUBJECT,
        sample_html: html,
      });
    }

    // LIVE sweep — single pass, no stagger. Claim-first (insert into
    // activation_emails), then send; on send failure, release the claim so it
    // can be retried later.
    const results: Array<Record<string, unknown>> = [];
    for (const r of recipients) {
      const { data: claim, error: cErr } = await admin
        .from("activation_emails")
        .upsert({ user_id: r.user_id }, { onConflict: "user_id", ignoreDuplicates: true })
        .select();
      if (cErr) { results.push({ email: r.email, error: cErr.message }); continue; }
      if (!claim || claim.length === 0) continue; // already claimed/sent

      try {
        const unsubUrl = unsubscribeUrl(r.unsubscribe_token);
        const { subject, html } = activationEmail(unsubUrl);
        const id = await sendViaResend(r.email, subject, html, unsubUrl);
        await admin.from("activation_emails")
          .update({ resend_id: id, sent_at: new Date().toISOString() })
          .eq("user_id", r.user_id);
        results.push({ email: r.email, sent: true, resend_id: id });
      } catch (sendErr) {
        await admin.from("activation_emails").delete().eq("user_id", r.user_id);
        results.push({ email: r.email, error: String((sendErr as { message?: string })?.message ?? sendErr) });
      }
    }

    const sent = results.filter((x) => x.sent === true).length;
    return jsonResponse({ ok: true, mode: "sweep", count: results.length, sent, results });
  } catch (err) {
    return errorResponse((err as { message?: string })?.message ?? String(err), 500);
  }
});
