const OCCASION_CONTEXT = {
  'Before holiday break': 'Students are excited and energy is high. Activities should be fun and celebratory while still engaging. Low academic pressure.',
  'Emergency sub day': 'A substitute teacher with no PE background is running the class. Activities must be extremely simple to explain, require minimal equipment, and have built-in management structures.',
  'Rainy day (indoor)': 'Class is moved indoors, likely to a gym, hallway, or classroom. Activities must work in a smaller or non-traditional space.',
  'Early release': 'Shortened class period — likely 15-30 minutes. Activities should be complete and satisfying in less time.',
  'Testing week filler': 'Students are mentally tired from standardized testing. Activities should be low-stakes, stress-relieving, and enjoyable — emphasize fun over skill development.',
  'Free choice day': 'Students have earned free time. Activities should offer choices and student agency.',
};

export function buildActivityBankPrompt({ subject, gradeBand, duration, occasion }) {
  const gradeLabel = gradeBand === 0 ? 'K' : String(gradeBand);
  const occasionContext = OCCASION_CONTEXT[occasion] ?? 'General class session.';

  const system = `You are a ${subject} specialist generating low-prep, high-engagement activity ideas. These activities must be clear enough for any substitute teacher to run successfully with minimal explanation.

Return ONLY a single JSON object with this exact schema:
{
  "activities": [
    {
      "title": string,
      "equipment": [string],
      "setup_mins": number,
      "description": string,
      "variations": string
    }
  ]
}

Rules:
- Generate exactly 5 activities.
- Each activity takes approximately ${duration} minutes total (including transition).
- Equipment must be minimal — common gym equipment only (cones, balls, hula hoops, jump ropes, poly spots). Prefer 0-2 items per activity.
- "setup_mins": realistic setup time in minutes (0-3 for sub-friendly activities).
- "description": 4-5 sentences. Include how to explain it to students, how to start/stop, safety considerations, and how to manage the space. Written so a sub can read it cold and run it immediately.
- "variations": 1-2 sentences on how to make it easier or harder.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Generate 5 ${occasion} activities:

Subject: ${subject}
Grade: ${gradeLabel}
Duration per activity: ${duration} minutes
Occasion: ${occasion}
Context: ${occasionContext}

Return the JSON object now.`;

  return { system, user };
}
