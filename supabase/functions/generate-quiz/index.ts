/**
 * Edge Function: generate-quiz
 *
 * Takes a lessonId, fetches the existing LessonObject (respecting RLS
 * via the caller's JWT), and generates per-grade-band quiz question sets
 * grounded in the lesson's standards, vocabulary, and learning targets.
 *
 * Returns { quiz_questions: { "<grade>": { grade, questions[] } } }
 * which the client merges onto the saved LessonObject.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildQuizPrompt } from "../_shared/quizPrompt.js";
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
    const gradeBands: number[] = lessonObject?.grade_bands ?? [];

    if (gradeBands.length === 0) {
      return errorResponse("Lesson has no grade bands — cannot generate quiz", 400);
    }

    const { system, user } = buildQuizPrompt(lessonObject);

    // ~3000 tokens per grade band for 8-10 questions each
    const maxTokens = Math.max(4000, 3000 * gradeBands.length);

    const result = await callClaudeForJson(system, user, maxTokens);

    if (!result?.quiz_questions || typeof result.quiz_questions !== "object") {
      return errorResponse("Model response missing quiz_questions object", 500);
    }

    return jsonResponse({ quiz_questions: result.quiz_questions });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
