import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildDifferentiationPrompt } from "../_shared/differentiationPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const VALID_TYPES = new Set(['advanced', 'below_grade', 'sensory', 'ell', 'physical']);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { lessonId, differentiationType } = body ?? {};
  if (!lessonId) return errorResponse("lessonId is required", 400);
  if (!differentiationType || !VALID_TYPES.has(differentiationType)) {
    return errorResponse("differentiationType must be one of: advanced, below_grade, sensory, ell, physical", 400);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: row, error } = await supabase
      .from("lessons").select("lesson_object").eq("id", lessonId).single();
    if (error) return errorResponse(`Lesson not found: ${error.message}`, 404);

    const { system, user } = buildDifferentiationPrompt(row.lesson_object, differentiationType);
    const result = await callClaudeForJson(system, user, 6000);

    if (!result?.differentiation) return errorResponse("Model response missing differentiation", 500);
    return jsonResponse({ differentiation: result.differentiation });
  } catch (err) {
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
