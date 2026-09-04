import { corsHeaders, errorResponse } from "../_shared/cors.js"
import { buildWorldLanguagesPrompt, buildWorldLanguagesSchema } from "../_shared/worldLanguagesPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_LEVELS = ["novice", "intermediate", "advanced"]

Deno.serve(async (req: Request) => {
  console.log("[generate-world-languages] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { gradeBand, proficiencyLevel, targetLanguage } = body ?? {}
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }
  if (!VALID_LEVELS.includes(String(proficiencyLevel).toLowerCase())) {
    return errorResponse(`proficiencyLevel must be one of: ${VALID_LEVELS.join(", ")}`, 400)
  }
  if (!targetLanguage || !String(targetLanguage).trim()) {
    return errorResponse(`targetLanguage is required`, 400)
  }

  const { system, user } = buildWorldLanguagesPrompt(body as Record<string, unknown>)

  // Dense output (3 communication modes + 5 Cs + vocabulary). Like generate-cte-lesson,
  // stream a keepalive newline every 10s to beat Supabase's 150s idle timeout, then
  // write the final JSON (a generation failure comes back as HTTP 200 + { error }).
  // Structured outputs guarantees valid JSON — important because example vocabulary
  // carries accented / non-Latin / apostrophe text that can trip a tolerant parser.
  const maxTokens = 6000
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let finished = false
      let clientClosed = false
      const write = (text: string) => {
        if (clientClosed) return
        try {
          controller.enqueue(encoder.encode(text))
        } catch {
          clientClosed = true
        }
      }
      const keepalive = setInterval(() => {
        if (finished) return
        write("\n")
      }, 10000)

      try {
        const _t0 = Date.now()
        const result = await callClaudeForJson(system, user, maxTokens, undefined, buildWorldLanguagesSchema())
        finished = true
        clearInterval(keepalive)
        await captureLessonGenerated(req, { subject: "World Languages", grades: gradeBand ? [gradeBand] : [], type: "world-languages", durationMs: Date.now() - _t0 })
        write(JSON.stringify(result))
      } catch (err) {
        finished = true
        clearInterval(keepalive)
        await reportError(err, { fn: "generate-world-languages" })
        console.error("[generate-world-languages] error:", err)
        write(JSON.stringify({ error: (err as Error).message ?? String(err) }))
      } finally {
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
    },
  })

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
