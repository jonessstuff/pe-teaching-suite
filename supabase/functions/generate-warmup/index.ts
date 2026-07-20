import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildWarmupPrompt } from "../_shared/warmupPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { subject, gradeBand, duration, equipment } = body ?? {};
  if (!subject) return errorResponse("subject is required", 400);

  try {
    const { system, user } = buildWarmupPrompt({
      subject,
      gradeBand: gradeBand ?? 5,
      duration: duration ?? 5,
      equipment: equipment ?? '',
    });
    const result = await callClaudeForJson(system, user, 6000);

    if (!Array.isArray(result?.warmup_options)) return errorResponse("Model response missing warmup_options", 500);
    return jsonResponse({ warmup_options: result.warmup_options });
  } catch (err) {
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
