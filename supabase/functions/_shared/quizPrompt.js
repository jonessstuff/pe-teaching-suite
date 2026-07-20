/**
 * Quiz generation prompt builder.
 *
 * Takes an existing LessonObject and produces per-grade-band question sets
 * grounded in the lesson's actual standards, vocabulary, and activities.
 * Returns the quiz_questions field to be merged onto the LessonObject.
 */

/**
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
export function buildQuizPrompt(lessonObject) {
  const gradeBands = lessonObject.grade_bands ?? [];
  const knownVocab =
    (lessonObject.known_vocabulary ?? []).join(", ") || "none listed";
  const newVocab =
    (lessonObject.new_vocabulary ?? []).join(", ") || "none listed";

  const gradeDetails = gradeBands
    .map((grade) => {
      const label = grade === 0 ? "K" : String(grade);
      const standards = (lessonObject.standards ?? [])
        .filter((s) => s.grade === grade)
        .map((s) => `${s.code}: ${s.text}`)
        .join("; ") || "N/A";
      const target = lessonObject.learning_targets?.[grade] ?? "N/A";
      const criteria =
        (lessonObject.success_criteria?.[grade] ?? []).join(" | ") || "N/A";
      return `Grade ${label}:\n  Standard(s): ${standards}\n  Learning target: ${target}\n  Success criteria: ${criteria}`;
    })
    .join("\n\n");

  const system = `You are an expert ${lessonObject.subject ?? "PE"} educator creating a grade-appropriate formative quiz based on a specific lesson that was taught.

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — with this exact schema:

{
  "quiz_questions": {
    "<grade_as_string>": {
      "grade": <grade_as_number>,
      "questions": [
        {
          "type": "multiple_choice" | "true_false" | "short_answer",
          "question": string,
          "options": string[],
          "answer": string
        }
      ]
    }
  }
}

Schema rules:
- The outer key is the grade as a string (e.g. "6", "7", "0" for Kindergarten).
- Generate a SEPARATE question set for EACH grade band. Questions must differ meaningfully by grade — calibrate complexity, vocabulary, and question type mix to the developmental level.
- 8-10 questions per grade band.
- Younger grades (K-5): 60%+ multiple_choice or true_false, simple vocabulary, concrete recall. Older grades (6-12): include 2-3 short_answer application questions per set alongside MC and T/F.
- "options" appears ONLY on multiple_choice questions — exactly 4 plain strings with NO letter prefix (the renderer adds A/B/C/D). For true_false and short_answer, omit "options" entirely.
- "answer" values: multiple_choice → "A", "B", "C", or "D" (letter of correct option). true_false → "True" or "False". short_answer → a concise model answer of 1-3 sentences.
- Every question must be grounded in the lesson's actual vocabulary, standards, and activities. Do not invent content not present in the lesson.
- Multiple choice distractors should be plausible but clearly incorrect upon reflection.`;

  const user = `Generate a quiz for this lesson:

Title: ${lessonObject.title ?? ""}
Subject: ${lessonObject.subject ?? "PE"}
Unit: ${lessonObject.unit ?? ""}
Grade band(s): ${gradeBands.map((g) => (g === 0 ? "K" : g)).join(", ")}
Duration: ${lessonObject.duration_minutes ?? 45} min | Class size: ${lessonObject.class_size ?? 28}

Per-grade standards and objectives:
${gradeDetails}

Vocabulary:
- Words they should already know: ${knownVocab}
- New vocabulary from this lesson: ${newVocab}

What was taught:
- Warm up: ${lessonObject.warm_up ?? ""}
- Main instruction: ${lessonObject.whole_group_instruction ?? ""}
- Independent practice: ${lessonObject.independent_practice ?? ""}
- Closure: ${lessonObject.closure ?? ""}

Return the JSON object now.`;

  return { system, user };
}
