// Admin/ops one-off email sender via the existing Resend setup. Used for
// approved, manually-triggered outreach (e.g. the duplicate-trial conversion-
// recovery note). NOT a marketing pipeline — one message per call.
//
// AUTH: service-role only. The caller MUST present the Supabase SERVICE ROLE key
// as the bearer token; anything else is rejected. Deployed with --no-verify-jwt
// (this internal check is the gate). Always sends FROM the PlansK12 address, so a
// leaked call can't spoof a different sender.
const FROM = "PlansK12 <hello@plansk12.com>";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return json({ error: "forbidden" }, 403);
  try {
    const { to, subject, html, reply_to } = await req.json().catch(() => ({}));
    if (!to || !subject || !html) return json({ error: "to, subject, html required" }, 400);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, reply_to: reply_to || undefined }),
    });
    const body = await res.json();
    if (!res.ok) return json({ error: `resend ${res.status}`, detail: body }, 500);
    return json({ sent: true, id: body.id, to });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
