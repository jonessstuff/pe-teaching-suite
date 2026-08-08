import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildArtLessonPrompt } from "../_shared/artLessonPrompt.js"
import { stripNonCoreSections } from "../_shared/coreActivityDirective.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

Deno.serve(async (req: Request) => {
  console.log("[generate-art-lesson] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const {
    gradeBands,
    topic,
    materials,
    classSize,
    durationMinutes,
    targetStandard,
    state,
    sessionNumber,
    totalSessions,
    priorSessionsSummary,
    includeELL,
    handsOn,
    stationsMode,
    stationCount,
    includeUdlEf,
    coreActivityOnly,
  } = body ?? {}

  if (!Array.isArray(gradeBands) || (gradeBands as number[]).length === 0) {
    return errorResponse("At least one grade band is required.", 400)
  }

  const isMultiStage = Number(sessionNumber) > 0

  try {
    const { system, user } = buildArtLessonPrompt({
      gradeBands: gradeBands as number[],
      topic: (topic as string) ?? "",
      materials: (materials as string[]) ?? [],
      classSize: (classSize as number) ?? 25,
      durationMinutes: (durationMinutes as number) ?? 45,
      targetStandard: (targetStandard as string) ?? "",
      state: (state as string) ?? "",
      sessionNumber: Number(sessionNumber) || 0,
      totalSessions: Number(totalSessions) || 0,
      priorSessionsSummary: (priorSessionsSummary as string) ?? "",
      includeELL: (includeELL as boolean) === true,
      handsOn: (handsOn as boolean) === true,
      stationsMode: (stationsMode as boolean) === true,
      includeUdlEf: (includeUdlEf as boolean) === true,
      coreActivityOnly: (coreActivityOnly as boolean) === true,
      stationCount: Number(stationCount) || 3,
    })

    // Art lessons are verbose (Teacher Prep + 7 phases + detailed supplies list).
    // Multi-stage sessions get additional budget for the stage context block.
    const maxTokens = isMultiStage ? 10000 : 8000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Art", grades: gradeBands, type: "art", durationMs: Date.now() - _t0 });
    if (coreActivityOnly === true) stripNonCoreSections(result)
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-art-lesson" });
    console.error("[generate-art-lesson] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
