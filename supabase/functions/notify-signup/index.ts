// Real-time "someone signed up!" ding to Stacey, via the existing Resend setup.
// Called (fire-and-forget) from the signup flow right after supabase.auth.signUp
// succeeds. Public (the just-signed-up client has no session yet), but guarded:
// it only emails when the passed user_id is a REAL auth user created in the last
// few minutes — so a leaked endpoint can't be used to spam the inbox with fakes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const NOTIFY_TO = "plansk12.com@gmail.com";
const FROM = "PlansK12 <hello@plansk12.com>";
const RECENT_MS = 15 * 60 * 1000; // only fire for accounts created in the last 15 min

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { user_id } = await req.json().catch(() => ({}));
    if (!user_id) return json({ error: "missing user_id" }, 400);

    // Guard: the user must exist and have been created just now.
    const { data, error } = await admin.auth.admin.getUserById(user_id);
    if (error || !data?.user) return json({ skipped: "no such user" });
    const createdMs = Date.parse(data.user.created_at);
    if (!createdMs || Date.now() - createdMs > RECENT_MS) return json({ skipped: "not a fresh signup" });

    const email = data.user.email ?? "(no email)";
    const when = new Date(createdMs).toISOString();
    const html = `
      <div style="font-family:system-ui,sans-serif;color:#1a1a2e">
        <h2 style="margin:0 0 8px">🎉 New PlansK12 signup</h2>
        <p style="margin:0 0 4px"><strong>${email}</strong></p>
        <p style="margin:0;color:#6b7280;font-size:13px">just created an account · ${when}</p>
      </div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [NOTIFY_TO], subject: `New PlansK12 signup: ${email}`, html }),
    });
    if (!res.ok) return json({ error: `resend ${res.status}: ${await res.text()}` }, 500);
    return json({ sent: true, email });
  } catch (err) {
    return json({ error: String(err?.message ?? err) }, 500);
  }
});
