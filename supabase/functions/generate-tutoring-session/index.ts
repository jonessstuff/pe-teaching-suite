import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildTutoringPrompt } from "../_shared/tutoringPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_SUBJECTS = ["reading", "math"]
const VALID_TYPES = ["private", "in_class"]
const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]

Deno.serve(async (req: Request) => {
  console.log("[generate-tutoring-session] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { subject, tutoringType, gradeBand } = body ?? {}
  if (!VALID_SUBJECTS.includes(subject as string)) {
    return errorResponse(`subject must be one of: ${VALID_SUBJECTS.join(", ")}`, 400)
  }
  if (!VALID_TYPES.includes(tutoringType as string)) {
    return errorResponse(`tutoringType must be one of: ${VALID_TYPES.join(", ")}`, 400)
  }
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildTutoringPrompt(body as Record<string, unknown>)

    // Private sessions carry a full arc + a parent summary; in-class pull-asides are
    // short and grab-and-go. Both complete on the default model (Sonnet) well under
    // the 150s limit, so no keepalive stream is needed.
    const maxTokens = tutoringType === "private" ? 4200 : 3000
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-tutoring-session] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
