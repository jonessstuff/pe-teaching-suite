import { serializeLessonForTools } from "./lessonSummary.js"
import { toolDirective } from "./toolSubjectDirectives.js"
/**
 * Worksheet generation prompt builder.
 *
 * Takes an existing LessonObject + a set of teacher-selected FORMAT types and
 * produces independent-practice / reinforcement worksheets grounded in the
 * lesson's actual vocabulary and concepts. Distinct from the Quiz tool: this is
 * PRACTICE/REVIEW material (not a graded assessment) in multiple selectable
 * formats. Returns { worksheet: { formats: [...] } }.
 *
 * Word searches return ONLY the word list — the client builds the letter grid
 * (far more reliable than asking the model to lay out valid coordinates).
 */

const FORMAT_SPECS = {
  fill_blank: `"fill_blank" — sentence/paragraph completion tied to the lesson's vocabulary & concepts.
    Fields: "items": [{ "text": string (ONE blank marked exactly as "____"), "answer": string (the missing word/phrase, drawn from the lesson) }]. 8-12 items. Each sentence must teach/reinforce a real concept from the lesson, not trivia.`,
  word_search: `"word_search" — a vocabulary word-search puzzle (the CLIENT builds the letter grid; you only choose the words).
    Fields: "words": string[] of 8-14 KEY VOCABULARY words from THIS lesson, UPPERCASE, LETTERS ONLY (no spaces/punctuation — join or hyphen-strip multi-word terms, e.g. "MISE EN PLACE" -> "MISEENPLACE", or pick the single strongest word), each 3-14 letters. If the lesson has fewer than 6 usable vocabulary words, return applicable:false.`,
  matching: `"matching" — term-to-definition (or concept-to-example) matching.
    Fields: "pairs": [{ "term": string, "definition": string }]. 6-10 pairs, all from the lesson's vocabulary/concepts. The client shuffles the right column; keep each definition concise.`,
  research: `"research" — a guided research / note-taking template on the lesson topic.
    Fields: "overview": string (1-2 sentences framing the investigation), "questions": string[] of 5-8 guided research questions or note-taking prompts (each gets writing space in the worksheet), and optional "sources": string[] of suggested source TYPES (e.g. "a nonfiction book", "a vetted kids' website"). Not a quiz — these are open investigation prompts.`,
  cut_paste: `"cut_paste" — a simple cut-and-paste SORTING or SEQUENCING activity for YOUNGER students (K-5).
    Fields: "mode": "sort" | "sequence", "instructions": string (kid-friendly cut-and-paste directions). For "sort": "categories": [{ "name": string, "items": string[] }] (2-4 categories; items are the pieces students cut out and sort — the client presents them scrambled). For "sequence": "items": string[] IN CORRECT ORDER (the client scrambles them; students cut and paste into order). Keep pieces short, concrete, picture-able. If the content is too abstract to sort/sequence physically, return applicable:false.`,
  multiple_choice: `"multiple_choice" — multiple-choice PRACTICE/REVIEW (same shape as a quiz item but framed as low-stakes practice, NOT a graded test).
    Fields: "questions": [{ "question": string, "options": string[] (exactly 4, no letter prefix), "answer": "A"|"B"|"C"|"D" }]. 6-10 questions grounded in the lesson.`,
}

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @param {string[]} formats  requested format types (keys of FORMAT_SPECS)
 * @returns {{ system: string, user: string }}
 */
export function buildWorksheetPrompt(lessonObject, formats) {
  const requested = (Array.isArray(formats) ? formats : [])
    .filter((f) => FORMAT_SPECS[f])
  const isCte = lessonObject?.subject === "CTE" || Boolean(lessonObject?.pathway)

  const knownVocab = (lessonObject.known_vocabulary ?? []).join(", ") || "none listed"
  const newVocab = (lessonObject.new_vocabulary ?? []).join(", ") || "none listed"

  // Grade / level context + calibration.
  let levelContext
  let calibration
  if (isCte) {
    const tierLabel = lessonObject.tier_label ?? lessonObject.pathway_label ?? "this course"
    levelContext = `Course level: ${tierLabel} (CTE — no grade bands)`
    calibration = lessonObject.tier === "ms"
      ? "Middle School Exploratory — keep it awareness-level with plain vocabulary and concrete recall."
      : "High School CTE — use correct industry vocabulary and expect applied, workplace-relevant reinforcement."
  } else {
    const gradeBands = lessonObject.grade_bands ?? []
    const labels = gradeBands.map((g) => (g === 0 ? "K" : String(g)))
    levelContext = `Grade band(s): ${labels.join(", ") || "unspecified"}`
    const minG = gradeBands.length ? Math.min(...gradeBands) : 5
    calibration = minG <= 2
      ? "Primary (K-2) — very simple words, short sentences, concrete and picture-able; minimal reading load."
      : minG <= 5
        ? "Elementary (3-5) — simple, concrete vocabulary and clear, short prompts."
        : "Secondary (6-12) — richer vocabulary and more analytical prompts, still practice-level not test-level."
  }

  const requestedSpecs = requested.map((f) => `- ${FORMAT_SPECS[f]}`).join("\n")

  const system = `You are an expert ${lessonObject.subject ?? "PE"} educator creating INDEPENDENT-PRACTICE / REINFORCEMENT worksheets from a specific lesson that was taught. These are low-stakes practice materials for students to consolidate the lesson — NOT graded assessments.

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — with this schema:

{
  "worksheet": {
    "formats": [
      {
        "type": <one of the REQUESTED types below>,
        "applicable": boolean,        // false = this format does not fit THIS lesson's content
        "reason": string,             // REQUIRED only when applicable is false — one short sentence
        "title": string,             // short student-facing title, e.g. "Vocabulary Review"
        "instructions": string,      // clear student directions
        ...type-specific fields below...
      }
    ]
  }
}

Generate EXACTLY ONE entry for EACH of these requested formats (do not add others):
${requestedSpecs}

Rules:
- Ground EVERYTHING in the lesson's ACTUAL vocabulary, concepts, and content below — do not invent material not in the lesson.
- Frame as practice/reinforcement, never as a graded test (even multiple_choice is "practice/review").
- Calibrate difficulty to: ${calibration}
- If a requested format genuinely does NOT fit this lesson's content, still return an entry for it with "applicable": false and a one-sentence "reason" (omit that format's content fields). Be honest — e.g. a word search with too few real vocabulary words, or a cut & paste for content that can't be physically sorted or sequenced.
- Every "applicable": true entry MUST include "title", "instructions", and its type-specific fields.`

  const taught = isCte
    ? `- Opener: ${lessonObject.warm_up ?? ""}
- Concept instruction: ${lessonObject.whole_group_instruction ?? ""}
- Skill demonstration: ${lessonObject.fitness_activities ?? ""}
- Hands-on application: ${lessonObject.independent_practice ?? ""}
- Closure: ${lessonObject.closure ?? ""}`
    : `- Warm up: ${lessonObject.warm_up ?? ""}
- Main instruction: ${lessonObject.whole_group_instruction ?? ""}
- Independent practice: ${lessonObject.independent_practice ?? ""}
- Closure: ${lessonObject.closure ?? ""}`

  const user = `Create worksheets for this lesson:

Title: ${lessonObject.title ?? ""}
Subject: ${lessonObject.subject ?? "PE"}
Unit: ${lessonObject.unit ?? ""}
${levelContext}
Learning target: ${lessonObject.learning_target ?? (lessonObject.learning_targets ? Object.values(lessonObject.learning_targets).join(" | ") : "") ?? ""}

Vocabulary:
- Words they should already know: ${knownVocab}
- New vocabulary from this lesson: ${newVocab}

What was taught:
${taught}

Requested formats: ${requested.join(", ")}

Return the JSON object now.`

  return {
    system,
    user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("worksheet", lessonObject.subject),
  }
}
