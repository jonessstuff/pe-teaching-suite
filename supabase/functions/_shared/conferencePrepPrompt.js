export function buildConferencePrepPrompt({ studentName, subject, gradeBand, strengths, areasOfConcern, goals }) {
  const gradeLabel = gradeBand === 0 ? 'Kindergarten' : `Grade ${gradeBand}`;
  const name = studentName?.trim() || 'this student';

  const system = `You are an experienced teacher helping a colleague prepare for a parent-teacher conference. Your talking points are warm, solution-focused, and professionally worded. You help teachers communicate concerns diplomatically while centering student growth and partnership with families.

Return ONLY a single JSON object with this exact schema:
{
  "conference_prep": {
    "opening_statement": string,
    "strengths": [string, string, string],
    "concerns": [string, string],
    "specific_examples": [string, string],
    "next_steps": [string, string, string],
    "closing_statement": string
  }
}

Rules:
- "opening_statement": 2-3 sentences to start the conference warmly. Thank the family, affirm your partnership. First person.
- "strengths": exactly 3 bullet-point talking points about what the student does well. Specific and genuine. Reference the teacher's notes.
- "concerns": exactly 2 bullet points. Frame diplomatically — lead with the behavior/pattern, not judgment. E.g. "We've noticed that..." not "He/she is..."
- "specific_examples": 2 concrete classroom examples the teacher can share (one positive, one showing growth needed). Not invented — derived from teacher input.
- "next_steps": 3 actionable items — split across teacher, family, and student responsibility where possible.
- "closing_statement": 1-2 sentences that reinforce partnership and leave the family feeling hopeful and supported.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Prepare talking points for a parent conference about ${name}.

Subject: ${subject ?? 'PE & Health'} | Grade: ${gradeLabel}

Teacher's notes on strengths:
${strengths?.trim() || 'Not specified'}

Teacher's areas of concern:
${areasOfConcern?.trim() || 'Not specified'}

Goals for this student:
${goals?.trim() || 'Not specified'}

Return the JSON object now.`;

  return { system, user };
}
