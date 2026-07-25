import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildLibraryLessonPrompt } from "../_shared/libraryLessonPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

Deno.serve(async (req: Request) => {
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
    unitName,
    sessionNumber,
    totalSessions,
    priorSessionsSummary,
    includeELL,
  } = body ?? {}

  if (!Array.isArray(gradeBands) || (gradeBands as number[]).length === 0) {
    return errorResponse("At least one grade band is required.", 400)
  }

  const isUnitMode = Number(sessionNumber) > 0

  try {
    const { system, user } = buildLibraryLessonPrompt({
      gradeBands: gradeBands as number[],
      topic: (topic as string) ?? "",
      materials: (materials as string[]) ?? [],
      classSize: (classSize as number) ?? 25,
      durationMinutes: (durationMinutes as number) ?? 40,
      targetStandard: (targetStandard as string) ?? "",
      state: (state as string) ?? "",
      unitName: (unitName as string) ?? "",
      sessionNumber: Number(sessionNumber) || 0,
      totalSessions: Number(totalSessions) || 0,
      priorSessionsSummary: (priorSessionsSummary as string) ?? "",
      includeELL: (includeELL as boolean) === true,
    })

    // Library lessons need headroom for multi-grade-band content; unit sessions
    // carry additional prior-session context on top of that.
    const maxTokens = isUnitMode ? 8000 : 6000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Library/Media", grades: gradeBands, type: "library", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-library-lesson" });
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
