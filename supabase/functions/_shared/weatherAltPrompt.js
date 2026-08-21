/**
 * Weather alternative generation prompt builder.
 *
 * Takes an existing LessonObject and produces an indoor-alternative
 * version of the lesson flow fields. All learning targets, standards,
 * success criteria, skill focus, and vocabulary are kept identical —
 * only the activities and space requirements are adapted for an indoor
 * gym or classroom setting.
 */

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
export function buildWeatherAltPrompt(lessonObject) {
  const system = `You are an experienced ${lessonObject.subject ?? "PE"} teacher adapting an existing lesson for indoor use when outdoor space is unavailable.

You must return ONLY a single JSON object — no markdown fences, no commentary — matching this exact schema:

{
  "weather_alt_warm_up": string,
  "weather_alt_fitness_activities": string,
  "weather_alt_whole_group_instruction": string,
  "weather_alt_independent_practice": string,
  "weather_alt_closure": string,
  "weather_alt_location": string,
  "weather_alt_equipment_needed": string[],
  "weather_alt_setup_diagram": string,
  "weather_alt_notes": string
}

Guidance for each field:
- weather_alt_warm_up: Rewrite the warm-up for an indoor gym or classroom. Keep the same energy and duration. Use the same formatting conventions as the original (clear phase headers, line breaks between steps).
- weather_alt_fitness_activities: Rewrite fitness activities for indoor space. Adapt any outdoor drills to hallways, gym floor, or classroom aisles as appropriate.
- weather_alt_whole_group_instruction: Keep the same skill instruction content but adapt any references to outdoor space, field markings, or outdoor cues. If the instruction is already space-agnostic, keep it nearly identical but note the indoor context.
- weather_alt_independent_practice: Fully rewrite for indoor stations or activities. Keep the same skill focus — just change the space, equipment, and movement patterns to suit an indoor setting.
- weather_alt_closure: Adapt the cool-down/closure for indoor use. Keep the same reflection questions or assessment moment if present.
- weather_alt_location: The specific indoor location (e.g. "Gymnasium", "Classroom", "Gymnasium — half court").
- weather_alt_equipment_needed: List indoor-appropriate equipment only. Replace outdoor-specific items (e.g. large field cones, bases) with indoor equivalents (poly spots, smaller cones). Keep quantities appropriate for the class size.
- weather_alt_setup_diagram: A simple text/ASCII diagram of the indoor space layout.
- weather_alt_notes: Any brief notes for the teacher about key differences from the outdoor version, or any skills/activities that require modification beyond what's described above. If the lesson translated cleanly, this can be a single sentence confirming that.

Critical rules:
- Do NOT change learning targets, standards, success criteria, skill focus, vocabulary, or modifications. Those belong to the original lesson and are not repeated in this output.
- The skill being taught must remain identical — only the setting and equipment adapt.
- Format the five instruction fields (warm_up, fitness_activities, whole_group_instruction, independent_practice, closure) with the same structure as the original: use \\n\\n between major sections, each with a descriptive header for the INTERNAL phase only (e.g. "Setup (2 min):", "Debrief (2 min):") — do NOT open a field with a header that restates the field's own name, e.g. don't begin warm_up with "WARM-UP" or closure with "CLOSURE"; the app already labels each field — and \\n between individual steps.
- Do not include any fields not listed in the schema above.`;

  const user = `Here is the lesson to adapt for indoor use (as JSON):

${JSON.stringify(
    {
      title: lessonObject.title,
      unit: lessonObject.unit,
      subject: lessonObject.subject,
      grade_bands: lessonObject.grade_bands,
      duration_minutes: lessonObject.duration_minutes,
      class_size: lessonObject.class_size,
      skill_focus: lessonObject.skill_focus,
      location: lessonObject.location,
      equipment_needed: lessonObject.equipment_needed,
      equipment_alternatives: lessonObject.equipment_alternatives,
      setup_diagram: lessonObject.setup_diagram,
      warm_up: lessonObject.warm_up,
      fitness_activities: lessonObject.fitness_activities,
      whole_group_instruction: lessonObject.whole_group_instruction,
      independent_practice: lessonObject.independent_practice,
      closure: lessonObject.closure,
      learning_targets: lessonObject.learning_targets,
      success_criteria: lessonObject.success_criteria,
      known_vocabulary: lessonObject.known_vocabulary,
      new_vocabulary: lessonObject.new_vocabulary,
    },
    null,
    2
  )}

Rewrite the five lesson flow fields and equipment for an indoor setting. Return the JSON object now.`;

  return { system, user };
}
