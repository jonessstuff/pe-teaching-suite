import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildMakerProjectPrompt } from "../_shared/makerProjectPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_TOOLS = ["3d_printer", "laser_cutter", "screen_printing", "vinyl_cutter", "robotics", "hand_tools", "electronics", "classic_build"]

Deno.serve(async (req: Request) => {
  console.log("[generate-maker-project] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { tool, gradeBand } = body ?? {}
  if (!VALID_TOOLS.includes(tool as string)) {
    return errorResponse(`tool must be one of: ${VALID_TOOLS.join(", ")}`, 400)
  }
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }

  try {
    const { system, user } = buildMakerProjectPrompt(body as Record<string, unknown>)

    // Prose-dense: tool safety, a 5–6 step design cycle, station/large-group logistics,
    // cross-curricular tie, and a low-tech variant. Generous headroom so the JSON never
    // truncates; completes on the default model (Sonnet) under the 150s limit, so no
    // keepalive stream is needed.
    const maxTokens = 4800
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "Makerspace", grades: gradeBand ? [gradeBand] : [], type: "maker", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-maker-project" });
    console.error("[generate-maker-project] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
