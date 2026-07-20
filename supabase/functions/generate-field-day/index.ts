import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildFieldDayPrompt } from "../_shared/fieldDayPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { numStudents, gradeLevels, duration, space, numStations, theme } = body ?? {};
  if (!numStudents) return errorResponse("numStudents is required", 400);

  try {
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
