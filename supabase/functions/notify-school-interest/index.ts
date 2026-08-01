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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { interest_id } = await req.json().catch(() => ({}));
    if (!interest_id) return json({ error: "missing interest_id" }, 400);

    // Guard: the row must actually exist (read past RLS via service role).
    const { data: row, error } = await admin
      .from("school_interest")
      .select("id, name, organization, email, teacher_count, note, created_at")
      .eq("id", interest_id)
      .single();
    if (error || !row) return json({ skipped: "no such interest row" });

    const when = new Date(row.created_at).toISOString();
    const teachers = row.teacher_count == null ? "—" : String(row.teacher_count);
    const note = row.note ? esc(String(row.note)).replace(/\n/g, "<br>") : "";
    const html = `
      <div style="font-family:system-ui,sans-serif;color:#1a1a2e">
        <h2 style="margin:0 0 8px">🏫 New school/district interest</h2>
        <p style="margin:0 0 12px;color:#6b7280;font-size:13px">${when}</p>
        <table style="border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Name</td><td style="padding:4px 0"><strong>${esc(row.name ?? "")}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">School / District</td><td style="padding:4px 0"><strong>${esc(row.organization ?? "")}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Email</td><td style="padding:4px 0"><a href="mailto:${esc(row.email ?? "")}">${esc(row.email ?? "")}</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Approx. teachers</td><td style="padding:4px 0">${esc(teachers)}</td></tr>
        </table>
        ${note ? `<div style="margin-top:12px;padding:12px 14px;background:#f4f4f7;border-radius:8px;white-space:pre-wrap">${note}</div>` : ""}
      </div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [NOTIFY_TO],
        reply_to: row.email || undefined,
        subject: `School/district interest: ${row.organization ?? "(unknown)"}`,
        html,
      }),
    });
    if (!res.ok) return json({ error: `resend ${res.status}: ${await res.text()}` }, 500);
    return json({ sent: true, organization: row.organization });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
