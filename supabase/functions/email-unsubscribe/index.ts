/**
 * Edge Function: email-unsubscribe
 *
 * Public, token-based one-click unsubscribe for marketing emails (win-back, and
 * any future campaign). The token is the capability — no auth/JWT — so it must
 * be deployed with --no-verify-jwt.
 *
 *   GET  /email-unsubscribe?token=<uuid>   -> flips profiles.email_opt_out, shows a page
 *   POST /email-unsubscribe?token=<uuid>   -> same, for RFC 8058 List-Unsubscribe-Post
 *
 * Secrets: SUPABASE_SERVICE_ROLE_KEY (bypasses RLS to set the flag).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function page(message: string, status = 200): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PlansK12 — Unsubscribe</title></head>
<body style="margin:0;background:#f4f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:480px;margin:64px auto;background:#ffffff;border:1px solid #e6eaee;border-radius:12px;padding:32px;color:#3a4451;">
<div style="font-size:18px;font-weight:600;color:#1a1a2e;margin-bottom:16px;">Plans<span style="color:#4F7FFA;">K12</span></div>
<p style="font-size:15px;line-height:1.6;">${message}</p>
</div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return req.method === "POST"
      ? new Response("missing token", { status: 400 })
      : page("This unsubscribe link is missing its token. If you'd like to opt out, reply to any PlansK12 email and we'll take care of it.", 400);
  }

  try {
    const admin = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string);
    const { data, error } = await admin
      .from("profiles")
      .update({ email_opt_out: true })
      .eq("unsubscribe_token", token)
      .select("id");
    if (error) throw error;

    // One-click (RFC 8058) expects a bare 200; don't leak whether the token matched.
    if (req.method === "POST") return new Response("ok", { status: 200 });

    if (!data || data.length === 0) {
      return page("We couldn't find that unsubscribe link, but you may already be opted out. To be sure, reply to any PlansK12 email and we'll remove you.", 200);
    }
    return page("You've been unsubscribed from PlansK12 emails — you won't receive further messages from us. Changed your mind? Just reply to any email and we'll add you back.");
  } catch (_err) {
    return req.method === "POST"
      ? new Response("error", { status: 500 })
      : page("Something went wrong on our end. Please email hello@plansk12.com and we'll opt you out manually.", 500);
  }
});
