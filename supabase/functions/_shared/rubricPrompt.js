import { serializeLessonForTools } from "./lessonSummary.js"
import { toolDirective } from "./toolSubjectDirectives.js"
export function buildRubricPrompt(lessonObject) {
  // CTE lessons use a two-tier tier/level model (no grade_bands) with different
  // grounding fields (competencies, singular learning_target, array
  // success_criteria/skill_focus, safety_notes) — mirror the Quiz tool's CTE
  // branch so the rubric is course-level-calibrated and industry-grounded rather
  // than falling through the PE grade-band path (which produced grade "undefined").
  if (lessonObject?.subject === "CTE" || lessonObject?.pathway) {
    return buildCteRubricPrompt(lessonObject);
  }

  const gradeBands = lessonObject.grade_bands ?? [];
  const firstGrade = gradeBands[0];
  const gradeLabel = firstGrade === 0 ? "K" : String(firstGrade);

  const targets = lessonObject.learning_targets ?? {};
  const criteria = lessonObject.success_criteria ?? {};

  const criteriaNames = Object.keys(targets).length > 0
    ? Object.entries(targets).map(([g, t]) => `Grade ${g === '0' ? 'K' : g}: ${t}`).join('\n')
    : (lessonObject.title ?? 'Lesson skill');

  const successSeeds = firstGrade !== undefined && criteria[firstGrade]
    ? (criteria[firstGrade] ?? []).join(' | ')
    : '';

  const system = `You are an expert educator creating a standards-aligned performance rubric for a ${lessonObject.subject ?? 'PE'} lesson.

Return ONLY a single JSON object with this exact schema:
{
  "rubric": {
    "title": string,
    "level_labels": ["4 - Exceeds", "3 - Meets", "2 - Approaching", "1 - Beginning"],
    "criteria": [
      {
        "name": string,
        "descriptors": [string, string, string, string]
      }
    ]
  }
}

Rules:
- 3–5 criteria maximum. Each criterion is an observable, measurable skill from this lesson.
- "descriptors" array has exactly 4 strings: index 0 = Exceeds, 1 = Meets, 2 = Approaching, 3 = Beginning.
- Descriptors must be specific, observable, and clearly differentiated across levels. Avoid vague terms like "somewhat" or "tries."
- The "Meets" descriptor (index 1) seeds from the lesson's success criteria where available.
- Use grade-appropriate language for grade ${gradeLabel}.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Create a rubric for this lesson:

Title: ${lessonObject.title ?? ''}
Subject: ${lessonObject.subject ?? 'PE'}
Grade band(s): ${gradeBands.map(g => g === 0 ? 'K' : g).join(', ')}
Duration: ${lessonObject.duration_minutes ?? 45} min

Learning targets:
${criteriaNames}

Success criteria seeds (use these to write the "Meets" descriptors):
${successSeeds || 'Not specified — infer from learning targets and lesson content.'}

Main activity: ${lessonObject.fitness_activities || lessonObject.whole_group_instruction || ''}

Return the JSON object now.`;

  return { system, user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("rubric", lessonObject.subject) };
}

// CTE rubric — same output schema as buildRubricPrompt (renderer-compatible), but
// grounded on the CTE lesson shape: competencies, singular learning_target, array
// success_criteria/skill_focus, safety_notes, and tier_label (course level) instead
// of grade bands. Mirrors buildCteQuizPrompt in quizPrompt.js.
function buildCteRubricPrompt(lessonObject) {
  const competencies = (lessonObject.competencies ?? [])
    .map((c) => `${c.framework ? c.framework + " — " : ""}${c.text ?? c.competency ?? c.description ?? ""}`.trim())
    .filter(Boolean).join("; ") || "N/A";
  const successCriteria = (lessonObject.success_criteria ?? []).join(" | ");
  const skillFocus = (Array.isArray(lessonObject.skill_focus)
    ? lessonObject.skill_focus.join(" | ")
    : lessonObject.skill_focus) || "";
  const safety = (lessonObject.safety_notes ?? []).join(" | ");
  const tierLabel = lessonObject.tier_label ?? lessonObject.pathway_label ?? "this CTE course";
  const learningTarget = lessonObject.learning_target ?? "";
  const isMs = lessonObject.tier === "ms";
  const calibration = isMs
    ? "This is a Middle School Exploratory course — keep criteria awareness/exploratory-level and the language plain and concrete."
    : "This is a High School CTE course — calibrate to applied, industry-standard performance using correct industry vocabulary.";

  const system = `You are an experienced Career & Technical Education (CTE) instructor and industry professional creating a standards-aligned, performance-based rubric for a ${lessonObject.pathway_label ?? "CTE"} lesson at the ${tierLabel} level, based on the specific lesson that was taught.

Return ONLY a single JSON object with this exact schema:
{
  "rubric": {
    "title": string,
    "level_labels": ["4 - Exceeds", "3 - Meets", "2 - Approaching", "1 - Beginning"],
    "criteria": [
      {
        "name": string,
        "descriptors": [string, string, string, string]
      }
    ]
  }
}

Rules:
- 3–5 criteria maximum. Each criterion is an observable, measurable CTE skill or competency from THIS lesson — an industry technique/procedure, applied knowledge, or a professional/employability skill. Use correct industry vocabulary.
- Where the lesson involves SAFETY / sanitation / tool / chemical / clinical hazards, INCLUDE a Safety & Professionalism criterion — safe, correct practice is core to CTE performance assessment, not optional.
- "descriptors" array has exactly 4 strings: index 0 = Exceeds, 1 = Meets, 2 = Approaching, 3 = Beginning. Specific, observable, clearly differentiated across levels; avoid vague terms like "somewhat" or "tries."
- The "Meets" descriptor (index 1) seeds from the lesson's success criteria / competencies where available.
- ${calibration}
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Create a performance rubric for this CTE lesson:

Title: ${lessonObject.title ?? ""}
Pathway: ${lessonObject.pathway_label ?? ""}
Course level: ${tierLabel}
Duration: ${lessonObject.duration_minutes ?? 50} min

Learning target: ${learningTarget || "N/A"}
Competencies: ${competencies}
Skill focus (build the rubric criteria from these): ${skillFocus || "infer from the competencies and learning target"}
Success criteria (seed the "Meets" descriptors): ${successCriteria || "infer from the competencies and learning target"}
Safety / professionalism notes: ${safety || "none specified"}

What was taught (skill demonstration & hands-on application):
${lessonObject.fitness_activities || lessonObject.whole_group_instruction || ""}
${lessonObject.independent_practice || ""}

Return the JSON object now.`;

  return { system, user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("rubric", lessonObject.subject) };
}
