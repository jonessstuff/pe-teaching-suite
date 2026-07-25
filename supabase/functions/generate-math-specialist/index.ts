import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildMathSpecialistPrompt } from "../_shared/mathSpecialistPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]

Deno.serve(async (req: Request) => {
  console.log("[generate-math-specialist] handler entered, method:", req.method)
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
    const { system, user } = buildMathSpecialistPrompt(body as Record<string, unknown>)

    // Prose-dense: CRA (3 phases), 3–5 process standards, both differentiation and
    // intervention framing, misconceptions, and a Number Talk. Give generous headroom
    // so the JSON never truncates mid-string; still completes on the default model
    // (Sonnet) under the 150s limit, so no keepalive stream is needed.
    const maxTokens = 4800
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Math Specialists", grades: gradeBand ? [gradeBand] : [], type: "math_specialist", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-math-specialist" });
    console.error("[generate-math-specialist] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
