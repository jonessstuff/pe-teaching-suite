import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildClassroomManagementPrompt } from "../_shared/classroomManagementPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_GRADE_BANDS = ["K-2", "3-5", "6-8", "9-12"]

// Haiku for cost/timeout reasons on the Supabase free plan, matching the CTE
// approach. The card is small, so no keepalive stream is needed (fast generation).
const MODEL = "claude-haiku-4-5"

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)
  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { gradeBand = "6-8", classContext } = body ?? {}

  if (!VALID_GRADE_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_GRADE_BANDS.join(", ")}`, 400)
  }

  try {
    const { system, user, schema } = buildClassroomManagementPrompt({
      gradeBand: gradeBand as string,
      classContext: (classContext as string) ?? "",
    })
    // Structured outputs guarantees valid JSON; 4000 tokens is ample for a card.
    const result = await callClaudeForJson(system, user, 4000, MODEL, schema)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-classroom-management] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
