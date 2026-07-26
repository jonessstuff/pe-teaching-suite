import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildDhhPrompt } from "../_shared/dhhPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_AREAS = ["communication", "self_advocacy", "social_emotional", "technology_audiology", "career_transition"]
const VALID_APPROACHES = ["both", "bilingual_bicultural", "listening_spoken_language"]

Deno.serve(async (req: Request) => {
  console.log("[generate-dhh] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { gradeBand, contentArea, communicationApproach } = body ?? {}
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }
  if (!VALID_AREAS.includes(contentArea as string)) {
    return errorResponse(`contentArea must be one of: ${VALID_AREAS.join(", ")}`, 400)
  }
  if (communicationApproach !== undefined && !VALID_APPROACHES.includes(communicationApproach as string)) {
    return errorResponse(`communicationApproach must be one of: ${VALID_APPROACHES.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildDhhPrompt(body as Record<string, unknown>)

    // Prose-dense: 2–3 activities (how/why), supports, grading, generalization, standards.
    // Completes on the default model (Sonnet) under the 150s limit — no keepalive needed.
    const maxTokens = 4500
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Teacher of the Deaf & Hard of Hearing", grades: gradeBand ? [gradeBand] : [], type: "dhh", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-dhh" });
    console.error("[generate-dhh] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
