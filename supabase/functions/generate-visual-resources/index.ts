/**
 * Edge Function: generate-visual-resources
 *
 * SECOND PASS over a saved lesson. Fetches the LessonObject (RLS via the
 * caller's JWT), scans it for language that tells the teacher to create /
 * display / hand out a concrete instructional material, and BUILDS the
 * actual, ready-to-use material for the buildable (text/structure-based)
 * ones — pulling real content from the lesson itself.
 *
 * Scope: checklist · vocab_cards · scenario_cards · cue_cards · organizer.
 * True visuals (drawn diagrams / illustrations) are intentionally SKIPPED
 * (they need real image generation — a separate future capability).
 *
 * If nothing genuinely triggers, returns { visual_resources: [] } — zero is
 * a correct outcome; lessons are never forced to carry resources.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.js";
import { buildVisualResourcesPrompt } from "../_shared/visualResourcesPrompt.js";
import { callClaudeForJson } from "../_shared/anthropic.js";
import { captureLessonGenerated } from "../_shared/analytics.js";
import { reportError } from "../_shared/sentry.js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const RESOURCE_TYPES = new Set(["checklist", "vocab_cards", "scenario_cards", "cue_cards", "organizer"]);

// Reject model output that slipped a placeholder past the prompt, so a
// resource never ships with a stub instead of real content.
const PLACEHOLDER = /\b(add (your|a) (own|term)|definition here|example tbd|fill in|to be determined|tbd|lorem ipsum|\[[^\]]*\]|students write their own)\b/i;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strArr = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter((s) => s && !PLACEHOLDER.test(s)) : [];

/**
 * Defensive normalization — the pass is free-form JSON, so validate every
 * resource: known type, real content, no placeholders. Anything that can't
 * be made into a genuinely usable material is dropped (better zero than a stub).
 */
function normalizeResources(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  const out: Array<Record<string, unknown>> = [];

  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const type = str((r as any).type);
    if (!RESOURCE_TYPES.has(type)) continue;
    const title = str((r as any).title);
    const supports = str((r as any).supports);
    const instructions = str((r as any).instructions);

    if (type === "checklist") {
      const items = strArr((r as any).items);
      if (items.length >= 2) out.push({ type, title: title || "Checklist", supports, instructions, items });
    } else if (type === "vocab_cards") {
      const cards = (Array.isArray((r as any).cards) ? (r as any).cards : [])
        .map((c: any) => ({ term: str(c?.term), definition: str(c?.definition), example: str(c?.example) }))
        .filter((c: any) => c.term && c.definition && !PLACEHOLDER.test(c.term) && !PLACEHOLDER.test(c.definition));
      if (cards.length >= 1) out.push({ type, title: title || "Vocabulary Cards", supports, cards });
    } else if (type === "scenario_cards") {
      const cards = (Array.isArray((r as any).cards) ? (r as any).cards : [])
        .map((c: any) => ({ label: str(c?.label), scenario: str(c?.scenario), prompts: strArr(c?.prompts) }))
        .filter((c: any) => c.scenario.length >= 20 && !PLACEHOLDER.test(c.scenario));
      if (cards.length >= 1) out.push({ type, title: title || "Scenario Cards", supports, cards });
    } else if (type === "cue_cards") {
      const cards = (Array.isArray((r as any).cards) ? (r as any).cards : [])
        .map((c: any) => ({ front: str(c?.front), back: str(c?.back) }))
        .filter((c: any) => c.front && !PLACEHOLDER.test(c.front) && !PLACEHOLDER.test(c.back));
      if (cards.length >= 1) out.push({ type, title: title || "Cue Cards", supports, cards });
    } else if (type === "organizer") {
      const columns = (Array.isArray((r as any).columns) ? (r as any).columns : [])
        .map((c: any) => ({ heading: str(c?.heading), rows: strArr(c?.rows) }))
        .filter((c: any) => c.heading);
      if (columns.length >= 1) out.push({ type, title: title || "Graphic Organizer", supports, instructions, columns });
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Missing Authorization header", 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { lessonId } = body ?? {};
  if (!lessonId) return errorResponse("lessonId is required", 400);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: row, error: fetchError } = await supabase
      .from("lessons")
      .select("lesson_object")
      .eq("id", lessonId)
      .single();

    if (fetchError) return errorResponse(`Lesson not found: ${fetchError.message}`, 404);

    const lessonObject = row.lesson_object ?? {};
    const { system, user } = buildVisualResourcesPrompt(lessonObject);

    const _t0 = Date.now();
    const result = await callClaudeForJson(system, user, 12000);
    const visual_resources = normalizeResources(result?.visual_resources);
    const skipped_visuals = Array.isArray(result?.skipped_visuals) ? result.skipped_visuals : [];

    console.log(
      `[visual-resources] lesson=${lessonId} subject=${lessonObject.subject ?? "?"} built=${visual_resources.length} skipped=${skipped_visuals.length}`,
    );

    // Metadata only (never lesson text). Records how often the pass produces
    // resources vs. correctly finds none.
    await captureLessonGenerated(req, {
      subject: lessonObject.subject ?? null,
      grades: Array.isArray(lessonObject.grade_bands) ? lessonObject.grade_bands : [],
      type: "visual_resources",
      durationMs: Date.now() - _t0,
    });

    // Always an array (possibly empty) so the client can tell "ran, found none"
    // from "not yet run" (null).
    return jsonResponse({ visual_resources, skipped_visuals });
  } catch (err) {
    await reportError(err, { fn: "generate-visual-resources" });
    return errorResponse((err as any).message ?? String(err), 500);
  }
});
