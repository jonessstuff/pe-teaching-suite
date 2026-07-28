import { serializeLessonForTools } from "./lessonSummary.js"
import { toolDirective } from "./toolSubjectDirectives.js"
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
  // CTE lessons use a two-tier tier/level model (no grade_bands, different
  // grounding fields), so they get a dedicated single-band, tier-keyed quiz.
  if (lessonObject?.subject === "CTE" || lessonObject?.pathway) {
    return buildCteQuizPrompt(lessonObject);
  }

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

  return { system, user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("quiz", lessonObject.subject) };
}

/**
 * CTE quiz prompt: CTE lessons have no grade bands (tier/level model) and use
 * different grounding fields (competencies, singular learning_target, array
 * success_criteria/skill_focus, safety_notes). Produces ONE question set keyed
 * "cte"; generate-quiz stamps the human label (tier_label) onto it after.
 * @param {import("../../../src/types/lessonObject").LessonObject} lessonObject
 * @returns {{ system: string, user: string }}
 */
function buildCteQuizPrompt(lessonObject) {
  const competencies = (lessonObject.competencies ?? [])
    .map((c) => `${c.framework ? c.framework + " — " : ""}${c.text ?? c.competency ?? c.description ?? ""}`.trim())
    .filter(Boolean).join("; ") || "N/A";
  const criteria = (lessonObject.success_criteria ?? []).join(" | ") || "N/A";
  const skillFocus = (Array.isArray(lessonObject.skill_focus)
    ? lessonObject.skill_focus.join(" | ")
    : lessonObject.skill_focus) || "N/A";
  const newVocab = (lessonObject.new_vocabulary ?? []).join(", ") || "none listed";
  const knownVocab = (lessonObject.known_vocabulary ?? []).join(", ") || "none listed";
  const safety = (lessonObject.safety_notes ?? []).join(" | ") || "N/A";
  const tierLabel = lessonObject.tier_label ?? lessonObject.pathway_label ?? "this course";
  const isMs = lessonObject.tier === "ms";
  const calibration = isMs
    ? "This is a Middle School Exploratory course — keep questions awareness-level: 70%+ multiple_choice or true_false, plain vocabulary, concrete recall and safety awareness; at most 1-2 short_answer."
    : "This is a High School CTE course — include 3-4 short_answer application questions (a client scenario, a safety/sanitation judgment, a 'why does this matter') alongside multiple_choice and true_false, using correct industry vocabulary.";

  const system = `You are an experienced Career & Technical Education (CTE) instructor and industry professional creating a formative quiz for a ${lessonObject.pathway_label ?? "CTE"} lesson at the ${tierLabel} level, based on the specific lesson that was taught.

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — with this exact schema:

{
  "quiz_questions": {
    "cte": {
      "questions": [
        { "type": "multiple_choice" | "true_false" | "short_answer", "question": string, "options": string[], "answer": string }
      ]
    }
  }
}

Schema rules:
- Return EXACTLY ONE question set under the outer key "cte" (this pathway uses a tier/level model, not grade bands). Do not emit any other top-level keys.
- 8-10 questions total.
- ${calibration}
- "options" appears ONLY on multiple_choice questions — exactly 4 plain strings with NO letter prefix (the renderer adds A/B/C/D). For true_false and short_answer, omit "options" entirely.
- "answer" values: multiple_choice → "A", "B", "C", or "D" (letter of correct option). true_false → "True" or "False". short_answer → a concise model answer of 1-3 sentences.
- Ground EVERY question in the lesson's actual competencies, vocabulary, procedures, and — for any lesson with safety/sanitation/chemical/tool hazards — its SAFETY content (this is core CTE assessment, not optional). Do not invent content not present in the lesson.
- Multiple-choice distractors should be plausible but clearly incorrect upon reflection.`;

  const user = `Generate a quiz for this CTE lesson:

Title: ${lessonObject.title ?? ""}
Pathway: ${lessonObject.pathway_label ?? ""}
Course level: ${tierLabel}
Duration: ${lessonObject.duration_minutes ?? 50} min | Class size: ${lessonObject.class_size ?? 24}

Competencies: ${competencies}
Learning target: ${lessonObject.learning_target ?? "N/A"}
Success criteria: ${criteria}
Skill focus: ${skillFocus}

Vocabulary:
- Should already know: ${knownVocab}
- New this lesson: ${newVocab}

What was taught:
- Opener: ${lessonObject.warm_up ?? ""}
- Concept instruction: ${lessonObject.whole_group_instruction ?? ""}
- Skill demonstration: ${lessonObject.fitness_activities ?? ""}
- Hands-on application: ${lessonObject.independent_practice ?? ""}
- Closure: ${lessonObject.closure ?? ""}
- Safety notes: ${safety}

Return the JSON object now.`;

  return { system, user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("quiz", lessonObject.subject) };
}
