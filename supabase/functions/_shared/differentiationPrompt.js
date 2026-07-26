import { serializeLessonForTools } from "./lessonSummary.js"
import { toolDirective } from "./toolSubjectDirectives.js"
const PROFILE_DESCRIPTIONS = {
  advanced: 'Advanced / Gifted — students who have mastered grade-level content and need extension, complexity, and independent challenge',
  below_grade: 'Below Grade Level — students working below grade expectations who need scaffolding, reduced complexity, and additional support',
  sensory: 'Sensory / Sensory Processing Differences — students with sensory sensitivities (auditory, tactile, visual) or sensory-seeking behaviors who need environmental and instructional modifications',
  ell: 'English Language Learners — students acquiring English who need visual supports, simplified language, vocabulary scaffolding, and sentence frames',
  physical: 'Physical Modifications — students with physical disabilities, limited mobility, or motor differences who need adapted movements, equipment, or participation structures',
};

export function buildDifferentiationPrompt(lessonObject, differentiationType) {
  const profile = PROFILE_DESCRIPTIONS[differentiationType] ?? differentiationType;
  const subject = lessonObject.subject ?? 'PE';
  const gradeBands = (lessonObject.grade_bands ?? []).map(g => g === 0 ? 'K' : String(g));

  const system = `You are a special education and differentiation specialist adapting a ${subject} lesson for a specific learner profile.

Return ONLY a single JSON object with this exact schema:
{
  "differentiation": {
    "${differentiationType}": {
      "label": string,
      "warm_up": string,
      "main_activity": string,
      "materials": string,
      "assessment": string,
      "notes": string
    }
  }
}

Rules:
- "label": short display name for this profile, e.g. "Advanced / Gifted"
- Each field describes HOW to modify that phase — not a rewrite of the whole lesson. Be specific and actionable.
- "warm_up": 2-3 sentences on how to adapt the warm-up for this profile.
- "main_activity": 3-4 sentences. The most important modifications. Reference specific moments in the lesson.
- "materials": any additional or substitute materials/equipment needed (or "No additional materials needed").
- "assessment": how to assess this learner differently — what to look for, how to adjust success criteria.
- "notes": 1-2 sentences of additional implementation tips for the teacher.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Differentiate this lesson for: ${profile}

Title: ${lessonObject.title ?? ''}
Subject: ${subject} | Grade(s): ${gradeBands.join(', ')}
Duration: ${lessonObject.duration_minutes ?? 45} min

Lesson overview:
- Warm-up: ${lessonObject.warm_up ?? ''}
- Main activity: ${lessonObject.fitness_activities || lessonObject.whole_group_instruction || ''}
- Closure: ${lessonObject.closure ?? ''}
- Equipment: ${(lessonObject.equipment_needed ?? []).join(', ') || 'not specified'}

Learning targets: ${Object.values(lessonObject.learning_targets ?? {}).join(' | ') || ''}

Return the JSON object now.`;

  return { system, user: user + `\n\nFULL LESSON DETAIL (authoritative source of truth for this lesson):\n${serializeLessonForTools(lessonObject)}` + toolDirective("differentiation", lessonObject.subject) };
}
