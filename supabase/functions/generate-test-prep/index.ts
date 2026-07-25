import { corsHeaders, errorResponse } from "../_shared/cors.js"
import { buildTestPrepPrompt, buildTestPrepSchema } from "../_shared/testPrepPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_PATHS = ["sat_act", "state"]
const VALID_TESTS = ["sat", "act"]

Deno.serve(async (req: Request) => {
  console.log("[generate-test-prep] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { path, test } = body ?? {}
  if (!VALID_PATHS.includes(path as string)) {
    return errorResponse(`path must be one of: ${VALID_PATHS.join(", ")}`, 400)
  }
  if (path === "sat_act" && !VALID_TESTS.includes(test as string)) {
    return errorResponse(`test must be one of: ${VALID_TESTS.join(", ")} for the SAT/ACT path`, 400)
  }

  const { system, user } = buildTestPrepPrompt(body as Record<string, unknown>)

  // Prose-dense: original practice items with explanations + passages (state path)
  // + review + strategies. The state/passage path can run long, so — like
  // generate-cte-lesson — stream a keepalive newline every 10s to beat Supabase's
  // 150s idle timeout, then write the final JSON. JSON.parse ignores the leading
  // whitespace, so the client parses the body unchanged; a generation failure comes
  // back as HTTP 200 with an { error } body (the client throws on that).
  // 8000 gives headroom so the passage-heavy state path doesn't truncate mid-JSON
  // (5000 occasionally did); the keepalive stream covers the longer runtime.
  const maxTokens = 8000
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
        const _t0 = Date.now()
        // Structured outputs guarantees valid JSON — critical for the Math state path,
        // whose explanations contain notation that broke the tolerant text parser.
        const result = await callClaudeForJson(system, user, maxTokens, undefined, buildTestPrepSchema())

        // Deterministic safety net for HARD multi-step / systems math: the model
        // occasionally slips arithmetic and "thinks out loud" in the explanation
        // ("wait… re-examine… this item needs a rebuild"), which signals a flawed item
        // (sometimes with a wrong answer key). Drop any practice question whose
        // explanation shows that self-correction, so a rambly/likely-wrong item never
        // reaches the user. Keep the filtered set unless it would leave too few items.
        const SELF_CORRECT = /\bwait\b|re-?examine|let'?s restate|\brestate:|item needs|clean rebuild|clean final version|this signals the item|needs a clean/i
        if (result && Array.isArray(result.practice_questions)) {
          const clean = result.practice_questions.filter(
            (q: Record<string, unknown>) => !(typeof q?.explanation === "string" && SELF_CORRECT.test(q.explanation)),
          )
          if (clean.length >= 3 || clean.length === result.practice_questions.length) {
            result.practice_questions = clean
          }
        }
        finished = true
        clearInterval(keepalive)
        await captureLessonGenerated(req, { subject: "Test Prep", grades: [], type: "test-prep", durationMs: Date.now() - _t0 })
        controller.enqueue(encoder.encode(JSON.stringify(result)))
      } catch (err) {
        finished = true
        clearInterval(keepalive)
        await reportError(err, { fn: "generate-test-prep" })
        console.error("[generate-test-prep] error:", err)
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
