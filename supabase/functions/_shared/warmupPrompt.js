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

  const system = `You are a ${subject} specialist teacher generating WARM-UP / BELL-RINGER activities that students START AND RUN COMPLETELY ON THEIR OWN the moment they walk in — WHILE THE TEACHER IS TAKING ATTENDANCE and is NOT available to lead, call moves, or run the activity. Self-directed independence is the entire point of this tool.

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

CRITICAL — every warm-up MUST be genuinely SELF-DIRECTED:
- STARTABLE FROM ONE POSTED INSTRUCTION: a student reads it on the board / a slide / a task card and begins IMMEDIATELY, with NO teacher explanation, demo, or "go" signal.
- STUDENT-PACED & SELF-REGULATING: students manage their own reps, rounds, and TRANSITIONS — e.g. "repeat until the warm-up music stops", "do 3 rounds at your own pace", "when you finish one, start the next". NEVER depend on the teacher to call out moves, blow a whistle to rotate, assign roles/taggers, or run a call-and-response — the teacher is doing attendance and cannot lead.
- Self-organizing: if partners/groups are used, students form them on their own; no teacher setup required.
- Safe to do WITHOUT direct supervision, and appropriate for ${gradePhrase}.

Rules:
- Generate 6-8 options that vary MEANINGFULLY in format (e.g. an independent locomotor routine, a self-paced station/task-card circuit, a solo stretch/yoga sequence, a written/thinking bell-ringer, a repeat-until-timer challenge) so the teacher has genuine choice — no near-duplicates. If an activity would normally be teacher-led, REDESIGN it to be self-start (a posted routine or self-checking task card) rather than dropping it.
- Each warm-up should take approximately ${duration} minutes and be self-timed by students.
- Equipment is limited to what is available — do not invent equipment not in the list.
- "description": 3-4 sentences written as the STUDENT-FACING directions students read and follow on their own (what to do first, how to keep going, and how they know when to stop) — NOT instructions for a teacher to run it.
- "equipment_needed": list only items from the available equipment, or empty array if none needed.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Generate 6-8 self-directed warm-up options students can start and run on their own (teacher is taking attendance):

Subject: ${subject}
Grade(s): ${gradeLabel}
Duration: ${duration} minutes per warm-up
Available equipment: ${equipmentStr || 'none'}

Return the JSON object now.`;

  return { system, user: user + toolDirective("warmup", subject) };
}
