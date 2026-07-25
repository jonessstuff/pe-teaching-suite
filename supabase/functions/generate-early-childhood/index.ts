import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildEarlyChildhoodPrompt } from "../_shared/earlyChildhoodPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_AGE_GROUPS = ["toddler", "preschool3", "prek4", "tk5"]

Deno.serve(async (req: Request) => {
  console.log("[generate-early-childhood] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { studyTheme, ageGroup } = body ?? {}
  if (!studyTheme || typeof studyTheme !== "string") {
    return errorResponse("studyTheme is required", 400)
  }
  if (!VALID_AGE_GROUPS.includes(ageGroup as string)) {
    return errorResponse(`ageGroup must be one of: ${VALID_AGE_GROUPS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildEarlyChildhoodPrompt(body as Record<string, unknown>)

    // A full DAP plan (5–6 learning centers, whole-child domains, circle time,
    // small group, standards stack) is prose-dense — size maxTokens to the
    // OUTPUT so the tolerant parser never sees a truncated ("Unterminated
    // string") JSON. Completes on Sonnet within the 150s limit.
    const maxTokens = 6000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Early Childhood", grades: ageGroup ? [ageGroup] : [], type: "early_childhood", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-early-childhood" });
    console.error("[generate-early-childhood] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
