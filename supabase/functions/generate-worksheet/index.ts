/**
 * Edge Function: generate-worksheet
 *
 * Takes a lessonId + a set of teacher-selected worksheet FORMAT types, fetches
 * the existing LessonObject (respecting RLS via the caller's JWT), and generates
 * independent-practice / reinforcement worksheets grounded in the lesson's
 * vocabulary and concepts.
 *
 * Returns { worksheet: { formats: [...] } } — one entry per requested format
 * (each may be applicable:false when it doesn't fit the lesson's content).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildWorksheetPrompt } from "../_shared/worksheetPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const VALID_FORMATS = [
  "fill_blank", "word_search", "matching", "research",
  "cut_paste", "multiple_choice",
];

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

  const { lessonId, formats } = body ?? {};
  if (!lessonId) {
    return errorResponse("lessonId is required", 400);
  }

  const requested = (Array.isArray(formats) ? formats : [])
    .filter((f: unknown) => VALID_FORMATS.includes(f as string));
  if (requested.length === 0) {
    return errorResponse("At least one valid worksheet format is required", 400);
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
    const { system, user } = buildWorksheetPrompt(lessonObject, requested);

    // ~2500 tokens per requested format; cut/paste and word search are small,
    // but fill-in-the-blank + MC practice can be sizable.
    const maxTokens = Math.max(4000, 2500 * requested.length);

    const result = await callClaudeForJson(system, user, maxTokens);

    if (!result?.worksheet || !Array.isArray(result.worksheet.formats)) {
      return errorResponse("Model response missing worksheet.formats array", 500);
    }

    return jsonResponse({ worksheet: result.worksheet });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
