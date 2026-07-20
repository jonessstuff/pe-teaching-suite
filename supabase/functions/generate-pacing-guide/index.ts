import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildPacingGuidePrompt } from "../_shared/pacingGuidePrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const {
    subject, grade, state, quarterIndex, totalQuarters,
    schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters
  } = body ?? {};

  if (!subject) return errorResponse("subject is required", 400);
  if (quarterIndex === undefined) return errorResponse("quarterIndex is required", 400);

  try {
    const { system, user } = buildPacingGuidePrompt({
      subject, grade: grade ?? 5, state, quarterIndex,
      totalQuarters: totalQuarters ?? 4,
      schoolYearStart, schoolYearEnd,
      daysPerWeek: daysPerWeek ?? 5,
      breaks, topics, previousQuarters,
    });
    const result = await callClaudeForJson(system, user, 8000);

    if (!result?.quarter) return errorResponse("Model response missing quarter", 500);
    return jsonResponse({ quarter: result.quarter });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
