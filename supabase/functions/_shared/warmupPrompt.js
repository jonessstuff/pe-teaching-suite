import { toolDirective } from "./toolSubjectDirectives.js"

export function buildWarmupPrompt({ subject, gradeBand, duration, equipment }) {
  const grades = (Array.isArray(gradeBand) ? gradeBand : [gradeBand])
    .filter((g) => g !== undefined && g !== null);
  const labels = (grades.length ? grades : [5]).map((g) => (g === 0 ? 'K' : String(g)));
  const gradeLabel = labels.join(', ');
  const gradePhrase = labels.length > 1
    ? `grades ${gradeLabel} — each warm-up should work across this whole range (scalable up/down)`
    : `grade ${gradeLabel}`;
  const equipmentStr = Array.isArray(equipment) ? equipment.join(', ') : (equipment ?? '');

  const system = `You are a ${subject} specialist teacher generating warm-up activity ideas for a class. Warm-ups should immediately engage students, prepare the body and mind for the main lesson, and be manageable by any substitute teacher.

Return ONLY a single JSON object with this exact schema:
{
  "warmup_options": [
    {
      "title": string,
      "description": string,
      "duration_mins": number,
      "equipment_needed": [string]
    }
  ]
}

Rules:
- Generate 6-8 warm-up options that vary MEANINGFULLY in format (e.g., locomotor, game-based, stretching/yoga, music/rhythm-based, cooperative, focus/mindfulness) so the teacher has genuine choice — no near-duplicates.
- Each warm-up should take approximately ${duration} minutes.
- All must be appropriate for ${gradePhrase}.
- Equipment is limited to what is available — do not invent equipment not in the list.
- "description": 3-4 sentences. Include setup, how to run it, and how to signal transitions. Clear enough for a sub.
- "equipment_needed": list only items from the available equipment, or empty array if none needed.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Generate 6-8 warm-up options:

Subject: ${subject}
Grade(s): ${gradeLabel}
Duration: ${duration} minutes per warm-up
Available equipment: ${equipmentStr || 'none'}

Return the JSON object now.`;

  return { system, user: user + toolDirective("warmup", subject) };
}
