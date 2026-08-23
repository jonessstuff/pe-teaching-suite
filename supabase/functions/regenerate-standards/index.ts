/**
 * Edge Function: regenerate-standards
 *
 * Surgical standards re-pass for an EXISTING saved lesson. Fetches the
 * LessonObject (RLS via the caller's JWT), re-selects ONLY the standards to
 * match the lesson's actual content (correct strand + correct grade prefix),
 * and RETURNS the proposed standards array. It does NOT write anything — the
 * caller reviews before→after and applies the change separately.
 *
 * Used to correct lessons generated before the PE standards-selection fix,
 * which had citations stuck on one strand regardless of topic.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildStandardsRepassPrompt } from "../_shared/standardsRepassPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";
import { reportError } from "../_shared/sentry.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

function normalizeStandards(raw: unknown, grades: number[]): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  const out: Array<Record<string, unknown>> = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const grade = Number((s as any).grade);
    const code = typeof (s as any).code === "string" ? (s as any).code.trim() : "";
    const text = typeof (s as any).text === "string" ? (s as any).text.trim() : "";
    if (!Number.isFinite(grade) || (!code && !text)) continue;
    out.push({ grade, code, text });
  }
  // Keep only the grade bands the lesson actually has, one entry per grade.
  const seen = new Set<number>();
  return out.filter((s) => grades.includes(s.grade as number) && !seen.has(s.grade as number) && seen.add(s.grade as number));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { lessonId, state } = body ?? {};
  if (!lessonId) return errorResponse("lessonId is required", 400);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: row, error: fetchError } = await supabase
      .from("lessons")
      .select("lesson_object")
      .eq("id", lessonId)
      .single();

    if (fetchError) return errorResponse(`Lesson not found: ${fetchError.message}`, 404);

    const lessonObject = row.lesson_object ?? {};
    const grades = Array.isArray(lessonObject.grade_bands) ? lessonObject.grade_bands : [];
    // These lessons are Virginia SOL by default (state isn't stored on the object).
    const stateName = typeof state === "string" && state.trim() ? state.trim() : "Virginia";

    const { system, user } = buildStandardsRepassPrompt(lessonObject, stateName);
    const result = await callClaudeForJson(system, user, 3000);
    const standards = normalizeStandards(result?.standards, grades);

    return jsonResponse({ standards, old_standards: lessonObject.standards ?? [] });
  } catch (err) {
    await reportError(err, { fn: "regenerate-standards" });
    return errorResponse((err as any).message ?? String(err), 500);
  }
});
