import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildSlpPrompt } from "../_shared/slpPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12", "adult"]
const K12_AREAS = ["articulation", "language", "fluency", "pragmatics", "aac"]
const ADULT_AREAS = ["aphasia", "cognitive_communication", "motor_speech", "adult_pragmatics", "adult_aac"]

Deno.serve(async (req: Request) => {
  console.log("[generate-slp] handler entered, method:", req.method)
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
  const allowedAreas = gradeBand === "adult" ? ADULT_AREAS : K12_AREAS
  if (!allowedAreas.includes(contentArea as string)) {
    return errorResponse(`contentArea must be one of: ${allowedAreas.join(", ")} for this tier`, 400)
  }

  try {
    const { system, user } = buildSlpPrompt(body as Record<string, unknown>)

    // Prose-dense: 2–3 activities (how/why), cueing, modalities, generalization, standards.
    // Completes on the default model (Sonnet) under the 150s limit — no keepalive needed.
    const maxTokens = 4500
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-slp] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
