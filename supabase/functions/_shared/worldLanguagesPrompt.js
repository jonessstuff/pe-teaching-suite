/**
 * World Languages prompt builder.
 *
 * Generates a lesson structured around the ACTFL "5 Cs" (Communication, Cultures,
 * Connections, Comparisons, Communities), with Communication organized by the
 * three modes (Interpersonal, Interpretive, Presentational), calibrated to an
 * ACTFL proficiency level (Novice / Intermediate / Advanced).
 *
 * Applies to ANY target language the teacher specifies — modern, classical
 * (Latin, etc.), heritage/native, and American Sign Language — the standards are
 * language-agnostic. Grade bands K-2 → 9-12 (elementary = FLES/exposure).
 *
 * ACCURACY GUARDRAIL: the AI does NOT produce long native-quality passages in the
 * target language. It frames instruction in ENGLISH, supplies SHORT example
 * vocabulary/phrases only, and every output carries an accuracy_note telling the
 * teacher / a native-speaker resource to verify target-language content before
 * use (especially for less common languages).
 */

import { WL_ACCURACY } from "./wlAccuracy.js"

const BANDS = {
  "k-2": { label: "K–2", context: "early elementary / FLES exposure — playful and oral; TPR (total physical response), songs, gestures, games, and concrete high-frequency vocabulary with heavy modeling; minimal reading/writing." },
  "3-5": { label: "3–5", context: "upper-elementary FLES — oral proficiency focus with simple reading/writing; games, routines, and culture; short connected phrases building on memorized language." },
  "6-8": { label: "6–8", context: "middle school / exploratory or beginning sequence — more structured communication across the three modes; AGE-RESPECTFUL contexts (peers, interests, real situations); building toward Intermediate; never childish." },
  "9-12": { label: "9–12", context: "high school sequential courses — real communication with authentic resources, richer presentational writing/speaking, and deeper cultural analysis; dignified, adult-relevant contexts." },
}

const LEVELS = {
  novice: { label: "Novice", guide: "Novice (Low–High): communicates with memorized words, high-frequency phrases, and lists on very familiar topics; comprehends highly practiced, predictable language. Keep tasks recognition- and reproduction-based with lots of scaffolding, visuals, and models." },
  intermediate: { label: "Intermediate", guide: "Intermediate (Low–High): CREATES with the language — asks and answers questions, produces sentences and strings of sentences, and handles simple, predictable real-world tasks. Emphasize personalized expression and recombination, not just memorized chunks." },
  advanced: { label: "Advanced", guide: "Advanced (Low–High): narrates and describes in paragraph-length connected discourse across present, past, and future time frames, and handles a complication in a familiar situation. Emphasize sustained, organized production and comprehension of longer authentic texts." },
}

const FRAMING = `Structure the lesson around the ACTFL World-Readiness Standards — the 5 Cs:
- COMMUNICATION — organized by the THREE MODES: Interpersonal (two-way, spontaneous, negotiated conversation), Interpretive (one-way comprehension of listening/reading/viewing), and Presentational (one-way production: speaking/writing/signing to an audience).
- CULTURES — tie language to authentic PRODUCTS, PRACTICES, and PERSPECTIVES of the cultures/communities where the language is spoken.
- CONNECTIONS — link the language to other subject areas / content.
- COMPARISONS — compare the target language's structures and the culture to the students' own (English / their native language).
- COMMUNITIES — use the language beyond the classroom (real-world, lifelong, or community application).

PROFICIENCY: calibrate everything to the specified ACTFL proficiency level using the ACTFL Proficiency Guidelines (2024 revision), which describe function across four domains (speaking, writing, listening, reading). Levels run Novice → Intermediate → Advanced → Superior → Distinguished; K-12 work centers on Novice–Advanced. Give a proficiency-appropriate Can-Do–style learning target.`

// Shared guardrail (see wlAccuracy.js) + this module's accuracy_note instruction.
const ACCURACY = `${WL_ACCURACY}
- Populate the accuracy_note field with that verification reminder for the teacher.`

const LANGUAGE_ADAPT = `ADAPT to the target language:
- Classical languages (e.g., Latin, Ancient Greek): emphasize the INTERPRETIVE (reading) mode; interpersonal speaking may be limited — frame it as oral reading, recitation, or spoken practice as the program does; cultures = the classical civilization.
- American Sign Language (ASL): ASL is a visual-gestural language with no written form. Treat Interpretive as watching/comprehending signed content, Presentational as signing (live or recorded) — "writing" becomes glossing or recorded signing; give example items as ASL GLOSSES (e.g., small-caps-style gloss) with an English meaning; cultures = Deaf culture and community. Do NOT invent sign descriptions you are unsure of — describe the function and flag for verification.
- Heritage/native speakers: acknowledge existing proficiency; focus on expanding register, literacy, and cultural knowledge rather than basics.`

const JSON_ONLY = `You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble.`

function schemaBlock() {
  return `{
  "subject": "World Languages",
  "target_language": string,
  "band_label": string,
  "grade_bands": number[],
  "proficiency_level": string,
  "theme": string,
  "title": string,
  "session_length_minutes": number,
  "can_do_statement": string,
  "communication": {
    "interpersonal": { "activity": string, "example_language": [ { "target": string, "gloss": string } ], "teacher_notes": string },
    "interpretive": { "activity": string, "example_language": [ { "target": string, "gloss": string } ], "teacher_notes": string },
    "presentational": { "activity": string, "example_language": [ { "target": string, "gloss": string } ], "teacher_notes": string }
  },
  "cultures": string,
  "connections": string,
  "comparisons": string,
  "communities": string,
  "vocabulary": [ { "target": string, "gloss": string, "notes": string } ],
  "materials": string[],
  "assessment_check": string,
  "accuracy_note": string,
  "standards_alignment": [ { "framework": string, "text": string } ]
}`
}

function fieldNotes(sessionLength) {
  return `Field notes:
- subject: always exactly "World Languages".
- target_language: echo the teacher's target language exactly.
- grade_bands: JSON array of grade numbers (K = 0) covered by this band.
- proficiency_level: the ACTFL level this lesson targets (Novice / Intermediate / Advanced).
- theme: the lesson's topical theme (e.g., greetings, food, daily routine, travel).
- session_length_minutes: ${sessionLength}.
- can_do_statement: a proficiency-appropriate, ACTFL Can-Do–style learning target in English (e.g., "I can greet someone and ask how they are").
- communication: three modes. For EACH mode give (a) activity = an English description of a concrete task, (b) example_language = a few SHORT target-language items with English glosses (target = the word/phrase in the target language; for ASL use a gloss), and (c) teacher_notes = quick facilitation/scaffolding tips. Interpersonal = spontaneous two-way conversation/dialogue tasks; Interpretive = listening/reading/viewing comprehension in the target language; Presentational = speaking/writing/signing production for an audience.
- cultures: connect the theme to authentic products/practices/perspectives of the target-language culture(s).
- connections: link the lesson to another subject area/content.
- comparisons: compare a target-language structure or cultural practice to English / the students' own.
- communities: a way students use the language beyond the classroom.
- vocabulary: 6–10 key theme words/phrases — SHORT items with target + English gloss (+ optional notes on usage/register). Nothing long or essay-like.
- materials: specific, usable materials (authentic resources, realia, visuals).
- assessment_check: an informal way to gauge the Can-Do target — evidence of the proficiency function, not a formal test.
- accuracy_note: the target-language verification reminder (see the accuracy guardrail).
- standards_alignment: 2–4 entries; framework field one of "ACTFL World-Readiness (5 Cs)" or "ACTFL Proficiency Guidelines (2024)".

AGE & DIGNITY: match tone/materials to the AGE, not the (necessarily low) language level — for middle/high school use age-respectful, real-world contexts even at Novice; never childish for teens.`
}

export function buildWorldLanguagesPrompt({ gradeBand = "9-12", targetLanguage = "Spanish", proficiencyLevel = "novice", theme = "", sessionLengthMinutes = 50, teacherNotes = "" }) {
  const band = BANDS[gradeBand] ?? BANDS["9-12"]
  const level = LEVELS[String(proficiencyLevel).toLowerCase()] ?? LEVELS.novice
  const lang = (targetLanguage || "Spanish").trim()

  const system = `You are an experienced World Languages teacher and ACTFL-aligned curriculum designer. You write practical, standards-based lessons that any teacher of ${lang} can pick up and run.

${FRAMING}

${ACCURACY}

${LANGUAGE_ADAPT}

Target language: ${lang}
Proficiency level — ${level.label}: ${level.guide}
Band calibration — ${band.label}: ${band.context}

${JSON_ONLY} Match this schema exactly:

${schemaBlock()}

${fieldNotes(sessionLengthMinutes)}
- band_label: "${band.label}". proficiency_level: "${level.label}".

LENGTH DISCIPLINE: complete JSON (every field present) over exhaustive detail. A response cut off before the closing brace is a FAILED response.`

  const user = `Generate a ${lang} lesson structured around the ACTFL 5 Cs:

- Target language: ${lang}
- Grade band: ${band.label} — ${band.context}
- Proficiency level: ${level.label}
- Theme: ${theme || "(choose a high-frequency, level-appropriate theme for this language and band)"}
- Session length: ${sessionLengthMinutes} minutes${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ""}

Frame all instruction in ENGLISH; give only short example ${lang} vocabulary/phrases (with English glosses), and include the accuracy-verification note. Return the JSON object now.`

  return { system, user }
}

// Structured-outputs JSON Schema — guarantees valid JSON. Important here because
// example vocabulary carries accented / non-Latin / gloss text and apostrophes
// that can trip a tolerant text parser. Rules: every object needs
// additionalProperties:false and lists all properties in required.
export function buildWorldLanguagesSchema() {
  const strArr = { type: "array", items: { type: "string" } }
  const exampleLanguage = {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["target", "gloss"],
      properties: { target: { type: "string" }, gloss: { type: "string" } },
    },
  }
  const mode = {
    type: "object",
    additionalProperties: false,
    required: ["activity", "example_language", "teacher_notes"],
    properties: {
      activity: { type: "string" },
      example_language: exampleLanguage,
      teacher_notes: { type: "string" },
    },
  }
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "subject", "target_language", "band_label", "grade_bands", "proficiency_level",
      "theme", "title", "session_length_minutes", "can_do_statement", "communication",
      "cultures", "connections", "comparisons", "communities", "vocabulary",
      "materials", "assessment_check", "accuracy_note", "standards_alignment",
    ],
    properties: {
      subject: { const: "World Languages" },
      target_language: { type: "string" },
      band_label: { type: "string" },
      grade_bands: { type: "array", items: { type: "number" } },
      proficiency_level: { type: "string" },
      theme: { type: "string" },
      title: { type: "string" },
      session_length_minutes: { type: "number" },
      can_do_statement: { type: "string" },
      communication: {
        type: "object",
        additionalProperties: false,
        required: ["interpersonal", "interpretive", "presentational"],
        properties: { interpersonal: mode, interpretive: mode, presentational: mode },
      },
      cultures: { type: "string" },
      connections: { type: "string" },
      comparisons: { type: "string" },
      communities: { type: "string" },
      vocabulary: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["target", "gloss", "notes"],
          properties: { target: { type: "string" }, gloss: { type: "string" }, notes: { type: "string" } },
        },
      },
      materials: strArr,
      assessment_check: { type: "string" },
      accuracy_note: { type: "string" },
      standards_alignment: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["framework", "text"],
          properties: { framework: { type: "string" }, text: { type: "string" } },
        },
      },
    },
  }
}
