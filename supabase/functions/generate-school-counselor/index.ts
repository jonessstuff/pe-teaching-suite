import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildSchoolCounselorPrompt } from "../_shared/schoolCounselorPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]

Deno.serve(async (req: Request) => {
  console.log("[generate-school-counselor] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { topic, gradeBand } = body ?? {}
  if (!topic || typeof topic !== "string") {
    return errorResponse("topic is required", 400)
  }
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildSchoolCounselorPrompt(body as Record<string, unknown>)

    // A full classroom-guidance lesson (flow, activity, discussion, standards) is
    // prose-dense but bounded; completes on the default model (Sonnet) under the
    // 150s limit, so no keepalive stream is needed.
    const maxTokens = 4500
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "School Counselors", grades: gradeBand ? [gradeBand] : [], type: "counselor", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-school-counselor" });
    console.error("[generate-school-counselor] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
