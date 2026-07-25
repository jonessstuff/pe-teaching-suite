import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildAdaptivePEPrompt } from "../_shared/adaptivePEPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

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
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Adaptive PE", grades: Array.isArray((body as any)?.gradeBands) ? (body as any).gradeBands : [], type: "adaptive_pe", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-adaptive-pe" });
    console.error("[generate-adaptive-pe] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
