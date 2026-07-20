import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildBehaviorNotePrompt } from "../_shared/behaviorNotePrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { studentName, incidentDescription, gradeLevel, subject } = body ?? {};
  if (!incidentDescription?.trim()) return errorResponse("incidentDescription is required", 400);

  try {
    const { system, user } = buildBehaviorNotePrompt({ studentName, incidentDescription, gradeLevel, subject });
    const result = await callClaudeForJson(system, user, 6000);

    if (typeof result?.behavior_note !== 'string') return errorResponse("Model response missing behavior_note", 500);
    return jsonResponse({ behavior_note: result.behavior_note });
  } catch (err) {
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
