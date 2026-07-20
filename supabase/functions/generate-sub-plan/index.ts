/**
 * Edge Function: generate-sub-plan
 *
 * Takes a lessonId, fetches the existing LessonObject (respecting RLS
 * via the caller's JWT), and generates the sub_* fields
 * (sub_friendly_instructions, sub_script, sub_management_script,
 * sub_diagram). The client merges these onto the saved LessonObject.
 *
 * One AI call. No re-generation of the rest of the lesson.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildSubPlanPrompt } from "../_shared/subPlanPrompt.js";
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
    // Client scoped to the caller's JWT so RLS applies — the user can
    // only fetch lessons they own.
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

    const { system, user } = buildSubPlanPrompt(lessonObject);
    const subPlan = await callClaudeForJson(system, user, 16000);

    const result = {
      sub_friendly_instructions: subPlan.sub_friendly_instructions ?? "",
      sub_script: subPlan.sub_script ?? "",
      sub_management_script: subPlan.sub_management_script ?? "",
      sub_diagram: subPlan.sub_diagram ?? "",
    };

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err.message ?? String(err), 500);
  }
});
