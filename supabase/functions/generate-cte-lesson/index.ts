import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js"
import { buildCteLessonPrompt } from "../_shared/cteLessonPrompt.js"
import { callClaudeForJson } from "../_shared/anthropic.js"

const VALID_PATHWAYS = ["hospitality", "finance", "marketing"]
const VALID_TIERS = ["ms", "hs"]
const VALID_LEVELS = ["introductory", "concentrator", "completer"]

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

  try {
    const { system, user } = buildCteLessonPrompt(body as Record<string, unknown>)

    // ELL accommodations add a substantial extra section, pushing responses past
    // the base budget and truncating the JSON.
    const maxTokens = includeELL ? 12000 : 8000
    const result = await callClaudeForJson(system, user, maxTokens)
    return jsonResponse(result)
  } catch (err) {
    console.error("[generate-cte-lesson] error:", err)
    return errorResponse((err as Error).message ?? String(err), 500)
  }
})
