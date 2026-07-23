import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildSpecialEducationPrompt } from "../_shared/specialEducationPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_MODES = ["multitier", "functional", "coteaching"]
const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]

Deno.serve(async (req: Request) => {
  console.log("[generate-special-education] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { mode, gradeBand } = body ?? {}
  if (!VALID_MODES.includes(mode as string)) {
    return errorResponse(`mode must be one of: ${VALID_MODES.join(", ")}`, 400)
  }
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildSpecialEducationPrompt(body as Record<string, unknown>)

    // 'multitier' is the densest (4 access tiers, each with tasks + multiple response
    // modalities) so it gets the most headroom; all complete on the default model
    // (Sonnet) under the 150s limit, so no keepalive stream is needed.
    const maxTokens = mode === "multitier" ? 5200 : 4800
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-special-education] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
