export function buildRubricPrompt(lessonObject) {
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

  return { system, user };
}
