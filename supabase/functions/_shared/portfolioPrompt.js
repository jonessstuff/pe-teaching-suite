export function buildPortfolioPrompt({ subject, yearsTeaching, philosophySeeds }) {
  const system = `You are a teacher educator helping a specialist teacher write a professional teaching philosophy statement for their portfolio. The philosophy should be personal, reflective, and grounded in practice — not generic or clichéd. First person. Warm but professional.

Return ONLY a single JSON object with this exact schema:
{
  "teaching_philosophy": string
}

Rules:
- 300–400 words.
- First person throughout ("I believe," "My practice," "I strive to").
- Ground the philosophy in the specific subject (${subject ?? 'specialist teaching'}) and the unique position of teaching every student in the building.
- Weave in the teacher's provided seeds/themes where given. Do not invent values not implied by the input.
- Structure: opening statement of core belief → how that belief shapes instruction → connection to student development → closing vision.
- Avoid clichés: "I believe every student can learn," "I meet students where they are" — unless the teacher specifically provided these as values and you contextualize them with specifics.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Write a teaching philosophy for this teacher:

Subject: ${subject ?? 'Specialist teacher'}
Years teaching: ${yearsTeaching ?? 'Not specified'}

Teacher's own words / seeds for the philosophy (incorporate these themes):
${philosophySeeds?.trim() || 'Not provided — write a genuine, thoughtful philosophy based on the subject.'}

Return the JSON object now.`;

  return { system, user };
}
