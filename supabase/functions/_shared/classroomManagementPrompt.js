/**
 * Classroom Management quick-reference card prompt builder.
 *
 * MVP slice: grades 6–8 only, "laminate-and-post" quick-reference card output.
 * Generates concise, scannable content sections for large-group specials classes
 * (25–60+ students, no homeroom rapport time). Uses Claude Haiku + structured
 * outputs (guaranteed valid JSON), matching the CTE approach.
 */

// JSON Schema for structured outputs — forces valid, schema-conforming JSON.
// Every object needs additionalProperties:false and all props in required.
export function buildClassroomCardSchema() {
  const strArr = { type: "array", items: { type: "string" } }
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "heading",
      "attention_signals",
      "entry_routine",
      "exit_routine",
      "equipment_distribution",
      "large_group_strategies",
      "behavior_expectations",
    ],
    properties: {
      heading: { type: "string" },
      attention_signals: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["signal", "meaning"],
          properties: { signal: { type: "string" }, meaning: { type: "string" } },
        },
      },
      entry_routine: strArr,
      exit_routine: strArr,
      equipment_distribution: strArr,
      large_group_strategies: strArr,
      behavior_expectations: strArr,
    },
  }
}

/**
 * @param {Object} input
 * @param {string} [input.gradeBand]   fixed to "6-8" in this MVP slice
 * @param {string} [input.classContext] optional specials subject/context (e.g. "PE / gym", "general music", "art")
 * @returns {{ system: string, user: string, schema: object }}
 */
export function buildClassroomManagementPrompt({ gradeBand = "6-8", classContext = "" } = {}) {
  const context = (classContext || "").trim()
  const contextLine = context
    ? `The teacher's class/subject context: ${context}. Tailor attention signals, routines, and equipment steps to this setting.`
    : `The class is a general middle-school "specials" class (PE, art, music, library, STEM, etc.). Keep signals and routines broadly applicable across specials settings.`

  const system = `You are an expert middle-school teacher and classroom-management coach who specializes in LARGE-GROUP specials classes — 25 to 60+ students, often with no homeroom rapport time because you see every student in the building only once or twice a week.

Produce a "laminate-and-post" QUICK-REFERENCE CARD for grades ${gradeBand}. This is a printed card the teacher posts by the door or keeps on a clipboard — so every item must be SHORT, scannable, and imperative. One line each (roughly 5–14 words). No paragraphs, no preamble, no fluff.

${contextLine}

Fill these sections:
- heading: a short card heading (e.g., "Middle School Classroom Management — Quick Reference").
- attention_signals: 3–5 concrete ways to get a large group's attention fast. Include a mix such as a whistle pattern, a call-and-response, and a countdown cue. Each entry is { signal, meaning } — signal is the cue the teacher gives (e.g., "2 short whistle blasts", "Teacher: 'Class-class' → Students: 'Yes-yes'", "Count down 5-4-3-2-1"), meaning is the instant expected response (e.g., "Freeze, voices off, eyes on me").
- entry_routine: 4–6 numbered-style steps for how students enter and start (they will be printed in order). Middle-school appropriate, works for a large group entering at once.
- exit_routine: 3–5 steps for how students pack up and exit cleanly.
- equipment_distribution: 3–5 tips/steps for handing out and collecting equipment or materials efficiently with a big group (minimize crowding and lost time).
- large_group_strategies: 4–6 specific strategies for managing 25–60+ students without prior rapport (proximity, sightlines, grouping, pacing, positive framing, quick reset).
- behavior_expectations: 3–5 core behavior expectations, positively framed and age-appropriate for middle school specials.

Keep the whole card tight enough to fit on a single printed page. Prefer specificity over completeness — a few sharp, usable items beat long lists.`

  const user = `Generate the grades ${gradeBand} classroom-management quick-reference card now${context ? ` for this class context: ${context}` : ""}. Return the JSON object only.`

  const schema = buildClassroomCardSchema()

  return { system, user, schema }
}
