import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildAfterSchoolClubsPrompt } from "../_shared/afterSchoolClubsPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const VALID_BANDS = ["k-2", "3-5", "6-8", "9-12"]
const VALID_CLUBS = [
  "basketball", "volleyball", "soccer", "flag_football", "pickleball", "badminton", "table_tennis", "ultimate_frisbee", "bowling", "archery",
  "dnd", "stem", "robotics", "coding", "debate", "model_un", "quiz_bowl", "book_club", "creative_writing", "chess", "math_team",
  "yearbook", "newspaper", "photography", "film_video", "art", "choir", "drama", "step_team", "dance_team",
  "run_club", "fitness_club", "jump_rope", "cheer", "yoga", "hiking",
  "student_council", "honor_society", "kindness_club", "environmental_club", "peer_mentoring",
  "anime_manga", "esports", "language_culture",
]

Deno.serve(async (req: Request) => {
  console.log("[generate-after-school-clubs] handler entered, method:", req.method)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return errorResponse("Method not allowed", 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse("Invalid JSON body", 400)
  }

  const { gradeBand, clubType } = body ?? {}
  if (!VALID_BANDS.includes(gradeBand as string)) {
    return errorResponse(`gradeBand must be one of: ${VALID_BANDS.join(", ")}`, 400)
  }
  if (!VALID_CLUBS.includes(clubType as string)) {
    return errorResponse(`clubType must be one of the supported club types`, 400)
  }

  try {
    const { system, user } = buildAfterSchoolClubsPrompt(body as Record<string, unknown>)

    // Prose-dense: session structure, first/ongoing variants, tips, extensions.
    // Completes on the default model (Sonnet) under the 150s limit — no keepalive needed.
    const maxTokens = 4500
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, maxTokens)
    await captureLessonGenerated(req, { subject: "After-School Clubs", grades: gradeBand ? [gradeBand] : [], type: "after-school-clubs", durationMs: Date.now() - _t0 });
    return jsonResponse(result)
  } catch (err) {
    await reportError(err, { fn: "generate-after-school-clubs" });
    console.error("[generate-after-school-clubs] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
