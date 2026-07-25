import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildMusicLessonPrompt } from "../_shared/musicLessonPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

Deno.serve(async (req: Request) => {
  console.log("[generate-music-lesson] handler entered, method:", req.method)
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
    instruments,
    classSize,
    durationMinutes,
    targetStandard,
    state,
    includeELL,
  } = body ?? {}

  if (!Array.isArray(gradeBands) || (gradeBands as number[]).length === 0) {
    return errorResponse("At least one grade band is required.", 400)
  }

  try {
    const { system, user } = buildMusicLessonPrompt({
      gradeBands: gradeBands as number[],
      topic: (topic as string) ?? "",
      instruments: (instruments as string[]) ?? [],
      classSize: (classSize as number) ?? 25,
      durationMinutes: (durationMinutes as number) ?? 45,
      targetStandard: (targetStandard as string) ?? "",
      state: (state as string) ?? "",
      includeELL: (includeELL as boolean) === true,
    })

    // Music lessons need room for multi-grade-band content across all 5 phases.
    const maxTokens = 8000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Music", grades: gradeBands, type: "music", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-music-lesson" });
    console.error("[generate-music-lesson] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
