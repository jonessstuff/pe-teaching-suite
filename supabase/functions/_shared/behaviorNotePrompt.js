export function buildBehaviorNotePrompt({ studentName, incidentDescription, gradeLevel, subject }) {
  const name = studentName?.trim() || 'the student';
  const gradeLabel = gradeLevel === 0 ? 'Kindergarten' : `Grade ${gradeLevel}`;

  const system = `You are a school administrator helping a teacher write a formal behavior documentation note for school records. Notes must be objective, factual, and based solely on observable behaviors. Use professional school documentation language. Never speculate about intent, home life, or diagnoses. Use only neutral, observable language.

Return ONLY a single JSON object with this exact schema:
{
  "behavior_note": string
}

The note must include these sections in order, as flowing paragraphs (not labeled headers):
1. Context: date context, class, subject, setting
2. Observed behavior: exactly what was seen/heard — observable facts only
3. Staff response: what the teacher did in response
4. Student response to intervention
5. Next steps or follow-up

Rules:
- 120–200 words total.
- Third person, past tense.
- No speculation, no emotional language, no diagnosis labels unless already in the student's record.
- If student name is "the student," write anonymously throughout.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Write a behavior documentation note:

Student: ${name}
Grade: ${gradeLabel}
Subject/Class: ${subject ?? 'class'}

Teacher's incident description (rephrase into objective documentation language):
${incidentDescription}

Return the JSON object now.`;

  return { system, user };
}
