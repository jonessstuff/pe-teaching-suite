/**
 * Builds the system + user prompt for poster generation.
 *
 * The AI's job is purely content extraction: pick the single most
 * important skill/cue from the lesson, distill it into a coaching
 * mantra, and write 3–4 short sequential steps. All visual decisions
 * live in PosterRenderer on the client.
 */
export function buildPosterPrompt({
  title,
  unit,
  subject,
  grade_bands,
  skill_focus,
  learning_targets,
  whole_group_instruction,
  independent_practice,
  equipment_needed,
}) {
  const gradeStr = (grade_bands ?? [])
    .map((g) => (g === 0 ? 'K' : String(g)))
    .join('/')

  const skillFocusStr = (skill_focus ?? []).join(', ')
  const firstTarget = Object.values(learning_targets ?? {})[0] ?? ''

  // Send the most instructionally rich fields; trim to avoid token waste
  const instructionBlock = [
    whole_group_instruction ?? '',
    independent_practice ?? '',
  ]
    .join('\n\n')
    .slice(0, 1200)

  const system = `You are a PE curriculum designer creating content for a printable classroom wall poster. Your job is to extract the single most teachable skill from a lesson and distill it into clear, visual coaching content.

The poster has three content zones:
1. A skill cue phrase — one bold all-caps coaching mantra (≤8 words) that captures the most important thing students should remember and feel. Think locker-room cue, not textbook definition. Example: "STEP AND SWING THROUGH THE BALL"
2. Numbered steps — 3 or 4 sequential action cues (≤10 words each, start with an action verb) that break the technique into concrete, physical steps a student can follow. These must be specific to this lesson's skill, not generic advice.
3. Equipment list — pass through from the lesson data, abbreviated to the core items only.

Rules:
- NO filler like "Have fun", "Work together", "Be safe" — every word must earn its place
- Steps must read like a coach talking directly to a student during the activity
- If the lesson has stations, pick the central station's skill — not a mashup of all stations
- Keep language simple enough for the grade level

Respond ONLY with valid JSON. No markdown, no text before or after.
{
  "title": string,
  "skill_cue": string,
  "steps": [{ "number": integer, "text": string }],
  "equipment": string[]
}`

  const user = `Create poster content for this lesson:

Title: ${title ?? ''}
Subject: ${subject ?? 'PE'}
Grade: ${gradeStr}
Unit: ${unit ?? ''}
Skill focus: ${skillFocusStr}
Learning target: ${firstTarget}
Equipment: ${(equipment_needed ?? []).join(', ')}

Lesson instruction:
${instructionBlock}

Extract the single most central skill from this lesson. Write a coaching cue phrase and 3–4 steps a student could follow to execute it correctly. Be specific to THIS skill, not generic advice.`

  return { system, user }
}
