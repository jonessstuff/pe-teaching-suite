// Two distinct fitness-assessment models — the picker's testName selects which:
//
// FitnessGram (Presidential Youth Fitness Program): the health-based model
// adopted federally in 2012. Four HEALTH-RELATED fitness areas measured against
// criterion-referenced Healthy Fitness Zone (HFZ) standards — not competitive,
// health-data framed. Still the operative/mandated standard in many states
// (CA, TX, etc.), so it remains the default.
const FITNESSGRAM_COMPONENTS = {
  cardiovascular: { name: 'Cardiovascular Endurance', test: 'PACER / 1-Mile Run', ref: 'Healthy Fitness Zone targets from FITNESSGRAM (varies by age/sex)' },
  muscular: { name: 'Muscular Strength & Endurance', test: 'Curl-up / Push-up', ref: 'FITNESSGRAM: Curl-up HFZ 20-35 for age 10; Push-up HFZ 7-15 for age 10' },
  flexibility: { name: 'Flexibility', test: 'Trunk Lift / Back-Saver Sit-and-Reach', ref: 'FITNESSGRAM: Sit-and-reach HFZ ≥ 8 inches for most ages' },
  body_composition: { name: 'Body Composition', test: 'BMI / Skinfold Measurement', ref: 'FITNESSGRAM: HFZ varies by age/sex; emphasize health-based framing' },
};

// Traditional Presidential Fitness Test (the "President's Challenge" format used
// through 2012), revived by the July 31, 2025 executive order. It is
// NORM-REFERENCED against national percentiles, with the Presidential Physical
// Fitness Award at the 85th percentile on all events and the National Physical
// Fitness Award at the 50th. IMPORTANT: the 2025-revived program's OFFICIAL
// protocols, standards, and award criteria are not finalized/published yet — so
// this uses the historical President's Challenge events and norms as the closest
// accurate reference and every generated lesson flags that official standards
// are pending. Note body composition is NOT a traditional Presidential event.
const PRESIDENTIAL_COMPONENTS = {
  cardiovascular: { name: 'Cardiovascular Endurance', test: 'One-Mile Run (½-mile for ages 6–7)', ref: "President's Challenge national percentile norms — Presidential Award = 85th percentile, National Award = 50th (2025-revised standards pending)" },
  muscular: { name: 'Muscular Strength & Endurance', test: 'Curl-ups and Pull-ups (right-angle push-ups or flexed-arm hang as alternates); Shuttle Run for speed/agility', ref: "President's Challenge national percentile norms — Presidential Award = 85th percentile, National Award = 50th (2025-revised standards pending)" },
  flexibility: { name: 'Flexibility', test: 'V-Sit Reach (or Sit-and-Reach)', ref: "President's Challenge national percentile norms — Presidential Award = 85th percentile, National Award = 50th (2025-revised standards pending)" },
  body_composition: { name: 'Body Composition', test: 'Not part of the traditional Presidential Fitness Test', ref: "The traditional President's Challenge did NOT assess body composition; if body-composition context is needed, use the health-based FITNESSGRAM framing instead" },
};

export function buildFitnessTestPrepPrompt({ gradeBands, testName, component, state, classSize, duration }) {
  const gradesStr = (gradeBands ?? [5]).map(g => g === 0 ? 'K' : String(g)).join(', ');
  const isPresidential = String(testName ?? '').toLowerCase().startsWith('presid');
  const map = isPresidential ? PRESIDENTIAL_COMPONENTS : FITNESSGRAM_COMPONENTS;
  const comp = map[component] ?? { name: component, test: testName, ref: '' };

  // Model-specific framing. FitnessGram is criterion-referenced/health-based;
  // the Presidential Test is norm-referenced/award-based — the lesson must be
  // honest about which, rather than dressing one up as the other.
  const modelFraming = isPresidential
    ? `This lesson prepares students for the TRADITIONAL, event-based PRESIDENTIAL FITNESS TEST (the President's Challenge format revived by the July 31, 2025 executive order). This model is NORM-REFERENCED: students are scored against national percentile norms, with the Presidential Physical Fitness Award at the 85th percentile (all events) and the National Physical Fitness Award at the 50th. Teach the specific event and its technique, let students practice and track a personal best, and frame award benchmarks as a goal to work toward — while genuinely supporting students who are far from the thresholds (emphasize effort, personal improvement, and participation, never public ranking).
- CRITICAL ACCURACY RULE: The 2025-revived program's OFFICIAL protocols, cut scores, and award criteria have NOT been finalized or published. Do NOT invent specific 2025 numeric standards. Use the historical President's Challenge events and percentile framework, and state plainly that official updated standards are still pending.`
    : `This lesson prepares students for FITNESSGRAM (the Presidential Youth Fitness Program's health-based assessment). This model is CRITERION-REFERENCED against Healthy Fitness Zone (HFZ) standards — it is NOT a competition and NOT norm-ranked. Frame results as personal health data, keep it trauma-informed and supportive, and help each student aim for their own Healthy Fitness Zone.`;

  const refLabel = isPresidential ? 'Percentile / award reference' : 'HFZ Reference';

  const system = `You are a PE specialist creating a lesson designed to prepare students for fitness testing. The lesson builds understanding of WHY the test matters, teaches the proper technique, gives practice opportunities, and helps students set personal goals.

${modelFraming}

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
- Lesson must be grade-appropriate. Include specific technique cues for the test event/component named below.
- "hfz_reference": include the reference values given below for context (${refLabel}).
- "teacher_notes": privacy considerations, how to create a safe/supportive environment, and how to handle students who struggle. ${isPresidential ? 'The FIRST sentence of teacher_notes MUST state: "This lesson reflects the traditional Presidential Fitness Test revived by the July 2025 executive order; the program\'s official updated standards and award criteria are still being finalized, so it uses the historical President\'s Challenge events and national percentile norms."' : 'Reinforce the health-based, non-competitive framing.'}
- No markdown fences, no commentary — only the JSON object.`;

  const user = `Create a fitness test prep lesson:

Grade(s): ${gradesStr}
Assessment model: ${isPresidential ? 'Traditional Presidential Fitness Test (event/percentile-based, 2025 revival)' : (testName || 'FitnessGram (health-based)')}
Test / event: ${comp.test}
Component: ${comp.name}
Duration: ${duration ?? 45} minutes
Class size: ${classSize ?? 28}
State: ${state ?? 'Not specified'}
${refLabel}: ${comp.ref}

Return the JSON object now.`;

  return { system, user };
}
