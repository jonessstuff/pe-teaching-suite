import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildTheaterPrompt } from "../_shared/theaterPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_PROCESSES = ["creating", "performing", "responding", "connecting"]

Deno.serve(async (req: Request) => {
  console.log("[generate-theater] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { gradeBand, artisticProcess } = body ?? {}
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }
  if (!VALID_PROCESSES.includes(artisticProcess as string)) {
    return errorResponse(`artisticProcess must be one of: ${VALID_PROCESSES.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildTheaterPrompt(body as Record<string, unknown>)

    // Prose-dense NCCAS lesson (objectives, warm-up, 2–3 activities, standards).
    // Completes on the default model (Sonnet) under the 150s limit — no keepalive needed.
    const maxTokens = 4800
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Theater", grades: gradeBand ? [gradeBand] : [], type: "theater", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-theater" });
    console.error("[generate-theater] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
