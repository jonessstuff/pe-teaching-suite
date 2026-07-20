export function buildCrossCurricularPrompt(lessonObject) {
  const subject = lessonObject.subject ?? 'PE';
  const gradeBands = (lessonObject.grade_bands ?? []).map(g => g === 0 ? 'K' : String(g));
  const standards = (lessonObject.standards ?? [])
    .map(s => `${s.code}: ${s.text}`)
    .join('\n') || 'Not listed';

  const system = `You are a curriculum specialist identifying authentic cross-curricular connections between a ${subject} lesson and core classroom academic subjects.

Return ONLY a single JSON object with this exact schema:
{
  "connections": [
    {
      "subject": string,
      "standard_code": string,
      "standard_text": string,
      "connection_description": string
    }
  ]
}

Rules:
- Identify 3–5 genuine, specific connections to: ELA (CCSS), Math (CCSS), Science (NGSS), or Social Studies (C3 Framework).
- "subject": one of "ELA", "Math", "Science", "Social Studies"
- "standard_code": real, grade-appropriate standard code (e.g. "CCSS.ELA-LITERACY.SL.3.1", "CCSS.MATH.CONTENT.4.MD.B.4", "NGSS.3-PS2-1", "C3.D2.Civ.1.3-5")
- "standard_text": brief description of the standard (1 sentence)
- "connection_description": 2-3 specific sentences explaining HOW this lesson connects to that standard. Name the specific activity, vocabulary, or skill from the lesson that links to the academic standard.
- Connections must be authentic, not superficial. "Students count equipment" is too thin. "Students graph heart rate data collected during the fitness stations, practicing data collection and line plots (CCSS.MATH.CONTENT.4.MD.B.4)" is substantive.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Find cross-curricular connections for this ${subject} lesson:

Title: ${lessonObject.title ?? ''}
Grade(s): ${gradeBands.join(', ')}

Lesson content:
- Warm-up: ${lessonObject.warm_up ?? ''}
- Main activity: ${lessonObject.fitness_activities || lessonObject.whole_group_instruction || ''}
- Closure: ${lessonObject.closure ?? ''}
- Vocabulary: ${[...(lessonObject.known_vocabulary ?? []), ...(lessonObject.new_vocabulary ?? [])].join(', ') || 'not listed'}

${subject} Standards addressed:
${standards}

Return the JSON object now.`;

  return { system, user };
}
