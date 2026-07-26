import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildJrotcPrompt } from "../_shared/jrotcPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_LEVELS = ["LET 1", "LET 2", "LET 3", "LET 4"]
const VALID_AREAS = [
  "leadership_fundamentals",
  "advanced_leadership",
  "citizenship_civics",
  "wellness_life_skills",
  "service_learning",
  "career_exploration",
]

Deno.serve(async (req: Request) => {
  console.log("[generate-jrotc] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { topic, letLevel, contentArea } = body ?? {}
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return errorResponse("topic is required", 400)
  }
  if (!VALID_LEVELS.includes(letLevel as string)) {
    return errorResponse(`letLevel must be one of: ${VALID_LEVELS.join(", ")}`, 400)
  }
  if (!VALID_AREAS.includes(contentArea as string)) {
    return errorResponse(`contentArea must be one of: ${VALID_AREAS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildJrotcPrompt(body as Record<string, unknown>)

    // A full JROTC leadership/citizenship lesson (flow, activity, reflection,
    // standards) is prose-dense; the richer LET 3–4 lessons (mentoring, service,
    // career) can run ~20KB, so size the ceiling generously (4500 truncated the
    // advanced-leadership lesson mid-JSON). Still completes on Sonnet under 150s.
    const maxTokens = 6000
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "JROTC", grades: letLevel ? [letLevel] : [], type: "jrotc", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-jrotc" });
    console.error("[generate-jrotc] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
