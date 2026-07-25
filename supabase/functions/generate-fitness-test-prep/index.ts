import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildFitnessTestPrepPrompt } from "../_shared/fitnessTestPrepPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  if (!req.headers.get("Authorization")) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { gradeBands, testName, component, state, classSize, duration } = body ?? {};
  if (!component) return errorResponse("component is required", 400);

  try {
    const { system, user } = buildFitnessTestPrepPrompt({ gradeBands, testName, component, state, classSize, duration });
    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, 8000);

    if (!result?.title) return errorResponse("Model response missing lesson object", 500);
    await captureLessonGenerated(req, { subject: "PE", grades: gradeBands, type: "fitness_test_prep", durationMs: Date.now() - _t0 });
    return jsonResponse(result);
  } catch (err) {
    await reportError(err, { fn: "generate-fitness-test-prep" });
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
