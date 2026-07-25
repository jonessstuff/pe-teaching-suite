import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildEslSpecialistPrompt } from "../_shared/eslSpecialistPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_LEVELS = ["entering", "emerging", "developing", "expanding", "bridging", "reaching"]

Deno.serve(async (req: Request) => {
  console.log("[generate-esl-specialist] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { topic, gradeBand, proficiencyLevel } = body ?? {}
  if (!topic || typeof topic !== "string") {
    return errorResponse("topic is required", 400)
  }
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }
  if (!VALID_LEVELS.includes(proficiencyLevel as string)) {
    return errorResponse(`proficiencyLevel must be one of: ${VALID_LEVELS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildEslSpecialistPrompt(body as Record<string, unknown>)

    // Prose-dense: content + language objectives, all 4 domains, vocab w/ cognates,
    // frames, SIOP flow, standards. Generous headroom so the JSON never truncates;
    // completes on the default model (Sonnet) under the 150s limit — no keepalive needed.
    const maxTokens = 4800
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "ESL/ELL Specialist", grades: gradeBand ? [gradeBand] : [], type: "esl", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-esl-specialist" });
    console.error("[generate-esl-specialist] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
