/**
 * Edge Function: lead-magnet
 *
 * Powers the "try one free lesson — no signup" lead magnet. Actions (POST body
 * { action: ... }):
 *   start    — capture email, gate (1/email + per-IP daily cap), return a token
 *   finalize — store the client-generated lesson, send the welcome email
 *   view     — public fetch of a stored lesson by token (the email links here)
 *   sweep    — cron: send the day-later follow-up nudge (gated by x-cron-secret)
 *
 * The actual lesson generation happens client-side against the existing
 * generate-* functions (they're anon-callable), so no long AI call is nested
 * inside this function. Deployed with --no-verify-jwt; `sweep` is the only
 * privileged action and requires the cron secret.
 *
 * Secrets: RESEND_API_KEY, CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY (auto).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const FROM = "PlansK12 <hello@plansk12.com>";
const APP_URL = "https://plansk12.com";
// New-user 7-day free-trial checkout.
const CHECKOUT_URL = "https://buy.stripe.com/5kQ5kveUR2xWh0tcoi0kE05";
const OFFER_HOURS = 48;
const IP_CAP_24H = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MS_HOUR = 60 * 60 * 1000;

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || "unknown";
}

// ── email templates (Resend API) ─────────────────────────────────────────────
function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#4F7FFA;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${text}</a>`;
}
function wrap(inner: string): string {
  return `<div style="background:#f4f6f8;padding:24px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e6eaee;">
      <tr><td style="padding:24px 32px 6px;"><span style="font-size:18px;font-weight:600;color:#1a1a2e;">Plans<span style="color:#4F7FFA;">K12</span></span></td></tr>
      <tr><td style="padding:6px 32px 28px;color:#3a4451;font-size:15px;line-height:1.6;">${inner}</td></tr>
    </table>
    <p style="color:#9aa4b0;font-size:12px;margin:16px 0 0;">PlansK12 · Built for the teachers everyone forgets about</p>
  </td></tr></table>
</div>`;
}

function welcomeEmail(token: string, topic: string | null) {
  const link = `${APP_URL}/free-lesson/${token}`;
  return {
    subject: "Here's your free PlansK12 lesson",
    html: wrap(
      `<h1 style="font-size:20px;color:#1a1a2e;margin:8px 0 12px;">Your free lesson is ready 🎉</h1>` +
      `<p>Thanks for trying PlansK12! Your${topic ? ` <b>${topic}</b>` : ""} lesson is generated and saved — open it any time with the link below.</p>` +
      `<p style="margin:24px 0;">${button("View your free lesson", link)}</p>` +
      `<p style="color:#7a8592;font-size:13px;">This is a complete, standards-aligned lesson — the same kind PlansK12 builds for PE, Art, Music, Library, STEM, and 15+ specialties. Want the rest? Start a 7-day free trial anytime.</p>` +
      `<p style="margin:20px 0 0;">${button("Start your free trial", CHECKOUT_URL)}</p>`
    ),
  };
}

function followupEmail() {
  return {
    subject: "There's a lot more where that lesson came from",
    html: wrap(
      `<h1 style="font-size:20px;color:#1a1a2e;margin:8px 0 12px;">How was your free lesson?</h1>` +
      `<p>That was one lesson from one module. PlansK12 plans for <b>every</b> teacher in the building:</p>` +
      `<ul style="padding-left:18px;margin:12px 0;">` +
      `<li style="margin-bottom:6px;">PE &amp; Health, Art, Music, Library, STEM, Adaptive PE, CTE</li>` +
      `<li style="margin-bottom:6px;">Reading &amp; Math intervention, Gifted &amp; Talented, Special Education, ESL</li>` +
      `<li style="margin-bottom:6px;">School Counselors, SLP, Student Support, Early Childhood / Pre-K</li>` +
      `</ul>` +
      `<p>Plus sub plans, full-year pacing guides, quizzes, rubrics, and parent newsletters — all generated from your lesson.</p>` +
      `<p style="margin:24px 0;">${button("Start your 7-day free trial", CHECKOUT_URL)}</p>` +
      `<p style="color:#7a8592;font-size:13px;">Cancel anytime.</p>`
    ),
  };
}

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

  let body: any = {};
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }
  const action = body?.action;

  const admin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string);

  try {
    // ── start: capture email + gate ─────────────────────────────────────────
    if (action === "start") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return errorResponse("Please enter a valid email address.", 400);
      const ip = clientIp(req);

      const { data: existing } = await admin
        .from("lead_magnet_lessons").select("*").eq("email", email).maybeSingle();

      if (existing) {
        if (existing.status === "generated") {
          return jsonResponse({ status: "already_claimed", token: existing.access_token });
        }
        // Pending: renew the (unused) offer window and reuse the token.
        const { data: renewed } = await admin.from("lead_magnet_lessons")
          .update({ expires_at: new Date(Date.now() + OFFER_HOURS * MS_HOUR).toISOString(), ip })
          .eq("id", existing.id).select().single();
        return jsonResponse({ status: "ready", token: renewed?.access_token ?? existing.access_token });
      }

      // Per-IP soft cap (light abuse guard beyond the per-email rule).
      const since = new Date(Date.now() - 24 * MS_HOUR).toISOString();
      const { count } = await admin.from("lead_magnet_lessons")
        .select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since);
      if ((count ?? 0) >= IP_CAP_24H) {
        return errorResponse("We've hit the free-lesson limit for your network today. Try again tomorrow, or start a free trial.", 429);
      }

      const { data: created, error } = await admin.from("lead_magnet_lessons")
        .insert({ email, ip }).select().single();
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ status: "ready", token: created.access_token });
    }

    // ── finalize: store the generated lesson + send welcome ──────────────────
    if (action === "finalize") {
      const { token, subject, topic, gradeLabel, lesson_object: lessonObject } = body ?? {};
      if (!token || !lessonObject) return errorResponse("Missing token or lesson.", 400);

      const { data: lead } = await admin
        .from("lead_magnet_lessons").select("*").eq("access_token", token).maybeSingle();
      if (!lead) return errorResponse("This free-lesson link is invalid.", 404);
      if (lead.status === "generated") return errorResponse("You've already claimed your free lesson.", 409);
      if (new Date(lead.expires_at).getTime() < Date.now()) {
        return errorResponse("This free-lesson offer expired. Enter your email again for a fresh one.", 410);
      }

      // Atomic claim: only flips if still pending.
      const { data: updated, error } = await admin.from("lead_magnet_lessons")
        .update({
          subject: subject ?? lessonObject?.subject ?? null,
          topic: topic ?? null,
          grade_label: gradeLabel ?? null,
          lesson_object: lessonObject,
          status: "generated",
          generated_at: new Date().toISOString(),
        })
        .eq("id", lead.id).eq("status", "pending").select().single();
      if (error || !updated) return errorResponse("Could not save your lesson (it may already be claimed).", 409);

      // Best-effort welcome email — don't fail the request on an email hiccup.
      try {
        const { subject: subj, html } = welcomeEmail(token, topic ?? null);
        await sendViaResend(lead.email, subj, html);
        await admin.from("lead_magnet_lessons")
          .update({ welcome_sent_at: new Date().toISOString() }).eq("id", lead.id);
      } catch (e) {
        console.error("[lead-magnet] welcome email failed:", e);
      }

      return jsonResponse({ ok: true, token });
    }

    // ── view: public fetch of a stored lesson ────────────────────────────────
    if (action === "view") {
      const { token } = body ?? {};
      if (!token) return errorResponse("Missing token.", 400);
      const { data: lead } = await admin.from("lead_magnet_lessons")
        .select("subject, topic, grade_label, lesson_object, status")
        .eq("access_token", token).maybeSingle();
      if (!lead || lead.status !== "generated" || !lead.lesson_object) {
        return errorResponse("Lesson not found.", 404);
      }
      return jsonResponse({
        subject: lead.subject, topic: lead.topic,
        grade_label: lead.grade_label, lesson_object: lead.lesson_object,
      });
    }

    // ── sweep: day-later follow-up (cron) ────────────────────────────────────
    if (action === "sweep") {
      if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
        return errorResponse("Unauthorized", 401);
      }
      const dryRun = body?.dryRun === true;
      const cutoff = new Date(Date.now() - 24 * MS_HOUR).toISOString();

      const { data: leads } = await admin.from("lead_magnet_lessons")
        .select("id, email, generated_at")
        .eq("status", "generated").is("followup_sent_at", null)
        .lt("generated_at", cutoff).limit(200);

      const results: any[] = [];
      for (const lead of leads ?? []) {
        if (dryRun) { results.push({ id: lead.id, email: lead.email, dryRun: true }); continue; }
        // Claim by stamping followup_sent_at (idempotent).
        const { data: claimed } = await admin.from("lead_magnet_lessons")
          .update({ followup_sent_at: new Date().toISOString() })
          .eq("id", lead.id).is("followup_sent_at", null).select();
        if (!claimed || claimed.length === 0) continue;
        try {
          const { subject, html } = followupEmail();
          await sendViaResend(lead.email, subject, html);
          results.push({ id: lead.id, sent: true });
        } catch (e) {
          await admin.from("lead_magnet_lessons")
            .update({ followup_sent_at: null }).eq("id", lead.id);
          results.push({ id: lead.id, error: String((e as any)?.message ?? e) });
        }
      }
      return jsonResponse({ ok: true, dryRun, count: results.length, results });
    }

    return errorResponse("Unknown action.", 400);
  } catch (err) {
    console.error("[lead-magnet] error:", err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
