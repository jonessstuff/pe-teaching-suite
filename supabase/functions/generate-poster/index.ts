/**
 * Edge Function: generate-poster
 *
 * Receives a lesson object and returns structured poster content
 * (title, skill cue, steps, equipment). Does NOT generate SVG itself —
 * the client renders the fixed SVG template from this data.
 *
 * Result is stored in lesson_object.poster_content via updateLesson on
 * the client, following the same pattern as generate-sub-plan, generate-quiz, etc.
 */

import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildPosterPrompt } from "../_shared/posterPrompt.js";
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

  const { lessonObject } = body ?? {};
  if (!lessonObject || typeof lessonObject !== "object") {
    return errorResponse("lessonObject is required", 400);
  }

  try {
    const { system, user } = buildPosterPrompt(lessonObject);
    const result = await callClaudeForJson(system, user, 700);

    if (!Array.isArray(result.steps) || result.steps.length === 0) {
      return errorResponse("Claude returned invalid poster structure", 500);
    }

    return jsonResponse({
      poster_content: {
        title: result.title ?? lessonObject.title ?? "",
        skill_cue: result.skill_cue ?? "",
        steps: result.steps.slice(0, 4),
        equipment: result.equipment ?? lessonObject.equipment_needed ?? [],
        subject: lessonObject.subject ?? "PE",
        grade_bands: lessonObject.grade_bands ?? [],
      },
    });
  } catch (err) {
    return errorResponse((err as any).message ?? String(err), 500);
  }
});
