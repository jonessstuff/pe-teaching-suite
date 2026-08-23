/**
 * Standards re-pass prompt builder — Virginia 2022 PE SOL.
 *
 * Surgical: re-selects ONLY the standards for an EXISTING lesson, identifying
 * the correct 2022 Virginia PE SOL STRAND from the lesson's actual content. It
 * does not touch or rewrite any other part of the lesson.
 *
 * Virginia's current PE standards are the 2022 SOL (approved Jan 2022), whose
 * strand names differ from the retired 2015 version. We identify the strand by
 * NAME (reliable) but deliberately HEDGE the numeric code — the exact 2022
 * numbering/format must be verified against the official framework, and guessing
 * it would be worse than honest caution. So the "code" carries the 2022 strand
 * name and the "text" carries the competency plus a verify note.
 */

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @param {string} stateName  full state name (default handled by caller)
 * @returns {{ system: string, user: string }}
 */
export function buildStandardsRepassPrompt(lessonObject, stateName) {
  const grades = Array.isArray(lessonObject.grade_bands) ? lessonObject.grade_bands : [];
  const isVirginia = stateName === "Virginia";

  const framework = isVirginia
    ? "Virginia's CURRENT physical education standards — the 2022 Physical Education Standards of Learning (approved January 2022). Use the 2022 STRAND NAMES."
    : `${stateName}'s current physical education standards framework.`;

  const system = `You are aligning an EXISTING physical education lesson to ${framework} You are NOT changing or rewriting the lesson — your ONLY job is to identify the standard STRAND that matches what the lesson actually has students do.

Return ONLY a single JSON object — no markdown fences, no commentary:
{ "standards": [ { "grade": number, "code": string, "text": string } ] }

- Provide EXACTLY ONE entry per grade band listed by the user, and use the number 0 for Kindergarten.

SELECT BY CONTENT (never default to one strand): read the lesson's skill_focus and its actual activities, then choose the ${isVirginia ? "2022 Virginia PE SOL" : stateName} strand that matches the lesson's PRIMARY focus.${isVirginia ? `
- Motor skills & techniques — serving, dribbling, striking, throwing, catching, locomotor / non-locomotor patterns, sport/game skill execution → SKILLED MOVEMENT.
- Movement principles — biomechanics, anatomy/physiology of movement, tactics & strategy / game concepts, applying feedback to refine performance → MOVEMENT PRINCIPLES AND CONCEPTS.
- Health-related fitness — fitness testing (PACER, curl-ups, push-ups, mile run, FitnessGram), fitness components, fitness planning, training principles, monitoring intensity → PERSONAL FITNESS.
- Cooperation & behavior — teamwork, sportsmanship, respect, safety, communication, conflict resolution (e.g. cooperative games, team-building) → RESPONSIBLE BEHAVIORS.
- Valuing lifelong activity — pursuing physical activity beyond class, enjoyment / motivation, and the role of nutrition and energy in an active lifestyle → PHYSICALLY ACTIVE LIFESTYLE.` : ""}

CODE RULES — HEDGE, do NOT guess numbers:
- Do NOT invent a numeric SOL code. ${isVirginia ? "The exact 2022 Virginia PE SOL numbering and format must be verified against the official framework." : `Use the correct ${stateName} format only if you are certain.`}
- Set each standard's "code" to the ${isVirginia ? "2022 STRAND NAME (e.g. \"Skilled Movement\", \"Personal Fitness\")" : "strand/competency name"} — a genuinely correct strand identification, not a guessed number.
- In "text", give the competency description for that grade, then append " (verify against official ${isVirginia ? "Virginia 2022 PE SOL" : stateName + " standards"})".
- The strand you choose must match the lesson's content; different lessons get different strands when their content differs.`;

  const user = `Grade bands needing exactly one standard each: ${JSON.stringify(grades)}.

Lesson content (JSON) — align to this, do not change it:
${JSON.stringify(
    {
      title: lessonObject.title,
      subject: lessonObject.subject,
      unit: lessonObject.unit,
      grade_bands: grades,
      skill_focus: lessonObject.skill_focus,
      learning_targets: lessonObject.learning_targets,
      warm_up: lessonObject.warm_up,
      fitness_activities: lessonObject.fitness_activities,
      whole_group_instruction: lessonObject.whole_group_instruction,
      independent_practice: lessonObject.independent_practice,
      closure: lessonObject.closure,
    },
    null,
    2,
  )}

Return the standards JSON now.`;

  return { system, user };
}
