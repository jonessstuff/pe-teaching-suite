/**
 * Edge Function: generate-year-plan
 *
 * Generates a suggested full-year unit sequence for the given subjects,
 * grade band, state, and total weeks. Does NOT persist anything — returns
 * the raw unit list so the client can let the teacher review and edit
 * before saving.
 */

import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildYearPlanPrompt } from "../_shared/yearPlanPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { subjects, gradeBand, state, totalWeeks } = body ?? {};

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return errorResponse("At least one subject is required.", 400);
  }

  const weeks = Number(totalWeeks ?? 36);
  if (isNaN(weeks) || weeks < 1 || weeks > 52) {
    return errorResponse("totalWeeks must be between 1 and 52.", 400);
  }

  try {
    const { system, user } = buildYearPlanPrompt({
      subjects,
      gradeBand: Number(gradeBand ?? 6),
      state: String(state ?? ""),
      totalWeeks: weeks,
    });

    const result = await callClaudeForJson(system, user, 3000);

    const units: any[] = Array.isArray(result.units) ? result.units : [];
    const weekSum = units.reduce(
      (sum, u) => sum + (Number(u.estimated_weeks) || 0),
      0
    );

    return jsonResponse({ units, weekSum });
  } catch (err) {
    return errorResponse((err as any).message ?? String(err), 500);
  }
});
