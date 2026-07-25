import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildStemLessonPrompt } from "../_shared/stemLessonPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_FOCUS_AREAS = ["engineering", "coding", "science", "maker"]

Deno.serve(async (req: Request) => {
  console.log("[generate-stem-lesson] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { focusArea, gradeBands, includeELL } = body ?? {}

  if (!VALID_FOCUS_AREAS.includes(focusArea as string)) {
    return errorResponse(`focusArea must be one of: ${VALID_FOCUS_AREAS.join(", ")}`, 400)
  }

  if (!Array.isArray(gradeBands) || (gradeBands as number[]).length === 0) {
    return errorResponse("At least one grade band is required.", 400)
  }

  try {
    const { system, user } = buildStemLessonPrompt(body as Record<string, unknown>)

    // ELL accommodations add a substantial extra section to every phase, pushing
    // multi-grade-band responses past 8000 tokens and truncating the JSON.
    const maxTokens = includeELL ? 12000 : 8000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "STEM", grades: gradeBands, type: "stem", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-stem-lesson" });
    console.error("[generate-stem-lesson] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
