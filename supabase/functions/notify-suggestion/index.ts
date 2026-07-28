// Real-time "new feature suggestion!" ding to the review inbox, via the existing
// Resend setup. Called (post-commit, fire-and-forget) by the 0035 DB trigger with
// the new suggestion's id. Public endpoint, but guarded: it only emails when the
// passed suggestion_id is a REAL row in feature_suggestions — so a leaked endpoint
// can't spam the inbox with fakes (it reads the row via the service role).
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
    const { suggestion_id } = await req.json().catch(() => ({}));
    if (!suggestion_id) return json({ error: "missing suggestion_id" }, 400);

    // Guard: the suggestion must actually exist (read past RLS via service role).
    const { data: row, error } = await admin
      .from("feature_suggestions")
      .select("id, user_id, suggestion_text, created_at")
      .eq("id", suggestion_id)
      .single();
    if (error || !row) return json({ skipped: "no such suggestion" });

    // Resolve the submitter's email (best-effort — falls back if unavailable).
    let email = "(unknown user)";
    try {
      const { data: u } = await admin.auth.admin.getUserById(row.user_id);
      if (u?.user?.email) email = u.user.email;
    } catch { /* keep fallback */ }

    const when = new Date(row.created_at).toISOString();
    const text = esc(String(row.suggestion_text ?? "")).replace(/\n/g, "<br>");
    const html = `
      <div style="font-family:system-ui,sans-serif;color:#1a1a2e">
        <h2 style="margin:0 0 8px">💡 New PlansK12 suggestion</h2>
        <p style="margin:0 0 4px">from <strong>${esc(email)}</strong></p>
        <p style="margin:0 0 12px;color:#6b7280;font-size:13px">${when}</p>
        <div style="padding:12px 14px;background:#f4f4f7;border-radius:8px;white-space:pre-wrap">${text}</div>
      </div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [NOTIFY_TO], subject: `New PlansK12 suggestion from ${email}`, html }),
    });
    if (!res.ok) return json({ error: `resend ${res.status}: ${await res.text()}` }, 500);
    return json({ sent: true, email });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
