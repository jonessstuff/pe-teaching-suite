/**
 * Math Specialists prompt builder.
 *
 * Like Adaptive PE, Gifted & Talented, and Reading Specialists, this module
 * serves a specialist/interventionist rather than teaching a standalone
 * subject, so it reuses the same "one AI call → structured JSON → tolerant
 * parse → save to the lessons table" shape.
 *
 * Single workflow: generate a differentiated or intervention-focused math
 * lesson for a topic and grade band, grounded in NCTM Principles to Actions +
 * Principles and Standards, using Concrete–Representational–Abstract (CRA)
 * sequencing and a Number Talk warm-up, weaving in the 5 Process Standards, and
 * framing BOTH whole-class differentiation and small-group intervention (Math
 * Specialists work in both capacities).
 *
 * National-framework-first (NCTM). State math standards vary (most align to or
 * derive from CCSS-M), so every response carries a state verification
 * disclaimer and never builds state-specific content.
 */

const GRADE_BANDS = {
  "k-2": {
    label: "K–2",
    context: "early number sense — counting, place value, addition/subtraction within 100, foundational geometry and measurement. Concrete manipulatives are central; the CRA sequence should lean heavily on hands-on materials.",
  },
  "3-5": {
    label: "3–5",
    context: "multiplication & division, fractions, multi-digit operations, area/perimeter, and early data. CRA should bridge concrete manipulatives to visual representations to standard algorithms.",
  },
  "6-8": {
    label: "6–8",
    context: "ratios & proportional reasoning, rational numbers, expressions & equations, early functions, geometry, and statistics. Representational and abstract reasoning grow, but keep concrete anchors when introducing new concepts.",
  },
  "9-12": {
    label: "9–12",
    context: "algebra, functions, geometry, statistics, and modeling. Abstract reasoning dominates, but concrete/representational anchors (algebra tiles, graphs, geometric models) still support new learning and intervention with older struggling students — keep them age-respectful.",
  },
}

function resolveBand(gradeBand) {
  return GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
}

// NCTM grounding shared into the system prompt.
const STANDARDS_STACK = `You ground every lesson in the frameworks of the National Council of Teachers of Mathematics (NCTM):
- NCTM "Principles to Actions: Ensuring Mathematical Success for All" (2014) — the current landmark framework connecting research to practice. It rests on 6 Guiding Principles (Teaching & Learning, Access & Equity, Curriculum, Tools & Technology, Assessment, Professionalism) and 8 research-based Mathematics Teaching Practices (MTPs): (1) Establish mathematics goals to focus learning; (2) Implement tasks that promote reasoning and problem solving; (3) Use and connect mathematical representations; (4) Facilitate meaningful mathematical discourse; (5) Pose purposeful questions; (6) Build procedural fluency from conceptual understanding; (7) Support productive struggle in learning mathematics; (8) Elicit and use evidence of student thinking. Framework field: "NCTM Principles to Actions".
- NCTM "Principles and Standards for School Mathematics" — the 5 Content Standards (Number & Operations, Algebra, Geometry, Measurement, Data Analysis & Probability) and the 5 Process Standards (Problem Solving, Reasoning & Proof, Communication, Connections, Representation). Framework field: "NCTM Principles & Standards".

Two instructional practices are required in every lesson:
- CONCRETE–REPRESENTATIONAL–ABSTRACT (CRA) sequencing: teach the concept first with concrete manipulatives, then with visual/pictorial representations, then with abstract symbols/notation. Show all three phases explicitly (adapt the depth of each to the grade band and topic — for advanced 9–12 topics the concrete phase may be brief, but the progression must be visible).
- NUMBER TALKS (Sherry Parrish): a short mental-math / number-sense routine where students solve a purposeful problem mentally and share strategies aloud. Include one as the warm-up, calibrated to the band and topic.

Build procedural fluency FROM conceptual understanding (MTP 6) — never lead with the algorithm. The 5 Process Standards are not optional: the lesson must build reasoning, communication, connections, and representation, not just computation.`

const DUAL_ROLE = `Math Specialists work in two capacities and the lesson must serve both: (a) whole-class DIFFERENTIATION for a co-teaching / in-class support setting, and (b) small-group INTERVENTION for a pull-out setting. Provide concrete framing for each — they are different, not interchangeable.`

const STATE_DISCLAIMER = `State mathematics standards vary — most states use their own standards, many derived from or aligned to the Common Core State Standards for Mathematics (CCSS-M), but specifics and grade placement differ. Do NOT cite or claim alignment to any one state's standards. Populate state_verification_note with a brief reminder to verify the specific grade-level standards and pacing against the specialist's own state standards.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string}  input.topic
 * @param {string}  input.gradeBand   'k-2' | '3-5' | '6-8' | '9-12'
 * @param {string}  [input.domain]    NCTM content standard, or '' to infer from topic
 * @param {string}  [input.setting]   'both' | 'intervention' | 'differentiation'
 * @param {string}  [input.focus]     specific skill/target within the topic
 * @param {number}  [input.durationMinutes]
 * @param {string}  [input.studentContext]  optional group/observation context (no names)
 * @param {string}  [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildMathSpecialistPrompt({
  topic = "",
  gradeBand = "3-5",
  domain = "",
  setting = "both",
  focus = "",
  durationMinutes = 45,
  studentContext = "",
  teacherNotes = "",
}) {
  const band = resolveBand(gradeBand)
  const settingEmphasis =
    setting === "intervention"
      ? "The specialist's PRIMARY setting is small-group pull-out intervention — lead with and expand the small_group_intervention framing, but still provide the whole-class differentiation section."
      : setting === "differentiation"
        ? "The specialist's PRIMARY setting is whole-class differentiation / co-teaching — lead with and expand the whole_class_differentiation framing, but still provide the small-group intervention section."
        : "Give balanced attention to both the whole-class differentiation and the small-group intervention framing."

  const system = `You are an experienced Math Specialist / mathematics interventionist and instructional coach writing a lesson for another math specialist. Your plans are grounded in research and immediately usable: conceptually sequenced, reasoning-rich, and specific about manipulatives, representations, and discourse — not a worksheet of procedures.

${STANDARDS_STACK}

${DUAL_ROLE}

${JSON_ONLY} Match this schema exactly:

{
  "subject": "Math Specialists",
  "title": string,
  "grade_bands": number[],
  "topic": string,
  "content_standard": string,
  "focus": string,
  "duration_minutes": number,
  "learning_objective": string,
  "teaching_practices_used": string[],
  "number_talk": string,
  "cra_sequence": { "concrete": string, "representational": string, "abstract": string },
  "process_standards": [ { "standard": string, "how_addressed": string } ],
  "whole_class_differentiation": string,
  "small_group_intervention": string,
  "common_misconceptions": string[],
  "formative_assessment": string,
  "materials": string[],
  "standards_alignment": [ { "framework": string, "text": string } ],
  "state_verification_note": string
}

Field notes:
- subject: always exactly "Math Specialists".
- title: specific and concept-flavored (e.g., "Building Fraction Equivalence with Bars, Number Lines, and Notation").
- grade_bands: a JSON array of grade numbers for this band (K = 0).
- content_standard: the primary NCTM Content Standard this lesson lives in (Number & Operations, Algebra, Geometry, Measurement, or Data Analysis & Probability).
- focus: the specific skill/target within the topic.
- learning_objective: one measurable conceptual objective (understanding, not just "students will compute…").
- teaching_practices_used: 3–5 of the 8 NCTM Mathematics Teaching Practices this lesson enacts, named exactly.
- number_talk: a specific Number Talk warm-up — the exact problem/string and the strategies you'd expect students to surface and discuss. 5–10 minutes.
- cra_sequence: concrete (named manipulatives + what students do), representational (the visual/pictorial bridge), abstract (the symbolic notation and how it's connected back to the prior phases). Each phase concrete and specific to THIS concept.
- process_standards: one entry per relevant NCTM Process Standard (aim for 3–5 of the five: Problem Solving, Reasoning & Proof, Communication, Connections, Representation), each with how_addressed describing exactly where/how the lesson builds it.
- whole_class_differentiation: framing for a co-teaching / in-class setting — tiered tasks, access for struggling students, extension for advanced, and how a specialist supports alongside the classroom teacher.
- small_group_intervention: framing for a pull-out setting — smaller scope, more concrete/representational time, error analysis, targeted questioning, and progress focus.
- common_misconceptions: 3–5 specific misconceptions or error patterns for THIS concept and how the lesson surfaces/addresses them.
- formative_assessment: how the specialist elicits and uses evidence of student thinking (MTP 8) this session — specific look-fors and what to record.
- materials: specific manipulatives, tools, and representations (e.g., "Base-ten blocks", "Fraction bars", "Double number line", "Algebra tiles", "Rekenrek").
- standards_alignment: 2–4 entries; framework exactly "NCTM Principles to Actions" or "NCTM Principles & Standards"; text = the principle/practice/standard this lesson demonstrates.
- ${STATE_DISCLAIMER}

${settingEmphasis}

LENGTH DISCIPLINE: A COMPLETE lesson (every field present, JSON closed) matters more than exhaustive detail. Keep each text field focused (a few sentences) and lists to the counts requested. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate a Math Specialist lesson with these parameters:

- Topic: ${topic || "(choose an appropriate, well-sequenced topic for this grade band)"}
- Specific focus / target: ${focus || "(choose an appropriate target within the topic)"}
- NCTM content domain: ${domain || "(infer from the topic)"}
- Grade band: ${band.label} — ${band.context}
- Primary setting: ${setting === "intervention" ? "Small-group intervention (pull-out)" : setting === "differentiation" ? "Whole-class differentiation (co-teaching)" : "Both intervention and differentiation"}
- Session duration: ${durationMinutes} minutes${studentContext ? `\n- Group / student context (no identifying info): ${studentContext}` : ""}${teacherNotes ? `\n- Specialist notes: ${teacherNotes}` : ""}

Do not use student names or personally identifying information. Return the JSON object now.`

  return { system, user }
}
