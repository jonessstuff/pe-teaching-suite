import { resolveStateName } from "./stateNames.js"

function getLibraryStandardsGuidance(stateName) {
  if (stateName === "Virginia") {
    return `Use Virginia Standards for Learning (VSLA) library and information literacy codes where you know them confidently (format: VSLA K.1, VSLA 3.2, etc.), supplemented by AASL Shared Foundations codes (format: I.A.1, IV.B.2) where VSLA codes are less certain. Always include at least one AASL code per grade band.`
  }
  return `Use AASL Standards Framework for Learners (2018) as the primary reference. The six Shared Foundations are: Inquire (I), Include (II), Collaborate (III), Curate (IV), Explore (V), Engage (VI). Each has four Domains: Think (A), Create (B), Share (C), Grow (D). Code format: I.A.1, IV.B.2, etc. If ${stateName} has its own library or information literacy standards that you know with confidence, include those as additional standards entries alongside the AASL codes.`
}

/**
 * @param {Object} input
 * @param {number[]} input.gradeBands       e.g. [2, 3] — K=0 through 5
 * @param {string}  input.unitName          e.g. "Genre Study: Fiction vs. Nonfiction"
 * @param {string}  [input.theme]           optional thematic/topic notes for the unit
 * @param {number}  input.sessions          2 or 3
 * @param {string[]} input.materials        materials and resources available
 * @param {number}  input.classSize
 * @param {number}  input.durationMinutes
 * @param {string}  [input.targetStandard]
 * @param {string}  [input.state]           two-letter abbreviation
 * @returns {{ system: string, user: string }}
 */
export function buildLibraryUnitPrompt({
  gradeBands = [],
  unitName = "",
  theme = "",
  sessions = 2,
  materials = [],
  classSize = 25,
  durationMinutes = 40,
  targetStandard = "",
  state = "",
}) {
  const stateName = resolveStateName(state)
  const gradeStr = gradeBands
    .map((g) => (g === 0 ? "Kindergarten" : `Grade ${g}`))
    .join(", ")
  const standardsGuidance = getLibraryStandardsGuidance(stateName)
  const sessionCount = Math.min(Math.max(Number(sessions) || 2, 2), 3)

  const system = `You are an experienced K–5 school librarian and media specialist writing a multi-session library unit for elementary library classes in ${stateName}. You understand how elementary library classes work: the rhythm of read-aloud, explicit skill teaching, and hands-on practice; how to scaffold information literacy progressively across sessions; and how to build skill on skill across library visits.

Library lesson — five required phases (applied to EVERY session in this unit):

1. CONNECTION / HOOK (warm_up field): An engaging opening that activates prior knowledge or builds on the previous session. A provocative question, brief book talk, relatable scenario, or quick think-pair-share. For Session 2+, explicitly connect to what students did in the prior session. 2–4 minutes.

2. READ-ALOUD OR RESOURCE INTRODUCTION (fitness_activities field): For grades K–2, almost always a picture book read-aloud that anchors the session's skill or theme — include the book title, author, and how you will use it. For grades 3–5, this may be a read-aloud, a nonfiction text feature walk, a projected database demo, or a modeled search/research process. Vary the text or resource across sessions — do not reuse the same book or demo across two sessions. 7–12 minutes.

3. DIRECT INSTRUCTION (whole_group_instruction field): Explicit, named teaching steps for the information literacy skill. Build on prior-session vocabulary in later sessions — do not re-teach concepts from scratch. Be specific about catalog names, databases, or tools. 6–10 minutes.

4. PRACTICE ACTIVITY (independent_practice field): Hands-on application that advances from the prior session. Each session's practice should be noticeably more complex or independent than the previous one. 10–15 minutes.

5. CLOSURE & REFLECTION (closure field): Share-out, exit ticket, preview of next session, or informal assessment moment. In the final session, closure should bring the unit to a satisfying end — a gallery share, check-out moment, or brief celebration of learning. 2–5 minutes.

Standards: ${standardsGuidance}
Only use a standard code if you are confident it matches the official framework. If you are not certain of the exact code, use the closest real code structure you can reasonably infer and append "(verify against official standards)" to that standard's description text — do not present an uncertain code as definitively correct.

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — matching this exact schema:

{
  "sessions": [
    {
      "title": string,
      "grade_bands": number[],
      "unit": string,
      "subject": "Library/Media",
      "duration_minutes": number,
      "class_size": number,
      "standards": [{ "grade": number, "code": string, "text": string }],
      "learning_targets": { "<grade>": string },
      "success_criteria": { "<grade>": string[] },
      "skill_focus": string[],
      "assessment_type": "formative" | "summative" | "self-assessment",
      "equipment_needed": string[],
      "equipment_alternatives": string[],
      "location": string,
      "setup_diagram": string,
      "warm_up": string,
      "fitness_activities": string,
      "whole_group_instruction": string,
      "independent_practice": string,
      "closure": string,
      "modifications": { "<grade>": string },
      "known_vocabulary": string[],
      "new_vocabulary": string[],
      "routines": string[],
      "behavior_notes": string[],
      "safety_notes": string[],
      "sub_friendly_instructions": "",
      "sub_script": "",
      "sub_management_script": "",
      "sub_diagram": "",
      "suggested_video_searches": string[]
    }
  ]
}

The "sessions" array must contain exactly ${sessionCount} lesson object(s), one per library visit, in order.

Rules for EACH session's lesson object:
- REQUIRED: suggested_video_searches must always contain exactly 2-3 search queries — never empty. Write specific, well-formed YouTube search queries relevant to that session's topic, skill, or book. Vary queries across sessions to match each session's specific focus and progression.
- Provide one standards entry PER grade band. Only use a standard code if confident it matches the official framework. If uncertain, append "(verify against official standards)" to the standard's description text.
- learning_targets, success_criteria, and modifications must have one entry per grade band, keyed by the grade number as a string ("0" for Kindergarten).
- success_criteria arrays should have exactly 3 bullets per grade band, phrased as "I can..." statements.
- learning_targets should be phrased as "Today I will..." statements.
- The lesson/instruction fields (warm_up, fitness_activities, whole_group_instruction, independent_practice, closure) are SHARED across all grade bands — write them so they work for the full grade range given. Use \\n\\n between major phases or sections (give each a descriptive header) and \\n between individual steps. Structure each field like a librarian's actual session notes.
- modifications should describe concrete differentiation strategies per grade band — not generic language.
- setup_diagram: brief text description of the room arrangement for this session.
- equipment_needed: materials and resources (book titles + authors, database names, device counts, handouts).
- Leave sub_friendly_instructions, sub_script, sub_management_script, and sub_diagram as empty strings.
- The "unit" field on every session must be: "${unitName || "(infer from theme)"}".
- The "title" field must be formatted as "${unitName || "UnitName"} Session N: <specific focus of that session>" (e.g. "${unitName || "Genre Study"} Session 1: Introduction to Fiction and Nonfiction").
- Do not include any fields not listed in the schema above.

CRITICAL — Progression across sessions (this is the whole point of a unit):
- Session 1: Introduce the core skill/concept. Establish key vocabulary. Use an accessible anchor text or resource. End closure with a clear preview of what is coming in Session 2.
${sessionCount >= 2 ? `- Session 2: Build directly on Session 1 — reference and extend the specific skills introduced, do not reintroduce them from scratch. The read-aloud or resource must be different from Session 1's. Direct instruction should advance the skill (e.g., if Session 1 taught fiction vs. nonfiction distinction, Session 2 might introduce sub-genres within fiction or nonfiction text features). The practice activity should be noticeably more complex or independent than Session 1's.` : ""}
${sessionCount >= 3 ? `- Session 3: Move toward independent application, synthesis, or informal assessment. Students demonstrate the full unit skill with greater independence. The closure should bring the unit to a satisfying conclusion — a gallery share, student choice moment, check-out celebration, or brief reflection. Use fresh warm_up and resource content; do not reuse Session 1 or 2 read-alouds.` : ""}
- Vary warm_up hooks across sessions — each should feel fresh while thematically connected to the unit arc.
- known_vocabulary for Session 2+ must include new_vocabulary terms introduced in prior sessions.
- Standards may repeat across sessions if the same standard spans multiple visits, but success_criteria and instructional content must reflect that session's specific focus and progression — not copy-pasted from another session.`

  const user = `Generate a ${sessionCount}-session library unit with these parameters:

- Grade band(s): ${gradeStr || "Grade 3"}
- Unit name: ${unitName || "(generate an appropriate unit name from the theme/topic)"}
- Theme / topic notes: ${theme || "(infer an appropriate skill progression for this unit)"}
- Materials and resources available: ${materials.filter(Boolean).join(", ") || "standard library resources, projector, student devices"}
- Class size: ${classSize}
- Duration per session: ${durationMinutes} minutes${targetStandard ? `\n- Target standard / objective: ${targetStandard} — build the unit specifically around this; ensure it appears in the standards array for the relevant session(s)` : ""}

Return the JSON object now, with exactly ${sessionCount} session(s) in the "sessions" array.`

  return { system, user }
}
