/**
 * Edge Function: generate-unit
 *
 * ONE AI call that takes unit-level inputs (grade bands, unit name,
 * theme, day count 1-3, equipment, class size, duration) and returns
 * an array of fully populated LessonObjects — one per day — with
 * explicit skill progression across days.
 *
 * Auth: requires a valid Supabase user JWT (verified automatically by
 * the Supabase Edge Runtime when `verify_jwt` is enabled).
 */

import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildUnitGenerationPrompt } from "../_shared/unitPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";
import { createEmptyLessonObject } from "../_shared/lessonObjectDefaults.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let input;
  try {
    input = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const {
    gradeBands,
    unitName,
    theme,
    days,
    subject,
    state,
    stationsMode,
    stationCount,
    equipment,
    classSize,
    durationMinutes,
    targetStandard,
    students,
  } = input ?? {};

  if (!Array.isArray(gradeBands) || gradeBands.length === 0) {
    return errorResponse("gradeBands (non-empty array) is required", 400);
  }

  const dayCount = Math.min(Math.max(Number(days) || 1, 1), 3);

  try {
    const { system, user } = buildUnitGenerationPrompt({
      gradeBands,
      unitName: unitName ?? "",
      theme: theme ?? "",
      days: dayCount,
      subject: subject ?? "PE",
      state: state ?? "",
      stationsMode: stationsMode === true,
      stationCount: Number(stationCount) || 3,
      equipment: Array.isArray(equipment) ? equipment : [],
      classSize: Number(classSize) || 28,
      durationMinutes: Number(durationMinutes) || 45,
      targetStandard: targetStandard ?? "",
      students: Array.isArray(students) ? students : [],
    });

    // Scale max_tokens with day count: ~16000 per lesson.
    const maxTokens = 16000 * dayCount;

    // Race the Claude call against a timeout that fires 10 s before the
    // Edge Runtime's 150 s wall-clock limit so we can return a clean error
    // response instead of letting the runtime kill the connection silently.
    const TIMEOUT_MS = 140_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Unit generation timed out — try reducing the number of days or grade bands, then try again.")),
        TIMEOUT_MS
      )
    );

    const generated = await Promise.race([
      callClaudeForJson(system, user, maxTokens),
      timeoutPromise,
    ]);

    const generatedDays = Array.isArray(generated?.days) ? generated.days : [];

    if (generatedDays.length === 0) {
      return errorResponse("Model response did not include a 'days' array", 500);
    }

    const lessonObjects = generatedDays.map((day, i) => {
      const obj = {
        ...createEmptyLessonObject(),
        ...day,
        grade_bands: gradeBands,
        unit: unitName ?? day.unit ?? "",
        subject: subject ?? day.subject ?? "PE",
        duration_minutes: Number(durationMinutes) || day.duration_minutes || 45,
        class_size: Number(classSize) || day.class_size || 28,
        unit_day_number: i + 1,
        unit_total_days: generatedDays.length,
      };

      // Safety net: if the model skipped suggested_video_searches for this
      // day, derive 2 fallback queries from the unit name and subject.
      if (
        !Array.isArray(obj.suggested_video_searches) ||
        obj.suggested_video_searches.length === 0
      ) {
        const focus = (unitName ?? day.title ?? "").replace(/Day \d+:?\s*/i, "").trim();
        const subj = (subject ?? "PE").toLowerCase();
        obj.suggested_video_searches = [
          `${focus} ${subj} demonstration for students`,
          `how to teach ${focus || subj} in physical education`,
        ].filter((q) => q.trim().length > 3);
      }

      return obj;
    });

    return jsonResponse({ days: lessonObjects });
  } catch (err) {
    const msg = (err as any)?.message ?? String(err);
    const status = /timed out/i.test(msg) ? 504 : 500;
    return errorResponse(msg, status);
  }
});
