import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildInstructionalCoachingPrompt } from "../_shared/instructionalCoachingPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_AREAS = ["conversation_frameworks", "observation_tools", "goal_data_protocols"]

Deno.serve(async (req: Request) => {
  console.log("[generate-instructional-coaching] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { contentArea, topic } = body ?? {}
  if (!VALID_AREAS.includes(contentArea as string)) {
    return errorResponse(`contentArea must be one of: ${VALID_AREAS.join(", ")}`, 400)
  }
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return errorResponse("topic is required", 400)
  }

  try {
    const { system, user } = buildInstructionalCoachingPrompt(body as Record<string, unknown>)

    // A structured coaching resource (protocol, sections, standards) is prose-dense
    // but bounded; completes on Sonnet under the 150s limit (mirrors generate-staff-pd).
    const maxTokens = 5000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Instructional Coaching", grades: [], type: "instructional_coaching", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-instructional-coaching" });
    console.error("[generate-instructional-coaching] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
