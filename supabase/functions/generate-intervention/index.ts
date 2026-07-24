import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildInterventionPrompt } from "../_shared/interventionPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_DOMAINS = ["", "Reading", "Math", "Behavior"]
const VALID_BANDS = ["", "k-2", "3-5", "6-8", "9-12"]

Deno.serve(async (req: Request) => {
  console.log("[generate-intervention] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { concern, domain, gradeBand } = body ?? {}
  if (!concern || typeof concern !== "string" || !concern.trim()) {
    return errorResponse("concern is required", 400)
  }
  if (domain !== undefined && !VALID_DOMAINS.includes(domain as string)) {
    return errorResponse(`domain must be one of: Reading, Math, Behavior (or empty to infer)`, 400)
  }
  if (gradeBand !== undefined && !VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.filter(Boolean).join(", ")}`, 400)
  }

  try {
    const { system, user } = buildInterventionPrompt(body as Record<string, unknown>)

    // A single tiered intervention with steps + progress monitoring + standards
    // is prose-dense but bounded; completes on Sonnet under the 150s limit.
    const maxTokens = 4500
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-intervention] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
