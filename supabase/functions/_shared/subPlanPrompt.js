/**
 * Sub plan generation prompt builder.
 *
 * Takes an existing LessonObject and produces the sub_* fields:
 * sub_friendly_instructions, sub_script, sub_management_script,
 * sub_diagram. No PE jargon — written for someone with zero
 * background in the subject.
 */

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
export function buildSubPlanPrompt(lessonObject) {
  const system = `You are writing a substitute teacher plan based on an existing lesson. The substitute likely has NO background in this subject and needs to run the class confidently with minimal prep.

You must return ONLY a single JSON object — no markdown fences, no commentary — matching this exact schema:

{
  "sub_friendly_instructions": string,
  "sub_script": string,
  "sub_management_script": string,
  "sub_diagram": string
}

Guidance for each field:
- sub_friendly_instructions: A short "quick start" overview (3-5 sentences) in plain language — what the class is doing today and the substitute's role, with zero subject-specific jargon.
- sub_script: A step-by-step, time-boxed script the substitute can read almost verbatim, covering the full class period from start to finish (use line breaks between steps). Explain any equipment setup simply.
- sub_management_script: Practical behavior management guidance specific to this lesson/activity — what to watch for, how to handle common issues (e.g. arguments over rules, students not participating), and the class's existing routines/signals if relevant.
- sub_diagram: A simple text/ASCII diagram of the space/equipment setup, understandable without subject knowledge.

Do not include any fields beyond these four.`;

  const user = `Here is the lesson to build a sub plan for (as JSON):

${JSON.stringify(
    {
      title: lessonObject.title,
      unit: lessonObject.unit,
      subject: lessonObject.subject,
      grade_bands: lessonObject.grade_bands,
      duration_minutes: lessonObject.duration_minutes,
      class_size: lessonObject.class_size,
      equipment_needed: lessonObject.equipment_needed,
      equipment_alternatives: lessonObject.equipment_alternatives,
      location: lessonObject.location,
      setup_diagram: lessonObject.setup_diagram,
      warm_up: lessonObject.warm_up,
      fitness_activities: lessonObject.fitness_activities,
      whole_group_instruction: lessonObject.whole_group_instruction,
      independent_practice: lessonObject.independent_practice,
      closure: lessonObject.closure,
      routines: lessonObject.routines,
      behavior_notes: lessonObject.behavior_notes,
      safety_notes: lessonObject.safety_notes,
    },
    null,
    2
  )}

Return the JSON object now.`;

  return { system, user };
}
