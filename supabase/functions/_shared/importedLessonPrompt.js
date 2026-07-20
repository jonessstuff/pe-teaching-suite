export function buildImportedLessonPrompt({ rawText, subject, gradeBand }) {
  const gradeLabel = gradeBand === 0 ? 'K' : String(gradeBand);

  const system = `You are an expert curriculum specialist reformatting a teacher's existing lesson plan into a structured, standards-aligned format. Preserve the teacher's original content and intent — enhance and organize, do not replace. Add missing elements (standards, learning targets, vocabulary) based on the subject and grade level.

Return a complete lesson object as a single JSON object with this exact schema:
{
  "title": string,
  "subject": string,
  "grade_bands": [number],
  "duration_minutes": number,
  "class_size": number,
  "warm_up": string,
  "fitness_activities": string,
  "whole_group_instruction": string,
  "independent_practice": string,
  "closure": string,
  "equipment_needed": [string],
  "known_vocabulary": [string],
  "new_vocabulary": [string],
  "learning_targets": { "${gradeLabel === 'K' ? '0' : gradeBand}": string },
  "success_criteria": { "${gradeLabel === 'K' ? '0' : gradeBand}": [string, string, string] },
  "standards": [
    { "grade": number, "code": string, "text": string }
  ],
  "unit": string,
  "teacher_notes": string
}

Rules:
- Preserve the teacher's original activity descriptions — enhance the language, don't replace their ideas.
- "fitness_activities" is the main activity field for PE, Art, Library, STEM. Use "whole_group_instruction" for Music and classroom subjects. Fill whichever is appropriate.
- "standards": add 1-3 real, appropriate standards for this subject and grade. Use SHAPE America for PE, NCCAS for Art, ISTE/AASL for Library, Next Gen Science for STEM, CCSS for ELA/Math.
- "duration_minutes": estimate from the lesson content if not stated.
- "unit": infer from lesson content if not stated.
- "teacher_notes": note anything preserved from the original that might need the teacher's review.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Reformat and enhance this existing ${subject} lesson for Grade ${gradeLabel}:

---
${rawText}
---

Return the JSON object now.`;

  return { system, user };
}
