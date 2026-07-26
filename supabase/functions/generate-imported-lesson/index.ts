import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildImportedLessonPrompt } from "../_shared/importedLessonPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { rawText, subject, gradeBand, targetLanguage } = body ?? {};
  if (!rawText?.trim()) return errorResponse("rawText is required", 400);
  if (!subject) return errorResponse("subject is required", 400);

  try {
    const { system, user, schema } = buildImportedLessonPrompt({ rawText, subject, gradeBand: gradeBand ?? 5, targetLanguage });
    // `schema` (e.g. World Languages) enables structured outputs for guaranteed
    // valid JSON where accented/apostrophe content would trip the tolerant parser.
    const result = await callClaudeForJson(system, user, 8000, undefined, schema);

    if (!result?.title) return errorResponse("Model response missing lesson object", 500);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
