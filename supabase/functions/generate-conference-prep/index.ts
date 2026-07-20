import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildConferencePrepPrompt } from "../_shared/conferencePrepPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { studentName, subject, gradeBand, strengths, areasOfConcern, goals } = body ?? {};

  try {
    const { system, user } = buildConferencePrepPrompt({ studentName, subject, gradeBand, strengths, areasOfConcern, goals });
    const result = await callClaudeForJson(system, user, 6000);

    if (!result?.conference_prep) return errorResponse("Model response missing conference_prep", 500);
    return jsonResponse({ conference_prep: result.conference_prep });
  } catch (err) {
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
