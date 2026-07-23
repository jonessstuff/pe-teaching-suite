import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildReadingSpecialistPrompt } from "../_shared/readingSpecialistPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]

Deno.serve(async (req: Request) => {
  console.log("[generate-reading-specialist] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { skillArea, gradeBand } = body ?? {}
  if (!skillArea || typeof skillArea !== "string") {
    return errorResponse("skillArea is required", 400)
  }
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildReadingSpecialistPrompt(body as Record<string, unknown>)

    // A full Structured Literacy lesson is prose-dense (5–7 sequenced steps, each with
    // teacher/student moves, plus modeling script and dyslexia_watch). Give it generous
    // headroom so the JSON never truncates mid-string; still completes on the default
    // model (Sonnet) under the 150s limit, so no keepalive stream is needed.
    const maxTokens = 4800
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-reading-specialist] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
