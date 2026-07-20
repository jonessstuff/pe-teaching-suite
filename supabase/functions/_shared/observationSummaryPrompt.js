/**
 * Observation/Evaluation prep prompt builder.
 *
 * Takes an existing LessonObject and produces a concise one-page summary
 * formatted for a principal or evaluator doing a walkthrough. Standards are
 * passed through verbatim from the lesson — the model synthesizes only the
 * overview, differentiation highlights, and observable indicators.
 */

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
export function buildObservationSummaryPrompt(lessonObject) {
  const subject = lessonObject.subject ?? "PE"
  const grades = (lessonObject.grade_bands ?? [])
    .map((g) => (g === 0 ? "K" : String(g)))
    .join("/")

  const system = `You are an experienced ${subject} department head helping a teacher prepare a one-page observation summary for a principal or evaluator doing a walkthrough.

Your output must be professional, concise, and evaluator-friendly — written for someone with limited subject-matter expertise who needs to quickly understand what is happening in the classroom and what to look for.

You must return ONLY a single JSON object — no markdown fences, no commentary — matching this exact schema:

{
  "obs_overview": string,
  "obs_differentiation": string[],
  "obs_look_for": string[]
}

Field guidance:

obs_overview:
  2-3 sentences synthesizing the full lesson arc (warm-up through closure) into a coherent picture of what is happening today and why. Write in present tense as if the evaluator is walking in mid-lesson. Name the skill or concept being taught. Do not list every activity — synthesize. Example: "Students are in the skill-building phase of a volleyball unit, working on the underhand serve using the BEEF cue. The teacher is rotating between groups providing targeted corrective feedback, while students practice in structured peer pairs."

obs_differentiation:
  Array of exactly 2-3 strings. Each string is a specific, concrete example of how this lesson supports diverse learners, rewritten from the lesson's modifications/accommodations in evaluator-friendly language. Do NOT copy the modifications field verbatim — translate them into what an observer would actually see or hear. Each item should begin with an action phrase. Examples: "Lower net height available for students developing serve mechanics.", "Visual cue cards posted at each station showing the BEEF acronym for students who benefit from visual supports.", "Students with IEP accommodations are grouped with a peer buddy during independent practice."

obs_look_for:
  Array of exactly 2-3 strings. Each string is a specific, observable indicator the evaluator might notice that signals the lesson is going well. These should be concrete and classroom-specific — not generic teaching quality indicators. Reference actual skills, cues, vocabulary, or student behaviors from this lesson. Examples: "Students using the BEEF acronym unprompted during peer feedback.", "Teacher addressing students by name when delivering corrective feedback on contact point.", "At least 70% of students achieving successful serves over the net during independent practice."

Critical rules:
- obs_overview must be 2-3 sentences maximum. Do not exceed this.
- obs_differentiation must have exactly 2-3 items (strings, not objects).
- obs_look_for must have exactly 2-3 items (strings, not objects).
- Do not mention standards in any field — those are displayed separately from the lesson data.
- Use active, present-tense, observable language throughout.
- Do not include any fields not listed in the schema above.`

  const modificationsText = Object.entries(lessonObject.modifications ?? {})
    .map(([grade, text]) => `Grade ${grade === "0" ? "K" : grade}: ${text}`)
    .join("\n")

  const learningTargetsText = Object.entries(lessonObject.learning_targets ?? {})
    .map(([grade, text]) => `Grade ${grade === "0" ? "K" : grade}: ${text}`)
    .join("\n")

  const user = `Here is the lesson to summarize for an evaluator walkthrough (Grade ${grades || "K–12"}, ${subject}):

Title: ${lessonObject.title ?? ""}
Unit: ${lessonObject.unit ?? ""}
Duration: ${lessonObject.duration_minutes ?? 45} minutes
Class size: ${lessonObject.class_size ?? ""}
Location: ${lessonObject.location ?? ""}
Skill focus: ${(lessonObject.skill_focus ?? []).join(", ")}

LESSON FLOW:
Warm-up: ${lessonObject.warm_up ?? ""}

Fitness activities: ${lessonObject.fitness_activities ?? ""}

Whole group instruction: ${lessonObject.whole_group_instruction ?? ""}

Independent practice: ${lessonObject.independent_practice ?? ""}

Closure: ${lessonObject.closure ?? ""}

LEARNING TARGETS:
${learningTargetsText || "(none listed)"}

MODIFICATIONS / ACCOMMODATIONS:
${modificationsText || "(none listed)"}

VOCABULARY (new): ${(lessonObject.new_vocabulary ?? []).join(", ") || "(none listed)"}

Return the JSON object now.`

  return { system, user }
}
