import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildProgressNotePrompt } from "../_shared/progressNotePrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";
import { anonymizeStudentName, redactKnownName, restorePrivateLabels } from "../_shared/studentPrivacy.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { lessonId, studentName, iepGoal, goalCategory, observationNotes, performanceLevel } = body ?? {};
  if (!lessonId) return errorResponse("lessonId is required", 400);
  if (!iepGoal?.trim()) return errorResponse("iepGoal is required", 400);
  if (!observationNotes?.trim()) return errorResponse("observationNotes is required", 400);

  try {
    const { promptName, replacements } = anonymizeStudentName(studentName);
    const displayName = typeof studentName === "string" ? studentName.trim() : "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: row, error } = await supabase
      .from("lessons").select("lesson_object").eq("id", lessonId).single();
    if (error) return errorResponse(`Lesson not found: ${error.message}`, 404);

    const { system, user } = buildProgressNotePrompt(row.lesson_object, {
      studentName: promptName,
      iepGoal: redactKnownName(iepGoal, displayName),
      goalCategory: goalCategory ?? 'participation',
      observationNotes: redactKnownName(observationNotes, displayName),
      performanceLevel: performanceLevel ?? 'meeting',
    });
    const anonymousResult = await callClaudeForJson(system, user, 6000);
    const result = restorePrivateLabels(anonymousResult, replacements);

    if (typeof result?.progress_note !== 'string') return errorResponse("Model response missing progress_note", 500);
    return jsonResponse({ progress_note: result.progress_note });
  } catch (err) {
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
