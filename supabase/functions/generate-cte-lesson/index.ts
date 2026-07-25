import { corsHeaders, errorResponse } from "../_shared/cors.js"
import { buildCteLessonPrompt } from "../_shared/cteLessonPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js"
import { reportError } from "../_shared/sentry.js"

const VALID_PATHWAYS = ["hospitality", "finance", "marketing", "human_services", "health_science", "education", "career_readiness", "information_technology", "transportation", "manufacturing", "engineering_tech", "business_mgmt", "agriculture"]
const VALID_TIERS = ["ms", "hs"]
const VALID_LEVELS = ["introductory", "concentrator", "completer"]

// A full CTE lesson (~6-7K output tokens) takes ~150s on Sonnet, right at Supabase's
// hard function time limit — so generations tip over and fail. Haiku 4.5 generates the
// same lesson ~2-3x faster (~50-70s), landing comfortably under the limit. The keepalive
// stream below stays as a safety net. Model choice is CTE-specific; other generators keep Sonnet.
const CTE_MODEL = "claude-haiku-4-5"

Deno.serve(async (req: Request) => {
  console.log("[generate-cte-lesson] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { pathway, tier, level, includeELL } = body ?? {}

  if (!VALID_PATHWAYS.includes(pathway as string)) {
    return errorResponse(`pathway must be one of: ${VALID_PATHWAYS.join(", ")}`, 400)
  }

  if (!VALID_TIERS.includes(tier as string)) {
    return errorResponse(`tier must be one of: ${VALID_TIERS.join(", ")}`, 400)
  }

  // High School (Pathway) tier requires a level; Middle School (Exploratory) does not.
  if (tier === "hs" && !VALID_LEVELS.includes(level as string)) {
    return errorResponse(`level must be one of: ${VALID_LEVELS.join(", ")} when tier is "hs"`, 400)
  }

  const { system, user, schema } = buildCteLessonPrompt(body as Record<string, unknown>)

  // Token budget vs the ~150s wall: Haiku generates ~90 tok/s here, so ~13K output
  // tokens is the practical ceiling before the function time limit. A full HS lesson
  // needs more than the old 8000 cap (it was truncating mid-JSON), so raise the base
  // to 12000 (~135s worst case). ELL adds a substantial section; 13000 is the safe max.
  const maxTokens = includeELL ? 13000 : 12000

  // A dense HS lesson can take >150s to generate. The Claude call is non-streaming,
  // so nothing reaches the client until it completes, and Supabase kills the worker
  // at its 150s idle-timeout ("Edge Function returned a non-2xx status code"). To stay
  // under that limit we return a streamed response and emit a newline keepalive byte
  // every 10s while the model works, then write the final JSON. JSON.parse ignores
  // leading whitespace, so the client parses the body unchanged. Note: once streaming
  // starts the status is already 200, so a generation failure is surfaced as a
  // { "error": ... } body (the client throws on that) rather than a non-2xx status.
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let finished = false
      const keepalive = setInterval(() => {
        if (finished) return
        try {
          controller.enqueue(encoder.encode("\n"))
        } catch {
          // controller already closed (e.g. client disconnected)
        }
      }, 10000)

      try {
        // Structured outputs guarantees valid JSON, but the ELL-augmented schema
        // exceeds Anthropic's compiled-grammar size limit (400). ELL is opt-in and
        // rarer, so skip the schema there and fall back to the tolerant text parser.
        const _t0 = Date.now()
        const result = await callClaudeForJson(system, user, maxTokens, CTE_MODEL, includeELL ? null : schema)
        finished = true
        clearInterval(keepalive)
        await captureLessonGenerated(req, { subject: "CTE", grades: tier ? [tier] : [], type: "cte", durationMs: Date.now() - _t0 })
        controller.enqueue(encoder.encode(JSON.stringify(result)))
      } catch (err) {
        finished = true
        clearInterval(keepalive)
        await reportError(err, { fn: "generate-cte-lesson" })
        console.error("[generate-cte-lesson] error:", err)
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: (err as Error).message ?? String(err) })),
        )
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
