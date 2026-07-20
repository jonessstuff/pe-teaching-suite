import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildPortfolioPrompt } from "../_shared/portfolioPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { subject, yearsTeaching, philosophySeeds } = body ?? {};

  try {
    const { system, user } = buildPortfolioPrompt({ subject, yearsTeaching, philosophySeeds });
    const result = await callClaudeForJson(system, user, 8000);

    if (typeof result?.teaching_philosophy !== 'string') return errorResponse("Model response missing teaching_philosophy", 500);
    return jsonResponse({ teaching_philosophy: result.teaching_philosophy });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
