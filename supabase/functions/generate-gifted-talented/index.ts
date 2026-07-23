import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildGiftedTalentedPrompt } from "../_shared/giftedTalentedPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_MODES = ["differentiate", "enrich", "support"]
const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]

Deno.serve(async (req: Request) => {
  console.log("[generate-gifted-talented] handler entered, method:", req.method)
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
    const { system, user } = buildGiftedTalentedPrompt(body as Record<string, unknown>)

    // All three modes are prose-dense: 'support' in particular (overview + 6 indicators +
    // 7 strategies + several narrative notes) overran a 2800-token cap and truncated the
    // JSON mid-string, so give it the most headroom. These sizes still complete on the
    // default model (Sonnet) well under the 150s limit, so no keepalive stream is needed.
    const maxTokens = mode === "support" ? 4800 : 4200
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-gifted-talented] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
