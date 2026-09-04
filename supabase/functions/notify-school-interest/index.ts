// Real-time "new school/district interest!" ding to the review inbox, via the
// existing Resend setup. Called (post-commit, fire-and-forget) by the 0041 DB
// trigger with the new row's id. Public endpoint, but guarded: it only emails
// when the passed interest_id is a REAL row in school_interest (read via the
// service role) — so a leaked endpoint can't spam the inbox with fakes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const NOTIFY_TO = "plansk12.com@gmail.com";
const FROM = "PlansK12 <hello@plansk12.com>";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const roleLabels: Record<string, string> = {
  teacher: "Teacher", department_lead: "Department or program lead", school_admin: "School administrator",
  district_admin: "District administrator", curriculum: "Curriculum or instruction leader",
  technology: "Technology or purchasing", other: "Other",
};
const scopeLabels: Record<string, string> = { department: "One department or program", school: "One school", multiple_schools: "Multiple schools", district: "Entire district" };
const interestLabels: Record<string, string> = { pricing: "School pricing information", demo: "A personal demonstration", pilot: "A founding-school pilot", admin_packet: "Information to share with administration", exploring: "Just exploring" };
const timelineLabels: Record<string, string> = { immediately: "As soon as possible", this_semester: "This semester", next_semester: "Next semester", next_school_year: "Next school year", unsure: "Not sure yet" };
const nextStepLabels: Record<string, string> = { email_information: "Email school information", walkthrough: "Schedule a brief walkthrough", pilot_conversation: "Discuss a founding-school pilot", admin_packet: "Send an administrator-ready information packet" };
const label = (labels: Record<string, string>, value: unknown) => labels[String(value ?? "")] ?? String(value ?? "—");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { interest_id } = await req.json().catch(() => ({}));
    if (!interest_id) return json({ error: "missing interest_id" }, 400);

    // Guard: the row must actually exist (read past RLS via service role).
    const { data: row, error } = await admin
      .from("school_interest")
      .select("id, name, organization, email, role, location, organization_scope, teacher_count, specialties, interest_type, timeline, primary_goal, preferred_next_step, lead_tier, note, created_at")
      .eq("id", interest_id)
      .single();
    if (error || !row) return json({ skipped: "no such interest row" });

    const when = new Date(row.created_at).toISOString();
    const teachers = row.teacher_count == null ? "—" : String(row.teacher_count);
    const note = row.note ? esc(String(row.note)).replace(/\n/g, "<br>") : "";
    const goal = row.primary_goal ? esc(String(row.primary_goal)).replace(/\n/g, "<br>") : "—";
    const specialties = Array.isArray(row.specialties) && row.specialties.length ? row.specialties.map((item: string) => esc(String(item))).join(", ") : "—";
    const tier = String(row.lead_tier ?? "exploring").toUpperCase();
    const html = `
      <div style="font-family:system-ui,sans-serif;color:#1a1a2e">
        <h2 style="margin:0 0 8px">🏫 New school/district interest · ${esc(tier)}</h2>
        <p style="margin:0 0 12px;color:#6b7280;font-size:13px">${when}</p>
        <table style="border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Name</td><td style="padding:4px 0"><strong>${esc(row.name ?? "")}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Role</td><td style="padding:4px 0">${esc(label(roleLabels, row.role))}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">School / District</td><td style="padding:4px 0"><strong>${esc(row.organization ?? "")}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Location</td><td style="padding:4px 0">${esc(String(row.location ?? "—"))}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Email</td><td style="padding:4px 0"><a href="mailto:${esc(row.email ?? "")}">${esc(row.email ?? "")}</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Scope</td><td style="padding:4px 0">${esc(label(scopeLabels, row.organization_scope))}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Approx. teachers</td><td style="padding:4px 0">${esc(teachers)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Specialties</td><td style="padding:4px 0">${specialties}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Looking for</td><td style="padding:4px 0">${esc(label(interestLabels, row.interest_type))}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Timeline</td><td style="padding:4px 0">${esc(label(timelineLabels, row.timeline))}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Requested next step</td><td style="padding:4px 0"><strong>${esc(label(nextStepLabels, row.preferred_next_step))}</strong></td></tr>
        </table>
        <div style="margin-top:12px;padding:12px 14px;background:#eef5ff;border-radius:8px"><strong>What they need PlansK12 to accomplish</strong><div style="margin-top:6px">${goal}</div></div>
        ${note ? `<div style="margin-top:12px;padding:12px 14px;background:#f4f4f7;border-radius:8px;white-space:pre-wrap">${note}</div>` : ""}
      </div>`;
    const ownerEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        reply_to: row.email || undefined,
        subject: `[${tier}] School/district interest: ${row.organization ?? "(unknown)"}`,
        html,
      }),
    });
    if (!ownerEmail.ok) return json({ error: `owner email ${ownerEmail.status}: ${await ownerEmail.text()}` }, 500);

    const firstName = esc(String(row.name ?? "there").trim().split(/\s+/)[0] || "there");
    const confirmationHtml = `
      <div style="font-family:system-ui,sans-serif;color:#1a1a2e;line-height:1.55;max-width:620px">
        <h2 style="margin:0 0 12px;color:#315fdb">Thank you for your interest in PlansK12</h2>
        <p>Hi ${firstName},</p>
        <p>I received your request for <strong>${esc(String(row.organization ?? "your school or district"))}</strong>. I personally review every school inquiry and will respond within one business day.</p>
        <div style="margin:18px 0;padding:14px 16px;background:#f4f7ff;border-radius:10px">
          <strong>Your requested next step:</strong><br>${esc(label(nextStepLabels, row.preferred_next_step))}<br><br>
          <strong>Specialty areas:</strong><br>${specialties}
        </div>
        <p>While you wait, you can explore the interactive specialty demonstrations:</p>
        <p><a href="https://plansk12.com/demo" style="display:inline-block;padding:10px 16px;background:#4f7ffa;color:white;text-decoration:none;border-radius:8px;font-weight:700">Explore PlansK12 demos</a></p>
        <p>Thank you,<br><strong>Stacey</strong><br>Founder, PlansK12</p>
      </div>`;
    const confirmationEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [row.email],
        reply_to: NOTIFY_TO,
        subject: "We received your PlansK12 school request",
        html: confirmationHtml,
      }),
    });
    return json({ sent: true, confirmation_sent: confirmationEmail.ok, organization: row.organization });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
