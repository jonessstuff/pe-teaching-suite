/**
 * Edge Function: generate-weather-alt
 *
 * Takes a lessonId, fetches the existing LessonObject (respecting RLS
 * via the caller's JWT), and generates an indoor-alternative version of
 * the lesson flow. Learning targets, standards, success criteria, skill
 * focus, and vocabulary are preserved — only warm_up, fitness_activities,
 * whole_group_instruction, independent_practice, closure, location, and
 * equipment are rewritten for an indoor gym/classroom setting.
 *
 * If the lesson already specifies an indoor location, no AI call is made
 * and a "no alternative needed" response is returned immediately.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildWeatherAltPrompt } from "../_shared/weatherAltPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const INDOOR_KEYWORDS = ["gym", "gymnasium", "classroom", "cafeteria", "auditorium", "indoor", "inside", "hallway", "multipurpose room", "weight room", "dance studio"];

function isAlreadyIndoor(location: string): boolean {
  if (!location) return false;
  const lower = location.toLowerCase();
  return INDOOR_KEYWORDS.some((kw) => lower.includes(kw));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("Missing Authorization header", 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { lessonId } = body ?? {};
  if (!lessonId) {
    return errorResponse("lessonId is required", 400);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: row, error: fetchError } = await supabase
      .from("lessons")
      .select("lesson_object")
      .eq("id", lessonId)
      .single();

    if (fetchError) {
      return errorResponse(`Lesson not found: ${fetchError.message}`, 404);
    }

    const lessonObject = row.lesson_object;

    // If the lesson is already indoors, skip the AI call and return a note.
    if (isAlreadyIndoor(lessonObject.location ?? "")) {
      return jsonResponse({
        weather_alt_warm_up: "",
        weather_alt_fitness_activities: "",
        weather_alt_whole_group_instruction: "",
        weather_alt_independent_practice: "",
        weather_alt_closure: "",
        weather_alt_location: lessonObject.location ?? "",
        weather_alt_equipment_needed: [],
        weather_alt_setup_diagram: "",
        weather_alt_notes: `This lesson is already planned for an indoor setting (${lessonObject.location}) — no outdoor alternative is needed. The original lesson plan works as written.`,
      });
    }

    const { system, user } = buildWeatherAltPrompt(lessonObject);
    const result = await callClaudeForJson(system, user, 8000);

    return jsonResponse({
      weather_alt_warm_up: result.weather_alt_warm_up ?? "",
      weather_alt_fitness_activities: result.weather_alt_fitness_activities ?? "",
      weather_alt_whole_group_instruction: result.weather_alt_whole_group_instruction ?? "",
      weather_alt_independent_practice: result.weather_alt_independent_practice ?? "",
      weather_alt_closure: result.weather_alt_closure ?? "",
      weather_alt_location: result.weather_alt_location ?? "Gymnasium",
      weather_alt_equipment_needed: Array.isArray(result.weather_alt_equipment_needed) ? result.weather_alt_equipment_needed : [],
      weather_alt_setup_diagram: result.weather_alt_setup_diagram ?? "",
      weather_alt_notes: result.weather_alt_notes ?? "",
    });
  } catch (err) {
    return errorResponse((err as any).message ?? String(err), 500);
  }
});
