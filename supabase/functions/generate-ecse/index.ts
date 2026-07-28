import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildEcsePrompt } from "../_shared/ecsePrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_AGE_BANDS = ["birth3", "preschool"]

Deno.serve(async (req: Request) => {
  console.log("[generate-ecse] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { focusSkill, ageBand } = body ?? {}
  if (!focusSkill || typeof focusSkill !== "string") {
    return errorResponse("focusSkill is required", 400)
  }
  if (!VALID_AGE_BANDS.includes(ageBand as string)) {
    return errorResponse(`ageBand must be one of: ${VALID_AGE_BANDS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildEcsePrompt(body as Record<string, unknown>)

    // A full ECSE plan (embedded learning opportunities across routines,
    // specialized supports, family partnership, standards stack) is prose-dense
    // — size maxTokens to the OUTPUT so the tolerant parser never sees a
    // truncated ("Unterminated string") JSON. Completes on Sonnet within 150s.
    const maxTokens = 6000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Early Childhood Special Education", grades: ageBand ? [ageBand] : [], type: "ecse", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-ecse" });
    console.error("[generate-ecse] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
