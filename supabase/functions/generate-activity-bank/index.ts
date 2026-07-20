import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildActivityBankPrompt } from "../_shared/activityBankPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { subject, gradeBand, duration, occasion } = body ?? {};
  if (!subject) return errorResponse("subject is required", 400);

  try {
    const { system, user } = buildActivityBankPrompt({
      subject,
      gradeBand: gradeBand ?? 5,
      duration: duration ?? 30,
      occasion: occasion ?? 'Emergency sub day',
    });
    const result = await callClaudeForJson(system, user, 8000);

    if (!Array.isArray(result?.activities)) return errorResponse("Model response missing activities", 500);
    return jsonResponse({ activities: result.activities });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
