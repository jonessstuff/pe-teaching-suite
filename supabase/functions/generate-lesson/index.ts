/**
 * Edge Function: generate-lesson
 *
 * ONE AI call that takes raw teacher inputs (grade bands, unit/topic,
 * equipment, class size, duration) and returns a fully populated
 * LessonObject. The client saves this object as-is; every renderer
 * (Plan Book, sub plan, etc.) then formats from it with zero
 * additional AI calls.
 *
 * Auth: requires a valid Supabase user JWT (verified automatically by
 * the Supabase Edge Runtime when `verify_jwt` is enabled, which is the
 * default for functions deployed via the CLI/dashboard).
 */

import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildLessonGenerationPrompt } from "../_shared/lessonPrompt.js";
import { stripNonCoreSections } from "../_shared/coreActivityDirective.js";
import { callClaudeForJson } from "../_shared/anthropic.js";
import { createEmptyLessonObject } from "../_shared/lessonObjectDefaults.js";
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";
import { resolveStateName } from "../_shared/stateNames.js";
import { classifiedVirginiaStandards } from "../_shared/peSolStrand.js";
import { anonymizeStudentSupports, restorePrivateLabels } from "../_shared/studentPrivacy.js";

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
    unit,
    topic,
    targetStandard,
    subject,
    state,
    stationsMode,
    stationCount,
    equipment,
    classSize,
    durationMinutes,
    students,
    includeELL,
    handsOn,
    includeUdlEf,
    includeMtss,
    coreActivityOnly,
  } = input ?? {};

  if (!Array.isArray(gradeBands) || gradeBands.length === 0) {
    return errorResponse("gradeBands (non-empty array) is required", 400);
  }

  try {
    const { promptStudents, replacements } = anonymizeStudentSupports(
      Array.isArray(students) ? students : [],
    );
    const { system, user } = buildLessonGenerationPrompt({
      gradeBands,
      unit: unit ?? "",
      topic: topic ?? "",
      subject: subject ?? "PE",
      state: state ?? "",
      stationsMode: stationsMode === true,
      stationCount: Number(stationCount) || 3,
      equipment: Array.isArray(equipment) ? equipment : [],
      classSize: Number(classSize) || 28,
      durationMinutes: Number(durationMinutes) || 45,
      targetStandard: targetStandard ?? "",
      students: promptStudents,
      includeELL: includeELL === true,
      handsOn: handsOn === true,
      includeUdlEf: includeUdlEf === true,
      includeMtss: includeMtss === true,
      coreActivityOnly: coreActivityOnly === true,
    });

    const _t0 = Date.now();
    const anonymousResult = await callClaudeForJson(system, user, 16000);
    const generated = restorePrivateLabels(anonymousResult, replacements);
    const durationMs = Date.now() - _t0;

    // Merge over a blank LessonObject so any fields the model omits
    // still come back as well-typed empty values rather than undefined.
    const lessonObject = {
      ...createEmptyLessonObject(),
      ...generated,
      // Always trust the caller's inputs for these, regardless of
      // what the model returned.
      grade_bands: gradeBands,
      subject: subject ?? generated.subject ?? "PE",
      duration_minutes: Number(durationMinutes) || generated.duration_minutes || 45,
      class_size: Number(classSize) || generated.class_size || 28,
    };

    // Safety net: if the model skipped suggested_video_searches, derive
    // 2 fallback queries from the lesson topic/unit/subject so the field
    // is never blank in the database.
    if (
      !Array.isArray(lessonObject.suggested_video_searches) ||
      lessonObject.suggested_video_searches.length === 0
    ) {
      const focus = (topic ?? unit ?? lessonObject.title ?? "").trim();
      const subj = (subject ?? "PE").toLowerCase();
      lessonObject.suggested_video_searches = [
        `${focus} ${subj} demonstration for students`,
        `how to teach ${focus || subj} in physical education`,
      ].filter((q) => q.trim().length > 3);
    }

    // Virginia PE and Health standards: the model is never trusted to invent
    // SOL numbers. Grades 6-8 are matched to the verified VDOE bank and receive
    // exact dotted codes plus official wording. Other subjects/states retain
    // the model's standards output.
    if (
      (subject === "PE" || subject === "Health") &&
      resolveStateName(state) === "Virginia" &&
      Array.isArray(lessonObject.grade_bands) &&
      lessonObject.grade_bands.length > 0
    ) {
      lessonObject.standards = classifiedVirginiaStandards(
        lessonObject,
        subject,
        targetStandard,
      );
    }

    // Analytics: successful generation (metadata only — never lesson text).
    await captureLessonGenerated(req, {
      subject: subject ?? "PE",
      grades: gradeBands,
      type: "lesson",
      durationMs,
    });

    // Core Activity Only: deterministically drop warm-up/closure (see helper).
    if (coreActivityOnly === true) stripNonCoreSections(lessonObject);

    return jsonResponse(lessonObject);
  } catch (err) {
    await reportError(err, { fn: "generate-lesson" });
    return errorResponse(err.message ?? String(err), 500);
  }
});
