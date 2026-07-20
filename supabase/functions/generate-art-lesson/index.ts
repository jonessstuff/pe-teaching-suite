import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildArtLessonPrompt } from "../_shared/artLessonPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

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
    })

    // Art lessons are verbose (Teacher Prep + 7 phases + detailed supplies list).
    // Multi-stage sessions get additional budget for the stage context block.
    const maxTokens = isMultiStage ? 10000 : 8000
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-art-lesson] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
