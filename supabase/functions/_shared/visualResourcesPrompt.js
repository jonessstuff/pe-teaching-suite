/**
 * Visual Teaching Resources prompt builder.
 *
 * A SECOND PASS over an already-generated lesson. It does NOT rewrite the
 * lesson. Its one job: find places where the lesson tells the teacher to
 * create / display / post / prepare / hand out a concrete instructional
 * material, and BUILD the actual, ready-to-use material — pulling real
 * content from THIS lesson.
 *
 * SCOPE (this build): structured, text-based resources only —
 *   checklist · vocab_cards · scenario_cards · cue_cards · organizer
 * TRUE visuals (drawn diagrams, illustrations, labeled pictures, gym-setup
 * drawings, movement-sequence art) are OUT OF SCOPE and must be SKIPPED —
 * they need real image generation (a separate, future capability). The model
 * lists those under "skipped_visuals" so we know what was intentionally left.
 *
 * Not every lesson needs a resource. If nothing genuinely triggers, the model
 * returns an empty array — zero is a correct, expected answer.
 */

// Derived/secondary layers and bulky non-content fields are stripped before the
// lesson is shown to the model — they are noise for this task (and passing
// visual_resources back in would invite recursion).
const OMIT_FIELDS = new Set([
  "sub_friendly_instructions", "sub_script", "sub_management_script", "sub_diagram",
  "quiz_questions", "suggested_video_searches",
  "parent_note_intro", "parent_note_skills", "parent_note_vocabulary", "parent_note_ask",
  "obs_overview", "obs_differentiation", "obs_look_for",
  "weather_alt_warm_up", "weather_alt_fitness_activities", "weather_alt_whole_group_instruction",
  "weather_alt_independent_practice", "weather_alt_closure", "weather_alt_location",
  "weather_alt_equipment_needed", "weather_alt_setup_diagram", "weather_alt_notes",
  "poster_content", "visual_resources",
]);

function leanLesson(lessonObject) {
  const out = {};
  for (const [k, v] of Object.entries(lessonObject ?? {})) {
    if (OMIT_FIELDS.has(k)) continue;
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out;
}

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
export function buildVisualResourcesPrompt(lessonObject) {
  const system = `You are an instructional-materials builder. You are given a COMPLETE, already-written lesson (as JSON). Your ONE job is to find where the lesson tells the teacher to CREATE, DISPLAY, POST, PREPARE, or HAND OUT a concrete instructional material — and BUILD the actual, ready-to-use material, pulling REAL content from THIS lesson. You are NOT rewriting or critiquing the lesson.

MATERIAL DESIGN RULES:
- Identify the audience in the wording: teacher reference, student handout, student display, or assessment/data collection.
- Student-facing directions use short sentences, large-print-friendly wording, and one main task per resource.
- Teacher-facing resources prioritize setup, cues, observable evidence, and fast data collection.
- Make every resource useful in color AND legible when printed in black and white. Never rely on color alone.
- Leave useful response space in organizers, reflections, and data sheets.
- Do not repeat the full lesson. Build only the artifact a teacher would actually print, display, or hand to a learner.

WHAT COUNTS AS A TRIGGER — language in the lesson referencing a material the teacher is expected to provide, e.g.: a checklist or success-criteria list; vocabulary cards / word wall / vocab support; a set of scenario cards or a scenario worksheet; cue cards / prompt cards / coaching-cue cards; a graphic organizer / chart / T-chart / Venn / sorting mat; text station signs or a steps/procedure card; a self-assessment or peer-feedback sheet. Trigger words include: display, post, show, hand out, prepare, create, make, provide, "give each student/group", "have ready", "students use the ___", cards, checklist, organizer, chart, cue, scenario, sort, steps, model, visual support.

BUILDABLE NOW vs SKIP:
- BUILDABLE (structured / text-based) — build these FULLY, with real content: checklist, vocab_cards, scenario_cards, cue_cards, organizer.
- SKIP (true visual / diagram / illustration whose value is a PICTURE and which needs drawing) — do NOT attempt. Instead record them in "skipped_visuals". Examples to skip: a drawn court/gym/field setup diagram, a movement-sequence illustration, an anatomical or labeled picture, a hand-drawn map or floor plan, a photo. (A short text/ASCII layout the lesson already contains is NOT something to rebuild.)

CONTENT MUST BE REAL AND COMPLETE — this is the whole point:
- vocab_cards: ONE card per REAL term taken from this lesson's own vocabulary/content, each with a correct, grade-appropriate definition (and a short example tied to the lesson when natural). Never invent off-topic terms.
- scenario_cards: each "scenario" is a COMPLETE, realistic situation (2–5 sentences) a student reads and responds to, specific to this lesson's topic — not a template.
- checklist / organizer: specific, usable items/rows drawn from the lesson's success criteria, steps, and content — real text, not blanks.
- cue_cards: "front" is the cue/skill/prompt; "back" is the concise real coaching points / answer / steps.
- ABSOLUTELY NO placeholders: never output "[add term]", "Definition here", "Students write their own…", "Example TBD", or empty stub items. If you cannot produce genuine, complete content for a trigger, OMIT that resource entirely.

DO NOT FORCE IT: Many lessons reference NO buildable material — that is normal and CORRECT. If nothing in the lesson genuinely calls for one of these materials, return an empty "visual_resources" array. Never manufacture a need to fill space. Typical output is 0–4 resources; build only what the lesson actually asks for, and prefer fewer, genuinely-useful resources over padding.

Return ONLY a single JSON object — no markdown fences, no commentary — of this shape. Each element of visual_resources is exactly ONE of these typed objects:

{
  "visual_resources": [
    { "type": "checklist",      "title": string, "supports": string, "instructions": string, "items": string[] },
    { "type": "vocab_cards",    "title": string, "supports": string, "cards": [ { "term": string, "definition": string, "example": string } ] },
    { "type": "scenario_cards", "title": string, "supports": string, "cards": [ { "label": string, "scenario": string, "prompts": string[] } ] },
    { "type": "cue_cards",      "title": string, "supports": string, "cards": [ { "front": string, "back": string } ] },
    { "type": "organizer",      "title": string, "supports": string, "instructions": string, "columns": [ { "heading": string, "rows": string[] } ] }
  ],
  "skipped_visuals": [ { "description": string, "reason": string } ]
}

Field notes:
- "supports": the lesson section/moment the material is for, in plain words (e.g. "Warm-Up", "Whole-group instruction", "New vocabulary", "Independent practice", "Closure"). We place a small callout next to that part of the lesson, so make it match a real part of THIS lesson.
- "title": what appears at the top of the printed material — concrete and lesson-specific.
- "instructions": one short line telling the student/teacher how to use the material (omit or "" if obvious).
- Keep everything grade-appropriate for the lesson's grade_bands and true to its subject and content.
- "skipped_visuals" is informational only (what a true-image capability would build later); keep it short.`;

  const user = `Here is the lesson (JSON). Identify any material it tells the teacher to create/display/hand out, BUILD the buildable ones with real content pulled from this lesson, and SKIP true visuals. If nothing genuinely triggers a resource, return an empty visual_resources array.

${JSON.stringify(leanLesson(lessonObject), null, 2)}

Return the JSON object now.`;

  return { system, user };
}
