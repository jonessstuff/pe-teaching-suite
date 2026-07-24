import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildStaffPdPrompt } from "../_shared/staffPdPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_AREAS = ["staff_pd", "mentoring", "walkthrough", "plc", "communication"]

Deno.serve(async (req: Request) => {
  console.log("[generate-staff-pd] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { contentArea, topic } = body ?? {}
  if (!VALID_AREAS.includes(contentArea as string)) {
    return errorResponse(`contentArea must be one of: ${VALID_AREAS.join(", ")}`, 400)
  }
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return errorResponse("topic is required", 400)
  }

  try {
    const { system, user } = buildStaffPdPrompt(body as Record<string, unknown>)

    // A structured adult-PD plan (agenda, sections, standards) is prose-dense
    // but bounded; completes on Sonnet under the 150s limit.
    const maxTokens = 5000
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-staff-pd] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
