import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildFieldDayPrompt, buildGameProposalPrompt } from "../_shared/fieldDayPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { mode, numStudents, gradeLevels, duration, space, numStations, theme, gameIdea, equipmentOnHand } = body ?? {};

  try {
    // "Game Proposal" mode: a single structured game write-up, not a full plan.
    if (mode === "proposal") {
      const { system, user } = buildGameProposalPrompt({
        gameIdea,
        gradeLevels: gradeLevels ?? [3, 4, 5],
        space: space ?? "Outdoor",
        equipmentOnHand,
      });
      const result = await callClaudeForJson(system, user, 3000);
      if (!result?.game_proposal) return errorResponse("Model response missing game_proposal", 500);
      return jsonResponse({ game_proposal: result.game_proposal });
    }

    // Default: full field day plan.
    if (!numStudents) return errorResponse("numStudents is required", 400);
    const { system, user } = buildFieldDayPrompt({
      numStudents,
      gradeLevels: gradeLevels ?? [3, 4, 5],
      duration: duration ?? 180,
      space: space ?? 'outdoor',
      numStations: numStations ?? 8,
      theme,
    });
    const result = await callClaudeForJson(system, user, 8000);

    if (!result?.field_day) return errorResponse("Model response missing field_day", 500);
    return jsonResponse({ field_day: result.field_day });
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
