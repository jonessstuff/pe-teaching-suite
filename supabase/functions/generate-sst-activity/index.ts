import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildSstActivityPrompt } from "../_shared/sstActivityPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_ROLES = ["social_worker", "school_psych", "mflc", "behavior_specialist"]
const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_SKILLS = ["emotional_regulation", "social_skills", "conflict", "self_esteem", "stress_mindfulness", "executive_function", "transitions"]

Deno.serve(async (req: Request) => {
  console.log("[generate-sst-activity] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { role, gradeBand, skillArea } = body ?? {}
  if (!VALID_ROLES.includes(role as string)) {
    return errorResponse(`role must be one of: ${VALID_ROLES.join(", ")}`, 400)
  }
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }
  if (!VALID_SKILLS.includes(skillArea as string)) {
    return errorResponse(`skillArea must be one of: ${VALID_SKILLS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildSstActivityPrompt(body as Record<string, unknown>)

    // Prose-dense: a full group-activity structure (opening, core activity, processing,
    // facilitation tips, standards). Completes on the default model (Sonnet) under the
    // 150s limit, so no keepalive stream is needed.
    const maxTokens = 4500
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Student Support Team Activities", grades: gradeBand ? [gradeBand] : [], type: "sst", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-sst-activity" });
    console.error("[generate-sst-activity] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
