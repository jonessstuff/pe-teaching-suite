import { serializeLessonForTools } from "./lessonSummary.js"
import { toolDirective } from "./toolSubjectDirectives.js"
export function buildFamilyNewsletterPrompt(lessonObject, weekOf) {
  const subject = lessonObject.subject ?? 'PE';
  const gradeBands = (lessonObject.grade_bands ?? []).map(g => g === 0 ? 'K' : String(g));

  const system = `You are a specialist teacher writing a warm, jargon-free family newsletter about a recent class lesson. Write at a 6th-grade reading level. Avoid education jargon — explain things as you would to a caring parent who wants to support their child at home.

Return ONLY a single JSON object with this exact schema:
{
  "family_newsletter": {
    "week_of": string,
    "subject_line": string,
    "what_we_learned": string,
    "why_it_matters": string,
    "try_at_home": [string, string, string],
    "coming_up_next": string,
    "closing": string
  }
}

Rules:
- "subject_line": catchy 1-line email subject, e.g. "🏃 This week in PE: Teamwork on the field!"
- "what_we_learned": 2-3 sentences describing the lesson in plain language. Name the activity.
- "why_it_matters": 1-2 sentences on the real-world skill or benefit for the child.
- "try_at_home": exactly 3 specific, concrete suggestions a family can do at home — tied to the lesson. Age-appropriate, no equipment required unless very common.
- "coming_up_next": 1 sentence teasing the next lesson or unit (keep vague if unknown — e.g. "Next week we'll continue building on these skills with a new challenge!").
- "closing": 1 warm sentence from the teacher. First person. Friendly, not formal.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Write a family newsletter for this lesson:

Subject: ${subject} | Grade(s): ${gradeBands.join(', ')}
Lesson title: ${lessonObject.title ?? ''}
Week of: ${weekOf || 'this week'}

What happened in class:
- Warm-up: ${lessonObject.warm_up ?? 'Not specified'}
- Main activity: ${lessonObject.fitness_activities || lessonObject.whole_group_instruction || ''}
- Closure: ${lessonObject.closure ?? ''}

Learning goal (teacher language): ${
    Object.values(lessonObject.learning_targets ?? {}).join(' | ') || 'Build skills and have fun.'
  }

Return the JSON object now.`;

  return { system, user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("familyNewsletter", lessonObject.subject) };
}
