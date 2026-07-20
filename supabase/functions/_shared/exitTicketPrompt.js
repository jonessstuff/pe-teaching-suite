export function buildExitTicketPrompt(lessonObject) {
  const subject = lessonObject.subject ?? 'PE';
  const gradeBands = (lessonObject.grade_bands ?? []).map(g => g === 0 ? 'K' : String(g));
  const targets = Object.values(lessonObject.learning_targets ?? {}).join(' | ') || lessonObject.title;

  const system = `You are an expert ${subject} educator creating exit ticket options for a lesson. Exit tickets should take 2–3 minutes and directly assess whether students met the learning target.

Return ONLY a single JSON object with this exact schema:
{
  "exit_tickets": [
    {
      "format": "digital",
      "title": string,
      "question": string,
      "instructions": string
    },
    {
      "format": "paper",
      "title": string,
      "question": string,
      "instructions": string
    },
    {
      "format": "verbal",
      "title": string,
      "question": string,
      "instructions": string
    }
  ]
}

Rules:
- "digital": a question suitable for a Google Form, Kahoot, or Mentimeter (clear multiple choice or short text). Include 3-4 answer options in the "question" field if multiple choice.
- "paper": a 1-2 question slip that fits a quarter-page when printed. Concise. Students write brief answers.
- "verbal": a whole-class quick-check — thumbs up/down, fist-to-five, or a partner discussion prompt the teacher can observe in 60 seconds.
- All three questions must assess the SAME learning target but in format-appropriate ways.
- Use age-appropriate language for grade(s) ${gradeBands.join(', ')}.
- "instructions": tells the TEACHER how to administer this format (1-2 sentences).
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Create exit tickets for this lesson:

Title: ${lessonObject.title ?? ''}
Subject: ${subject} | Grade(s): ${gradeBands.join(', ')}

Learning target(s): ${targets}

What students did today:
- Warm-up: ${lessonObject.warm_up ?? ''}
- Main: ${lessonObject.fitness_activities || lessonObject.whole_group_instruction || ''}
- Closure: ${lessonObject.closure ?? ''}

Return the JSON object now.`;

  return { system, user };
}
