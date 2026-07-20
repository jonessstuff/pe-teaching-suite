/**
 * Edge Function: generate-parent-note
 *
 * Takes a lessonId, fetches the existing LessonObject (respecting RLS
 * via the caller's JWT), and generates a warm, jargon-free parent
 * communication note. Returns four structured fields that are merged
 * onto the LessonObject: intro paragraph, skills bullets, vocabulary
 * with kid-friendly definitions, and "Ask your child" conversation starters.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildParentNotePrompt } from "../_shared/parentNotePrompt.js";
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

    const { system, user } = buildParentNotePrompt(lessonObject);
    const result = await callClaudeForJson(system, user, 4000);

    return jsonResponse({
      parent_note_intro: result.parent_note_intro ?? "",
      parent_note_skills: Array.isArray(result.parent_note_skills) ? result.parent_note_skills : [],
      parent_note_vocabulary: Array.isArray(result.parent_note_vocabulary) ? result.parent_note_vocabulary : [],
      parent_note_ask: Array.isArray(result.parent_note_ask) ? result.parent_note_ask : [],
    });
  } catch (err) {
    return errorResponse((err as any).message ?? String(err), 500);
  }
});
