/**
 * Edge Function: generate-observation-summary
 *
 * Takes a lessonId, fetches the existing LessonObject (respecting RLS
 * via the caller's JWT), and generates a concise one-page observation/
 * evaluation prep summary for a principal or evaluator walkthrough.
 *
 * Standards are passed through verbatim from the lesson object and
 * returned as-is — no AI regeneration. The model produces only the
 * three synthesized fields: overview, differentiation highlights, and
 * observable indicators.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildObservationSummaryPrompt, OBSERVATION_SUMMARY_SCHEMA } from "../_shared/observationSummaryPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("Missing Authorization header", 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { lessonId } = body ?? {};
  if (!lessonId) {
    return errorResponse("lessonId is required", 400);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: row, error: fetchError } = await supabase
      .from("lessons")
      .select("lesson_object")
      .eq("id", lessonId)
      .single();

    if (fetchError) {
      return errorResponse(`Lesson not found: ${fetchError.message}`, 404);
    }

    const lessonObject = row.lesson_object;

    const { system, user } = buildObservationSummaryPrompt(lessonObject);
    // Sonnet 4.6 false-refuses obs-summaries on sensitive-domain CTE lessons
    // (legal, chemical/medical) — stop_reason "refusal", empty content. Haiku 4.5
    // handles them cleanly, so route CTE lessons to it; everything else stays on
    // the default (Sonnet).
    const isCte = lessonObject?.subject === "CTE" || Boolean(lessonObject?.pathway);
    const model = isCte ? "claude-haiku-4-5" : undefined;
    const result = await callClaudeForJson(system, user, 4000, model, OBSERVATION_SUMMARY_SCHEMA);

    return jsonResponse({
      obs_overview: result.obs_overview ?? "",
      obs_differentiation: Array.isArray(result.obs_differentiation) ? result.obs_differentiation : [],
      obs_look_for: Array.isArray(result.obs_look_for) ? result.obs_look_for : [],
    });
  } catch (err) {
    return errorResponse((err as any).message ?? String(err), 500);
  }
});
