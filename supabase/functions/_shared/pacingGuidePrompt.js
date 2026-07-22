// Coerce a free-text field to a trimmed string, tolerating non-string inputs
// (e.g. an array of holidays, null, or a number) so a bad type can't crash the
// function with "x?.trim is not a function".
function asText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.filter(Boolean).join(', ').trim();
  if (value == null) return '';
  return String(value).trim();
}

export function buildPacingGuidePrompt({ subject, grade, state, quarterIndex, totalQuarters, schoolYearStart, schoolYearEnd, daysPerWeek, breaks, topics, previousQuarters }) {
  const gradeLabel = grade === 0 ? 'K' : String(grade);
  const quarterLabel = `Q${quarterIndex + 1}`;

  const datesText = schoolYearStart && schoolYearEnd
    ? `School year: ${schoolYearStart} to ${schoolYearEnd}`
    : 'School year dates not specified';

  const priorContext = previousQuarters?.length > 0
    ? `\nQuarters already generated (avoid repeating units):\n${previousQuarters.map((q, i) => `Q${i + 1}: ${q.units.map(u => u.title).join(', ')}`).join('\n')}`
    : '';

  const system = `You are a curriculum specialist creating a single quarter of a pacing guide for ${subject} in ${state ?? 'the United States'}.

Return ONLY a single JSON object with this exact schema:
{
  "quarter": {
    "label": "${quarterLabel}",
    "date_range": string,
    "total_sessions": number,
    "units": [
      {
        "title": string,
        "sessions": number,
        "week_range": string,
        "standards": [string],
        "key_assessment": string,
        "description": string
      }
    ]
  }
}

Rules:
- Calculate total_sessions from the quarter's weeks × daysPerWeek, minus days lost to breaks within this quarter.
- 3–5 units per quarter. Units should be logically sequenced and build on each other.
- "sessions": how many class sessions this unit spans. All units' sessions must sum to total_sessions.
- "week_range": e.g. "Weeks 1–3" or "Weeks 12–15"
- "standards": 1-3 real, grade-appropriate ${subject} standards (SHAPE America for PE, NCCAS for Art, etc.)
- "key_assessment": the primary summative or formative assessment for this unit (1 sentence)
- "description": 2-3 sentences on what students will learn and do in this unit
- Scope and sequence should be developmentally appropriate for grade ${gradeLabel}
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Generate the pacing guide for ${quarterLabel}:

Subject: ${subject}
Grade: ${gradeLabel}
State: ${state ?? 'Not specified'}
${datesText}
Days per week: ${daysPerWeek ?? 5}
Known breaks/holidays in this quarter: ${asText(breaks) || 'None specified'}

Teacher's requested topics/units for this quarter (incorporate if relevant):
${asText(topics) || 'Not specified — use your curriculum expertise for this grade/subject.'}
${priorContext}

Return the JSON object now.`;

  return { system, user };
}
