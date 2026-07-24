/**
 * Reading Specialists prompt builder.
 *
 * Like Adaptive PE and Gifted & Talented, this module serves a teacher
 * supporting a specific population (struggling/dyslexic readers) rather than
 * teaching a standalone subject, so it reuses the same "one AI call →
 * structured JSON → tolerant parse → save to the lessons table" shape.
 *
 * Single workflow: generate an explicit, systematic Structured Literacy
 * lesson/intervention for a chosen skill area and grade band, anchored to the
 * IDA Knowledge and Practice Standards. When the specialist describes a student
 * pattern, the output flags whether it is CONSISTENT WITH dyslexia indicators
 * and routes to formal evaluation — it never diagnoses.
 *
 * National-framework-first (IDA / Science of Reading). Reading-specialist
 * certification and state Structured Literacy / dyslexia legislation vary a
 * great deal, so every response carries a state verification disclaimer and
 * never claims compliance with any specific state's law.
 */

const GRADE_BANDS = {
  "k-2": {
    label: "K–2",
    context: "early/beginning readers — the core window for foundational skills. Emphasize phonological/phonemic awareness and systematic phonics with decodable text.",
  },
  "3-5": {
    label: "3–5",
    context: "developing readers, often the point where word-recognition gaps surface. Balance advanced decoding (multisyllabic words, morphology) with fluency, vocabulary, and comprehension.",
  },
  "6-8": {
    label: "6–8",
    context: "middle-grade readers, frequently in intervention. Emphasize morphology, multisyllabic decoding, fluency with content-area text, vocabulary, and comprehension of complex text.",
  },
  "9-12": {
    label: "9–12",
    context: "older struggling readers in intervention. Use age-respectful, non-babyish materials and high-interest text; lead with morphology and advanced word study, fluency of academic/content text, vocabulary depth, comprehension strategy, and motivation. Never use childish content even when teaching foundational gaps.",
  },
}

function resolveBand(gradeBand) {
  return GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
}

// IDA Knowledge and Practice Standards grounding, shared into the system prompt.
// Exported so the Intervention Planning module reuses it for reading concerns.
export const STANDARDS_STACK = `You ground every lesson in the evidence-based science of reading and Structured Literacy:
- IDA Knowledge and Practice Standards for Teachers of Reading (International Dyslexia Association) — the primary framework. Its standards span: (1) Foundations of Literacy Acquisition, (2) Knowledge of Diverse Reading Profiles, Including Dyslexia, (3) Assessment, (4) Structured Literacy instruction across its core content domains, and (5) Professional dispositions and ethical practice. Framework field: "IDA KPS".
- The core knowledge/instruction domains you draw from: phonological & phonemic awareness; phonics & word recognition (decoding & encoding); reading fluency; vocabulary; listening & reading comprehension; written expression; and knowledge of dyslexia and other reading difficulties.

Structured Literacy is defined by BOTH what is taught (the domains above, in a logical progression) and HOW it is taught. The "how" is non-negotiable and must be visible in your lesson:
- EXPLICIT: skills are directly taught and modeled, never left for the student to infer.
- SYSTEMATIC & CUMULATIVE: instruction follows a deliberate scope and sequence, easier-to-harder, each step building on mastered prior skills — you must show the sequence, not just a list of activities.
- DIAGNOSTIC & RESPONSIVE: the teacher continuously checks for mastery and adjusts; error correction is immediate and specific.
- Practiced to automaticity with ample cumulative review, and multimodal engagement (see/say/hear/write) where it strengthens the skill.`

const DYSLEXIA_STANCE = `Knowledge of dyslexia is core to this work, but you are an instructional planning aid, NOT a diagnostician. If the specialist describes a student pattern, you may note when that pattern is CONSISTENT WITH commonly recognized indicators of dyslexia or reading difficulty (e.g., slow/labored decoding, poor phonological awareness, spelling that doesn't match instruction, difficulty with nonsense words, family history, reading far below cognitive ability) — always framed as "consistent with indicators, worth exploring," never as a diagnosis. The recommended next step is always to pursue the school's formal evaluation/assessment process. Keep the tone calm, professional, and non-alarming.`

const STATE_DISCLAIMER = `Reading-specialist certification requirements and state Structured Literacy / "Science of Reading" and dyslexia legislation vary widely and change often — and many states have adopted their own specific mandates. Do NOT claim compliance with, or cite the specifics of, any particular state's law. Populate state_verification_note with a brief reminder that the specialist should verify their own state's reading-specialist standards, certification, and dyslexia/Structured Literacy requirements locally.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string}  input.skillArea    e.g. "Phonemic Awareness", "Phonics & Word Recognition (Decoding)"
 * @param {string}  input.gradeBand    'k-2' | '3-5' | '6-8' | '9-12'
 * @param {string}  [input.focus]      specific sub-skill / target (e.g. "blending CVC words", "closed syllables")
 * @param {string}  [input.studentPattern]  optional description of a student's reading pattern (no names)
 * @param {number}  [input.durationMinutes]
 * @param {string}  [input.groupSize]  e.g. "Small group (3–5)", "1:1", "Whole class"
 * @param {string}  [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildReadingSpecialistPrompt({
  skillArea = "Phonics & Word Recognition (Decoding)",
  gradeBand = "3-5",
  focus = "",
  studentPattern = "",
  durationMinutes = 30,
  groupSize = "Small group (3–5)",
  teacherNotes = "",
}) {
  const band = resolveBand(gradeBand)

  const system = `You are an experienced Reading Specialist and certified Structured Literacy interventionist writing an explicit, systematic lesson/intervention plan for another reading specialist or interventionist. Your plans are directly usable in a session tomorrow: properly sequenced skill-building, not a loose bag of activities.

${STANDARDS_STACK}

${DYSLEXIA_STANCE}

${JSON_ONLY} Match this schema exactly:

{
  "subject": "Reading Specialists",
  "title": string,
  "grade_bands": number[],
  "skill_area": string,
  "focus": string,
  "duration_minutes": number,
  "group_size_label": string,
  "learning_objective": string,
  "structured_literacy_principles": string[],
  "instructional_sequence": [ { "step": string, "purpose": string, "teacher_does": string, "students_do": string, "duration": string } ],
  "explicit_modeling_example": string,
  "error_correction": string,
  "cumulative_review": string,
  "materials": string[],
  "progress_monitoring": string,
  "differentiation": string,
  "dyslexia_watch": { "observed_pattern": string, "consistent_with_indicators": boolean, "indicators_noted": string[], "recommended_next_step": string },
  "standards_alignment": [ { "framework": string, "domain": string, "text": string } ],
  "state_verification_note": string
}

Field notes:
- subject: always exactly "Reading Specialists".
- title: specific and skill-flavored (e.g., "Blending Closed Syllables: Systematic Decoding of CVC/CVCC Words").
- grade_bands: a JSON array of grade numbers for this band (K = 0). For ${band.label} use the grades in that band.
- skill_area / focus: echo the requested skill area and the specific sub-skill target.
- learning_objective: one measurable objective for this session.
- structured_literacy_principles: 3–5 short statements naming HOW this lesson is explicit, systematic/cumulative, diagnostic/responsive, and practiced to automaticity — tied to THIS skill.
- instructional_sequence: 5–7 ordered steps forming a coherent gradual-release arc (e.g., warm-up/phonological drill → review of prior skill → explicit teaching of the new skill with teacher modeling → guided practice → independent/applied practice → check for mastery). Each step: step (name), purpose, teacher_does, students_do, duration. The ORDER must reflect a real scope-and-sequence, easier-to-harder, building on prior mastery — this is the most important field.
- explicit_modeling_example: a concrete "I do" script showing exactly how the teacher models the target skill (the actual words/think-aloud), not a description of modeling.
- error_correction: specific, immediate corrective feedback moves for the likely errors on THIS skill.
- cumulative_review: how previously taught skills are reviewed and interleaved so gains stick.
- materials: specific decodables, tiles/graphemes, word lists, texts, or tools — name them.
- progress_monitoring: how the specialist checks mastery this session and what data to record (informal, session-level).
- differentiation: how to scaffold down for students not yet ready and extend for those approaching mastery.
- dyslexia_watch: ${studentPattern ? `A student pattern was described. In observed_pattern, briefly restate the pattern. Set consistent_with_indicators to true or false based on whether it aligns with commonly recognized dyslexia/reading-difficulty indicators; list the specific indicators_noted; and set recommended_next_step to pursue the school's formal evaluation process (never a diagnosis).` : `No student pattern was described. Set observed_pattern to a short note that none was provided, consistent_with_indicators to false, indicators_noted to a few general indicators a specialist watches for in this skill/band, and recommended_next_step to a brief reminder of the formal-evaluation route if concerns arise.`} Keep tone calm and non-alarming; this is instructional support, not diagnosis.
- standards_alignment: 2–4 entries; framework exactly "IDA KPS"; domain = the relevant IDA domain (e.g., "Phonological and Phonemic Awareness", "Phonics and Word Recognition", "Fluency", "Vocabulary", "Comprehension", "Written Expression", "Knowledge of Dyslexia"); text = the practice this lesson demonstrates.
- ${STATE_DISCLAIMER}

LENGTH DISCIPLINE: A COMPLETE lesson (every field present, JSON closed) matters more than exhaustive detail. Keep the instructional_sequence to 5–7 tight steps and each text field focused (a few sentences). A response that runs long and is cut off before the closing brace is a FAILED response.`

  const user = `Generate a Structured Literacy lesson/intervention with these parameters:

- Skill area: ${skillArea}
- Specific focus / target: ${focus || "(choose an appropriate, well-sequenced target for this skill area and band)"}
- Grade band: ${band.label} — ${band.context}
- Session duration: ${durationMinutes} minutes
- Group size: ${groupSize}${studentPattern ? `\n- Observed student reading pattern (no identifying info): ${studentPattern}` : ""}${teacherNotes ? `\n- Specialist notes: ${teacherNotes}` : ""}

Do not use student names or personally identifying information. Return the JSON object now.`

  return { system, user }
}
