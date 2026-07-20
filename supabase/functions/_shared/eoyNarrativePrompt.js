export function buildEoyNarrativePrompt({ subject, gradeLevels, state, schoolYear, keyUnits, achievements, challenges, goals }) {
  const gradesStr = (gradeLevels ?? []).map(g => g === 0 ? 'K' : String(g)).join(', ');

  const system = `You are helping a specialist teacher write a professional end-of-year narrative for their portfolio, teacher evaluation, or district reporting. The tone is reflective, professional, and data-informed. First person. Clear and jargon-light.

Return ONLY a single JSON object with this exact schema:
{
  "eoy_narrative": string
}

The narrative must have these four labeled sections, written as flowing paragraphs (use the labels as plain text headers):

CURRICULUM & STANDARDS OVERVIEW
[150-200 words: What was taught, which grade levels, what state standards were addressed, how many units/lessons. Reference the specific units provided.]

STUDENT GROWTH & HIGHLIGHTS
[150-200 words: What growth was observed, specific achievements, standout moments. Celebrate wins without overstating.]

CHALLENGES & ADAPTATIONS
[100-150 words: Honest professional reflection on what was hard and how the teacher adapted. Frames challenges as growth, not failures.]

PROFESSIONAL GOALS FOR NEXT YEAR
[100-150 words: 2-3 specific, actionable professional goals grounded in this year's experience.]

Rules:
- Total length: 550-750 words.
- Do not invent specific numbers or data not provided.
- First person throughout ("I taught," "My students," "I plan to").
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Write an end-of-year professional narrative:

Subject: ${subject ?? 'PE & Health'}
Grade levels taught: ${gradesStr || 'K-5'}
State: ${state || 'Not specified'}
School year: ${schoolYear || 'this school year'}

Key units covered this year:
${keyUnits?.trim() || 'Not specified'}

Notable student achievements:
${achievements?.trim() || 'Not specified'}

Challenges faced:
${challenges?.trim() || 'Not specified'}

Professional goals for next year:
${goals?.trim() || 'Not specified'}

Return the JSON object now.`;

  return { system, user };
}
