const TEST_COMPONENTS = {
  cardiovascular: { name: 'Cardiovascular Endurance', test: 'PACER / 1-Mile Run', hfz: 'Healthy Fitness Zone targets from FITNESSGRAM (varies by age/sex)' },
  muscular: { name: 'Muscular Strength & Endurance', test: 'Curl-up / Push-up', hfz: 'FITNESSGRAM: Curl-up HFZ 20-35 for age 10; Push-up HFZ 7-15 for age 10' },
  flexibility: { name: 'Flexibility', test: 'Trunk Lift / Back-Saver Sit-and-Reach', hfz: 'FITNESSGRAM: Sit-and-reach HFZ ≥ 8 inches for most ages' },
  body_composition: { name: 'Body Composition', test: 'BMI / Skinfold Measurement', hfz: 'FITNESSGRAM: HFZ varies by age/sex; emphasize health-based framing' },
};

export function buildFitnessTestPrepPrompt({ gradeBands, testName, component, state, classSize, duration }) {
  const gradesStr = (gradeBands ?? [5]).map(g => g === 0 ? 'K' : String(g)).join(', ');
  const comp = TEST_COMPONENTS[component] ?? { name: component, test: testName, hfz: '' };

  const system = `You are a PE specialist creating a lesson designed to prepare students for fitness testing. The lesson builds understanding of WHY the test matters, teaches the proper technique, gives practice opportunities, and helps students set personal goals — all in a supportive, health-focused (not performative) way.

Return a complete lesson object as a single JSON object with this exact schema:
{
  "title": string,
  "subject": "PE & Health",
  "grade_bands": [number],
  "duration_minutes": number,
  "class_size": number,
  "lesson_type": "fitness_test_prep",
  "fitness_test": string,
  "fitness_component": string,
  "warm_up": string,
  "fitness_activities": string,
  "whole_group_instruction": string,
  "independent_practice": string,
  "closure": string,
  "equipment_needed": [string],
  "learning_targets": { "<grade>": string },
  "success_criteria": { "<grade>": [string] },
  "teacher_notes": string,
  "hfz_reference": string,
  "standards": []
}

Rules:
- Lesson must be grade-appropriate and trauma-informed — frame fitness testing as personal health data, not competition.
- Include specific technique cues for the test component.
- "hfz_reference": include the FITNESSGRAM Healthy Fitness Zone reference values for context.
- "teacher_notes": privacy considerations, how to create a safe environment, how to handle students who struggle.
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Create a fitness test prep lesson:

Grade(s): ${gradesStr}
Test: ${testName || comp.test}
Component: ${comp.name}
Duration: ${duration ?? 45} minutes
Class size: ${classSize ?? 28}
State: ${state ?? 'Not specified'}
HFZ Reference: ${comp.hfz}

Return the JSON object now.`;

  return { system, user };
}
