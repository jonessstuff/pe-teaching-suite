import { toolDirective } from "./toolSubjectDirectives.js"
/**
 * Observation/Evaluation prep prompt builder.
 *
 * Produces a concise one-page summary for a principal/evaluator walkthrough.
 * Works for every subject shape (PE grade-band lessons AND CTE tier/level
 * lessons). It sends a COMPACT summary of the lesson — deliberately NOT the full
 * serialized lesson: the full dump (with verbatim safety/boundary content) was
 * large enough on CTE lessons to trigger a model refusal (stop_reason
 * "refusal", empty content). The compact, clipped flow is all a 3-part synthesis
 * needs and keeps the request small and unambiguously benign.
 */

// Structured-output schema — forces a valid, complete JSON object and further
// reduces refusal/format risk.
export const OBSERVATION_SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["obs_overview", "obs_differentiation", "obs_look_for"],
  properties: {
    obs_overview: { type: "string" },
    obs_differentiation: { type: "array", items: { type: "string" } },
    obs_look_for: { type: "array", items: { type: "string" } },
  },
};

const clip = (s, n = 600) => (typeof s === "string" ? s.slice(0, n) : "");

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
export function buildObservationSummaryPrompt(lessonObject) {
  const subject = lessonObject.subject ?? "PE";
  const isCte = subject === "CTE" || Boolean(lessonObject.pathway);

  // Level line — CTE uses tier_label; everything else uses grade bands.
  const level = isCte
    ? (lessonObject.tier_label ?? lessonObject.pathway_label ?? "CTE")
    : ((lessonObject.grade_bands ?? []).map((g) => (g === 0 ? "K" : String(g))).join("/") || "K–12");

  // Learning target(s): CTE has a singular string; grade-band lessons have a
  // { grade: text } map.
  const targets = (typeof lessonObject.learning_target === "string" && lessonObject.learning_target)
    ? lessonObject.learning_target
    : (Object.entries(lessonObject.learning_targets ?? {})
        .map(([g, t]) => `Grade ${g === "0" ? "K" : g}: ${t}`).join("\n") || "(none listed)");

  const mods = Object.entries(lessonObject.modifications ?? {})
    .map(([g, t]) => `Grade ${g === "0" ? "K" : g}: ${t}`).join("\n");

  const competencies = isCte
    ? (lessonObject.competencies ?? [])
        .map((c) => `${c.framework ? c.framework + " — " : ""}${c.text ?? c.competency ?? ""}`.trim())
        .filter(Boolean).join("; ")
    : "";

  const skillFocus = Array.isArray(lessonObject.skill_focus)
    ? lessonObject.skill_focus.join(", ")
    : (lessonObject.skill_focus || "");

  const system = `You are an experienced educator helping a colleague prepare a one-page observation summary for a principal or evaluator doing a walkthrough of a ${subject} lesson.

Your output must be professional, concise, and evaluator-friendly — written for someone with limited subject-matter expertise who needs to quickly understand what is happening in the classroom and what to look for. ADAPT everything to THIS lesson's actual subject, content, and vocabulary — the examples below are illustrative (from a PE lesson) and must not be copied literally.

You must return ONLY a single JSON object matching this exact schema:

{ "obs_overview": string, "obs_differentiation": string[], "obs_look_for": string[] }

Field guidance:

obs_overview:
  2-3 sentences (maximum) synthesizing the full lesson arc into a coherent picture of what is happening today and why, in present tense as if the evaluator is walking in mid-lesson. Name the skill or concept being taught. Synthesize — don't list every activity. Illustrative: "Students are in the skill-building phase of a volleyball unit, working on the underhand serve using the BEEF cue, while the teacher rotates providing corrective feedback."

obs_differentiation:
  Exactly 2-3 strings. Each is a specific, concrete way this lesson supports diverse learners, in evaluator-friendly language (what an observer would see or hear) — translated from the lesson's accommodations, not copied verbatim. Begin each with an action phrase.

obs_look_for:
  Exactly 2-3 strings. Each is a specific, observable indicator that signals the lesson is going well — concrete and classroom-specific, referencing this lesson's actual skills, vocabulary, or student behaviors, not generic teaching-quality statements.

Critical rules:
- obs_overview is 2-3 sentences max. obs_differentiation and obs_look_for each have exactly 2-3 string items.
- Do not mention standards/competencies (they are displayed separately).
- Use active, present-tense, observable language. Include no fields beyond the schema.`;

  const user = `Summarize this ${subject} lesson for an evaluator walkthrough.

Title: ${lessonObject.title ?? ""}
${isCte ? "Pathway / level" : "Grade(s)"}: ${level}${isCte && lessonObject.pathway_label ? ` — ${lessonObject.pathway_label}` : ""}
Duration: ${lessonObject.duration_minutes ?? 45} min | Class size: ${lessonObject.class_size ?? ""}
${skillFocus ? `Skill focus: ${skillFocus}\n` : ""}Learning target(s): ${targets}

LESSON FLOW (condensed):
- Opener / warm-up: ${clip(lessonObject.warm_up)}
- Instruction: ${clip(lessonObject.whole_group_instruction)}
- Demonstration / guided practice: ${clip(lessonObject.fitness_activities)}
- Independent / applied practice: ${clip(lessonObject.independent_practice)}
- Closure: ${clip(lessonObject.closure)}

Accommodations / differentiation: ${mods || "(none listed)"}
New vocabulary: ${(lessonObject.new_vocabulary ?? []).join(", ") || "(none listed)"}

Return the JSON object now.`;

  return { system, user: user + toolDirective("observationSummary", subject) };
}
