import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildExitTicketPrompt } from "../_shared/exitTicketPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body;
  try { body = await req.json(); } catch { return errorResponse("Invalid JSON body", 400); }

  const { lessonId } = body ?? {};
  if (!lessonId) return errorResponse("lessonId is required", 400);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: row, error } = await supabase
      .from("lessons").select("lesson_object").eq("id", lessonId).single();
    if (error) return errorResponse(`Lesson not found: ${error.message}`, 404);

    const { system, user } = buildExitTicketPrompt(row.lesson_object);
    const result = await callClaudeForJson(system, user, 6000);

    if (!Array.isArray(result?.exit_tickets)) return errorResponse("Model response missing exit_tickets", 500);
    return jsonResponse({ exit_tickets: result.exit_tickets });
  } catch (err) {
    console.error(err);
    return errorResponse((err as any)?.message ?? String(err), 500);
  }
});
