import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildLibraryUnitPrompt } from "../_shared/libraryUnitPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { createEmptyLessonObject } from "../_shared/lessonObjectDefaults.js"

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let input: Record<string, unknown>
  try {
    input = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const {
    gradeBands,
    unitName,
    theme,
    sessions,
    materials,
    classSize,
    durationMinutes,
    targetStandard,
    state,
  } = input ?? {}

  if (!Array.isArray(gradeBands) || (gradeBands as number[]).length === 0) {
    return errorResponse("gradeBands (non-empty array) is required", 400)
  }

  const sessionCount = Math.min(Math.max(Number(sessions) || 2, 2), 3)

  try {
    const { system, user } = buildLibraryUnitPrompt({
      gradeBands: gradeBands as number[],
      unitName: (unitName as string) ?? "",
      theme: (theme as string) ?? "",
      sessions: sessionCount,
      materials: Array.isArray(materials) ? (materials as string[]) : [],
      classSize: Number(classSize) || 25,
      durationMinutes: Number(durationMinutes) || 40,
      targetStandard: (targetStandard as string) ?? "",
      state: (state as string) ?? "",
    })

    // Scale max_tokens with session count: ~16000 per session.
    const maxTokens = 16000 * sessionCount

    // Race the Claude call against a timeout that fires 10s before the
    // Edge Runtime's 150s wall-clock limit.
    const TIMEOUT_MS = 140_000
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Unit generation timed out — try reducing the number of sessions or grade bands, then try again."
            )
          ),
        TIMEOUT_MS
      )
    )

    const generated = await Promise.race([
      callClaudeForJson(system, user, maxTokens),
      timeoutPromise,
    ])

    const generatedSessions = Array.isArray(generated?.sessions) ? generated.sessions : []

    if (generatedSessions.length === 0) {
      return errorResponse("Model response did not include a 'sessions' array", 500)
    }

    const lessonObjects = generatedSessions.map((session: Record<string, unknown>, i: number) => {
      const obj = {
        ...createEmptyLessonObject(),
        ...session,
        grade_bands: gradeBands,
        unit: (unitName as string) ?? session.unit ?? "",
        subject: "Library/Media",
        duration_minutes: Number(durationMinutes) || (session.duration_minutes as number) || 40,
        class_size: Number(classSize) || (session.class_size as number) || 25,
        unit_day_number: i + 1,
        unit_total_days: generatedSessions.length,
      }

      // Safety net: if the model omitted suggested_video_searches for this session.
      if (
        !Array.isArray(obj.suggested_video_searches) ||
        obj.suggested_video_searches.length === 0
      ) {
        const focus = ((unitName as string) ?? (session.title as string) ?? "")
          .replace(/Session \d+:?\s*/i, "")
          .trim()
        obj.suggested_video_searches = [
          `${focus} library lesson for kids`,
          `elementary library ${focus || "information literacy"} activity`,
        ].filter((q: string) => q.trim().length > 3)
      }

      return obj
    })

    return jsonResponse({ sessions: lessonObjects })
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err)
    const status = /timed out/i.test(msg) ? 504 : 500
    return errorResponse(msg, status)
  }
})
