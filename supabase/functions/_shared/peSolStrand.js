/**
 * Deterministic Virginia 2022 PE SOL strand classifier.
 *
 * Why this exists: the model cannot reliably NAME the 2022 Virginia PE SOL
 * strands (it confabulates names even when handed the exact list, and the
 * schema/enum path in our Anthropic helper is a no-op). It CAN categorize a
 * lesson's content reliably — so we assign the strand in code from the lesson's
 * title + skill_focus, guaranteeing one of the five official 2022 strand names.
 *
 * Used as a server-side post-step in generate-lesson for Virginia PE lessons,
 * and it mirrors the logic used for the 2026-08 backfill of legacy lessons, so
 * old and new PE lessons carry identical, consistent strand identification.
 *
 * Numeric codes stay HEDGED: the exact 2022 code/format must be verified against
 * the official framework, so `code` is the strand NAME and `text` carries a
 * verify note rather than a guessed number.
 */

export const VA_2022_STRANDS = [
  "Skilled Movement",
  "Movement Principles and Concepts",
  "Personal Fitness",
  "Responsible Behaviors",
  "Physically Active Lifestyle",
];

/**
 * Classify a lesson into ONE 2022 Virginia PE SOL strand by content.
 * Order matters: fitness and skill signals win over an incidental cooperative
 * word (a lesson that TEACHES a skill is Skilled Movement even if it mentions a
 * cooperative element; only a lesson PRIMARILY about behavior is Responsible
 * Behaviors). Defaults to Skilled Movement — the safe default for a PE lesson.
 *
 * @param {{title?: string, skill_focus?: string[]}} lessonObject
 * @returns {string} one of VA_2022_STRANDS
 */
export function classifyPeStrand(lessonObject) {
  const skills = Array.isArray(lessonObject?.skill_focus) ? lessonObject.skill_focus : [];
  const t = `${lessonObject?.title ?? ""} ${skills.join(" ")}`.toLowerCase();
  const has = (arr) => arr.some((k) => t.includes(k));

  const FITNESS = ["fitness", "aerobic", "endurance", "pacer", "curl-up", "curl up", "push-up", "push up", "fitnessgram", "cardiovascular", "muscular", "mile run", "sit-and-reach", "wellness", "heart rate", "flexibility"];
  const SKILL = ["serve", "serving", "throw", "dribbl", "pass", "grip", "stance", "kick", "strik", "catch", "toss", "ball", "motor", "locomotor", "manipulative", "coordination", "footwork", "dink", "backhand", "forehand", "fielding", "base run", "skill", "racket", "groundstroke", "rally"];
  const BEHAVIOR = ["cooperat", "teamwork", "sportsmanship", "conflict", "team-building", "responsib"];
  const PRINCIPLES = ["tactic", "strategy", "biomechan", "movement principle", "movement concept"];
  const LIFESTYLE = ["lifelong", "lifetime", "outside of class", "physical activity plan", "recreation", "enjoyment of"];

  if (has(FITNESS)) return "Personal Fitness";
  if (t.includes("yoga")) return "Personal Fitness";
  if (has(SKILL)) return "Skilled Movement";
  if (has(BEHAVIOR)) return "Responsible Behaviors";
  if (has(PRINCIPLES)) return "Movement Principles and Concepts";
  if (has(LIFESTYLE)) return "Physically Active Lifestyle";
  return "Skilled Movement";
}

/**
 * Build a corrected `standards` array (one entry per grade band) for a Virginia
 * PE lesson, using the deterministic strand + a hedged, verify-flagged text.
 *
 * @param {{title?: string, skill_focus?: string[], grade_bands?: number[]}} lessonObject
 * @returns {Array<{grade:number, code:string, text:string}>}
 */
export function classifiedPeStandards(lessonObject) {
  const strand = classifyPeStrand(lessonObject);
  const grades = Array.isArray(lessonObject?.grade_bands) ? lessonObject.grade_bands : [];
  return grades.map((grade) => ({
    grade,
    code: strand,
    text: `Aligns to the ${strand} strand of the 2022 Virginia Physical Education Standards of Learning (verify the exact standard code against the official framework).`,
  }));
}
