import { serializeLessonForTools } from "./lessonSummary.js"
import { toolDirective } from "./toolSubjectDirectives.js"
/**
 * Parent communication note prompt builder.
 *
 * Takes an existing LessonObject and generates a warm, jargon-free note
 * for parents/guardians describing what students learned. Returns four
 * structured fields that the renderer displays section-by-section, plus
 * a copy-as-plain-text button in the renderer assembles them into prose.
 */

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
export function buildParentNotePrompt(lessonObject) {
  const subject = lessonObject.subject ?? "PE";
  const grades = (lessonObject.grade_bands ?? [])
    .map((g) => (g === 0 ? "K" : String(g)))
    .join("/");

  const system = `You are an experienced ${subject} teacher writing a brief, friendly note for parents and guardians about a recent lesson.

Your tone must be warm, encouraging, and completely free of educator jargon. Write as if speaking to a caring parent who is not a teacher. Never use acronyms or technical terms without immediately explaining them in plain language.

You must return ONLY a single JSON object — no markdown fences, no commentary — matching this exact schema:

{
  "parent_note_intro": string,
  "parent_note_skills": string[],
  "parent_note_vocabulary": [{ "word": string, "definition": string }],
  "parent_note_ask": string[]
}

Field guidance:
- parent_note_intro: 2-3 warm sentences introducing the lesson. Naturally mention the topic, what students practiced, and why it matters. Avoid starting with "Today" — vary the opener.
- parent_note_skills: Array of 3-4 plain strings (no leading dashes or bullets) naming the key skills or concepts students practiced. Keep each item to one short sentence. Example: "Throwing and catching with a partner at varying distances."
- parent_note_vocabulary: Array of 2-4 objects, each with a "word" (the vocabulary term) and a "definition" (a simple, kid-friendly explanation in plain English a parent can use at home). Example: { "word": "Serve", "definition": "The way you start a game by hitting the ball over the net to the other side." }
- parent_note_ask: Array of 1-2 open-ended conversation-starter strings. Each must begin with the phrase "Ask your child". Keep them specific to this lesson's content so the conversation is meaningful. Example: "Ask your child to show you the ready position they learned for volleyball today."

Critical rules:
- Never use the word "standards", "SOL", "benchmark", or any curriculum framework reference.
- Keep parent_note_intro under 60 words.
- Keep each parent_note_skills item under 15 words.
- Keep each parent_note_ask item conversational and inviting, not like a quiz question.`;

  const user = `Write a parent communication note for this ${subject} lesson (Grade ${grades || "K–12"}):

Title: ${lessonObject.title ?? ""}
Unit: ${lessonObject.unit ?? ""}
Skills practiced: ${(lessonObject.skill_focus ?? []).join(", ") || "(see lesson content)"}
Vocabulary students learned: ${(lessonObject.new_vocabulary ?? []).join(", ") || "none listed"}
Warm-up: ${lessonObject.warm_up ? lessonObject.warm_up.slice(0, 300) : ""}
Main lesson: ${lessonObject.whole_group_instruction ? lessonObject.whole_group_instruction.slice(0, 400) : ""}
Independent practice: ${lessonObject.independent_practice ? lessonObject.independent_practice.slice(0, 300) : ""}

Return the JSON object now.`;

  return { system, user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("parentNote", lessonObject.subject) };
}
