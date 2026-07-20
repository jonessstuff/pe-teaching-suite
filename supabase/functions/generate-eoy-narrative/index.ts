import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildEoyNarrativePrompt } from "../_shared/eoyNarrativePrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals } = body ?? {};

  try {
    const { system, user } = buildEoyNarrativePrompt({ subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals });
    const result = await callClaudeForJson(system, user, 8000);

    if (typeof result?.eoy_narrative !== 'string') return errorResponse("Model response missing eoy_narrative", 500);
    return jsonResponse({ eoy_narrative: result.eoy_narrative });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
