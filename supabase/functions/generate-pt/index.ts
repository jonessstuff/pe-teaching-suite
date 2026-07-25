import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildPtPrompt } from "../_shared/ptPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_AREAS = ["gross_motor", "mobility_positioning", "adaptive_pe_crossover", "functional_mobility"]

Deno.serve(async (req: Request) => {
  console.log("[generate-pt] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { gradeBand, contentArea } = body ?? {}
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }
  if (!VALID_AREAS.includes(contentArea as string)) {
    return errorResponse(`contentArea must be one of: ${VALID_AREAS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildPtPrompt(body as Record<string, unknown>)

    // Prose-dense: 2–3 activities (how/why), supports, grading, generalization, standards.
    // Completes on the default model (Sonnet) under the 150s limit — no keepalive needed.
    const maxTokens = 4500
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Physical Therapists", grades: gradeBand ? [gradeBand] : [], type: "pt", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-pt" });
    console.error("[generate-pt] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
