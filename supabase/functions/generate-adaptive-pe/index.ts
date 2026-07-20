import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildAdaptivePEPrompt } from "../_shared/adaptivePEPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

Deno.serve(async (req: Request) => {
  console.log("[generate-adaptive-pe] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { mode } = body ?? {}
  if (mode !== "adapt" && mode !== "plan") {
    return errorResponse('mode must be "adapt" or "plan"', 400)
  }

  try {
    const { system, user } = buildAdaptivePEPrompt(body as Record<string, unknown>)

    // Mode 1 (adapt) outputs a focused accommodation document — ~1500–2500 tokens.
    // Mode 2 (plan) outputs a full structured lesson plan — ~3000–4000 tokens.
    const maxTokens = mode === "plan" ? 4000 : 2500
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-adaptive-pe] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
