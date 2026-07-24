/**
 * ESL/ELL Specialist prompt builder.
 *
 * A language-development module for DEDICATED ESL/ELL teachers — distinct from
 * the app's general "ELL toggle" (which only adds an accommodation lens inside
 * other modules for classroom teachers). Here, language development IS the
 * curriculum.
 *
 * Distinctive axis: WIDA PROFICIENCY LEVEL (Entering→Reaching) is the primary
 * differentiator, independent of grade band — a 6th grader at Entering needs
 * very different scaffolding than a 6th grader at Bridging on the same topic.
 *
 * Frameworks: WIDA English Language Development (ELD) Standards Framework, 2020
 * Edition (primary; 4 domains L/S/R/W, 6 proficiency levels, Key Language Uses),
 * ELPA21 as the alternate for non-WIDA states (verify-your-state), and the SIOP
 * Model (content + language objectives stated separately; integrated content-
 * and-language instruction).
 */

const GRADE_BANDS = {
  "k-2": "K–2",
  "3-5": "3–5",
  "6-8": "6–8",
  "9-12": "9–12",
}

// WIDA's 6 proficiency levels with scaffolding descriptors so the model
// calibrates supports, expected output, and sentence-frame complexity to the
// level (NOT the grade band).
const LEVELS = {
  entering: { n: 1, label: "Entering", desc: "Level 1 — pictorial/graphic support, single words, set phrases, and chunks of memorized language; gestures and native-language support; selected/yes-no/one-word responses. Maximum scaffolding." },
  emerging: { n: 2, label: "Emerging", desc: "Level 2 — phrases and short sentences; heavy visual and sentence-frame support; general content vocabulary; students produce short spoken/written phrases." },
  developing: { n: 3, label: "Developing", desc: "Level 3 — expanded sentences and connected ideas with support; specific content vocabulary; sentence frames still helpful; emerging paragraph-level output with scaffolds." },
  expanding: { n: 4, label: "Expanding", desc: "Level 4 — a variety of sentence lengths and complexity; technical vocabulary; reduced (targeted) scaffolding; students produce oral and written discourse with some errors that don't impede meaning." },
  bridging: { n: 5, label: "Bridging", desc: "Level 5 — near grade-level complexity; technical and abstract language; minimal scaffolding; students approach the linguistic complexity of their English-proficient peers." },
  reaching: { n: 6, label: "Reaching", desc: "Level 6 — language comparable to English-proficient peers at grade level; scaffolds are enrichment, not access." },
}

function resolveLevel(level) {
  return LEVELS[level] ?? LEVELS.developing
}

const STANDARDS_STACK = `Ground the lesson in the frameworks of the field:
- WIDA English Language Development (ELD) Standards Framework, 2020 Edition — the primary framework (most states are WIDA Consortium members). It is organized around the 4 language domains (Listening, Speaking, Reading, Writing), 6 proficiency levels (Entering, Emerging, Developing, Expanding, Bridging, Reaching), the 5 ELD Standards (Standard 1 Social & Instructional Language; Standards 2–5 Language for Language Arts / Mathematics / Science / Social Studies), and the four Key Language Uses (Narrate, Inform, Explain, Argue). Framework field: "WIDA ELD".
- SIOP Model (Sheltered Instruction Observation Protocol) — the leading model for integrating CONTENT and LANGUAGE instruction. Its hallmark, required here: state a CONTENT objective AND a separate LANGUAGE objective for the lesson, and build the lesson through SIOP components (building background, comprehensible input, strategies, interaction, practice & application, review & assessment).

The lesson MUST develop all FOUR language domains — Listening, Speaking, Reading, AND Writing — not just reading/vocabulary (a common gap in generic ELL support).`

const STATE_NOTE = `WIDA is the dominant framework, but some states belong to the ELPA21 consortium or use their own state ELP standards instead. Do NOT claim compliance with any one state's requirements. Populate state_verification_note with a brief reminder that the teacher should verify against their own state's English language proficiency standards — WIDA for consortium states, or ELPA21 / a state-specific framework otherwise.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

/**
 * @param {Object} input
 * @param {string}  input.topic            content topic
 * @param {string}  input.gradeBand        'k-2' | '3-5' | '6-8' | '9-12'
 * @param {string}  input.proficiencyLevel 'entering'|'emerging'|'developing'|'expanding'|'bridging'|'reaching'
 * @param {string}  [input.contentArea]    Science / Math / ELA / Social Studies / …
 * @param {number}  [input.durationMinutes]
 * @param {string}  [input.homeLanguages]  optional — students' home language(s), enables targeted cognate connections
 * @param {string}  [input.teacherNotes]
 * @returns {{ system: string, user: string }}
 */
export function buildEslSpecialistPrompt({
  topic = "",
  gradeBand = "3-5",
  proficiencyLevel = "developing",
  contentArea = "",
  durationMinutes = 45,
  homeLanguages = "",
  teacherNotes = "",
}) {
  const band = GRADE_BANDS[gradeBand] ?? GRADE_BANDS["3-5"]
  const lvl = resolveLevel(proficiencyLevel)

  const system = `You are an experienced, dedicated ESL/ELL specialist for whom LANGUAGE DEVELOPMENT is the curriculum — not a bolt-on accommodation. You write standards-based English language development lessons that teach content and language together and are precisely scaffolded to a student's WIDA proficiency level.

${STANDARDS_STACK}

PROFICIENCY-LEVEL CALIBRATION (the primary differentiator — matters MORE than grade band): This lesson targets WIDA ${lvl.label} (${lvl.desc}). Calibrate the language objective, sentence frames, expected student output, vocabulary load, and amount of scaffolding to THIS level. The content topic can stay constant across levels, but the language demand and supports must match ${lvl.label}.

${JSON_ONLY} Match this schema exactly:

{
  "subject": "ESL/ELL Specialist",
  "title": string,
  "grade_bands": number[],
  "proficiency_level": string,
  "proficiency_level_number": number,
  "content_area": string,
  "topic": string,
  "duration_minutes": number,
  "content_objective": string,
  "language_objective": string,
  "key_language_use": string,
  "key_vocabulary": [ { "term": string, "student_friendly_definition": string, "cognate_note": string } ],
  "language_domains": { "listening": string, "speaking": string, "reading": string, "writing": string },
  "sentence_frames": string[],
  "scaffolds_and_visual_supports": string[],
  "lesson_flow": [ { "phase": string, "what_happens": string } ],
  "formative_assessment": string,
  "level_up_down_note": string,
  "standards_alignment": [ { "framework": string, "domain": string, "text": string } ],
  "state_verification_note": string
}

Field notes:
- subject: always exactly "ESL/ELL Specialist".
- grade_bands: JSON array of grade numbers for the band (K = 0).
- proficiency_level: "${lvl.label}". proficiency_level_number: ${lvl.n}.
- content_objective: a SIOP-style CONTENT objective (what students will know/do with the content) — measurable, "Students will…".
- language_objective: a SEPARATE SIOP-style LANGUAGE objective (the language function + form students will use, in which domain) — e.g., "Students will orally compare two organisms using comparative sentence frames (more ___ than / less ___ than)." This must be genuinely about LANGUAGE, distinct from the content objective, and pitched to ${lvl.label}.
- key_language_use: which WIDA Key Language Use anchors the lesson (Narrate, Inform, Explain, or Argue) and why it fits.
- key_vocabulary: 4–6 pre-taught terms with a student-friendly definition each; cognate_note = a cognate connection if the term has an obvious cognate in a common home language (esp. Spanish)${homeLanguages ? ` — prioritize cognates for: ${homeLanguages}` : ""}, else "no common cognate".
- language_domains: a concrete activity for EACH of the four domains (listening, speaking, reading, writing), each scaffolded to ${lvl.label}. All four are required — do not leave any thin.
- sentence_frames: 3–6 frames whose complexity matches ${lvl.label} (single-word/selection at Entering; complex, multi-clause at Bridging).
- scaffolds_and_visual_supports: specific supports for THIS level (visuals, realia, graphic organizers, gestures, home-language support, word banks, manipulatives).
- lesson_flow: 4–6 steps mirroring SIOP (build background → comprehensible input → guided practice/interaction → application → review & assessment), each with what_happens.
- formative_assessment: how the teacher checks BOTH the content objective and the language objective this lesson, at ${lvl.label}.
- level_up_down_note: one or two sentences on how the scaffolding/output would shift for a student one proficiency level below and one above — reinforcing that proficiency, not grade, drives the design.
- standards_alignment: 2–4 entries; framework field exactly "WIDA ELD" or "SIOP"; domain = the language domain (Listening/Speaking/Reading/Writing) or the relevant WIDA ELD Standard; text = the practice/standard this reflects. If unsure of an exact WIDA code, describe it and append "(verify against your state's ELP standards)".
- ${STATE_NOTE}

LENGTH DISCIPLINE: complete JSON (every field present, all four domains filled) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate an English language development lesson:

- Content topic: ${topic || "(choose an appropriate topic for this grade band)"}
- Content area: ${contentArea || "(infer from the topic)"}
- Grade band: ${band}
- WIDA proficiency level: ${lvl.label} (level ${lvl.n})
- Duration: ${durationMinutes} minutes${homeLanguages ? `\n- Student home language(s): ${homeLanguages}` : ""}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Remember: a separate content objective AND language objective, all four language domains, and scaffolding calibrated to ${lvl.label}. Do not use student names. Return the JSON object now.`

  return { system, user }
}
