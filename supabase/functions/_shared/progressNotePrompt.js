const PERFORMANCE_PHRASES = {
  exceeding: 'exceeded the identified benchmark, consistently demonstrating mastery above expectations',
  meeting: 'met the identified benchmark, demonstrating adequate progress toward the annual goal',
  approaching: 'approached the identified benchmark with emerging skill development; continued support is needed',
  emerging: 'is at the beginning stage of skill acquisition and requires significant support to progress toward the benchmark',
};

const GOAL_CATEGORY_CONTEXT = {
  participation: 'participation and engagement in instructional activities',
  skill_acquisition: 'skill acquisition and academic content mastery',
  behavior: 'behavioral and social-emotional skills (self-regulation, cooperation, following directions)',
  communication: 'communication skills (expressive language, receptive language, AAC use)',
  independence: 'independence and self-advocacy skills (task initiation, self-monitoring, transitions)',
};

export function buildProgressNotePrompt(lessonObject, { studentName, iepGoal, goalCategory, observationNotes, performanceLevel }) {
  const name = studentName?.trim() || 'The student';
  const subject = lessonObject.subject ?? 'Physical Education';
  const gradeBands = (lessonObject.grade_bands ?? []).map(g => g === 0 ? 'K' : String(g));
  const phrase = PERFORMANCE_PHRASES[performanceLevel] ?? 'demonstrated performance toward the identified benchmark';
  const categoryContext = GOAL_CATEGORY_CONTEXT[goalCategory] ?? goalCategory;

  const system = `You are a special education coordinator writing a formal IEP progress note for a student's file. Your notes are objective, factual, and written in third person past tense. You use professional educational language suitable for IEP documents, school records, and parent communication. You document observable behaviors only — no speculation about cause, no loaded language, no judgmental phrasing.

Return ONLY a single JSON object with this exact schema:
{
  "progress_note": string
}

Rules:
- The note should be 150–250 words.
- Write in third person past tense throughout.
- Reference the specific lesson/activity context.
- Quote or paraphrase the IEP goal clearly.
- State the performance level using the provided phrase.
- Incorporate the teacher's observation notes, rephrased into objective IEP documentation language.
- End with a brief statement about next steps or continued monitoring.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Write a formal IEP progress note for the following:

Student: ${name}
Subject/Class: ${subject} (Grade ${gradeBands.join('/')})
Lesson: ${lessonObject.title ?? 'class session'}
Main activity: ${lessonObject.fitness_activities || lessonObject.whole_group_instruction ?? ''}

IEP Goal Category: ${goalCategory} — ${categoryContext}
IEP Goal: "${iepGoal}"

Performance level: ${performanceLevel} — student ${phrase}

Teacher observation notes (rephrase into objective IEP language):
${observationNotes}

Return the JSON object now.`;

  return { system, user };
}
