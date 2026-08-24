/**
 * Lesson generation prompt builder.
 *
 * This is the "moat" referenced in the build spec — the prompt and
 * content-library logic that maps raw teacher inputs to a fully
 * populated LessonObject. Lives server-side only (Edge Function),
 * never shipped to the client, never documented publicly.
 *
 * The prompt instructs the model to return ONLY JSON matching the
 * LessonObject schema (see src/types/lessonObject.js), so the
 * response can be parsed directly and stored as-is in `lesson_object`.
 */

import { resolveStateName } from "./stateNames.js";
import { udlEfDirective } from "./udlEfDirective.js";
import { mtssDirective } from "./mtssDirective.js";
import { coreActivityDirective } from "./coreActivityDirective.js";

function getSubjectGuidance(subject, stateName) {
  const isVirginia = stateName === "Virginia";
  switch (subject) {
    case "Health":
      return isVirginia
        ? "Focus on health literacy, wellness concepts, decision-making, and SOL-aligned health standards (Virginia SOL x.1.y format)."
        : `Focus on health literacy, wellness concepts, decision-making, and ${stateName} health education standards. Use the correct standard code format for ${stateName}.`;
    case "Family Life":
      return isVirginia
        ? "Focus on age-appropriate Family Life Education content per Virginia FLE curriculum guidelines, handled with sensitivity and grade-appropriate framing."
        : `Focus on age-appropriate family life and health education content per ${stateName} curriculum guidelines, handled with sensitivity and grade-appropriate framing.`;
    case "Driver's Ed":
      return isVirginia
        ? "Focus on classroom/in-car driver education content aligned to Virginia DOE Driver Education standards."
        : `Focus on classroom/in-car driver education content aligned to ${stateName} driver education standards.`;
    case "Strength & Conditioning":
      return `This is a high school weight room / strength & conditioning class. Follow NSCA (National Strength and Conditioning Association) youth resistance training guidelines.

FIELD USAGE FOR STRENGTH & CONDITIONING:
- warm_up: Dynamic warm-up (5–10 min) — movement prep, joint mobility, muscle activation. Name specific exercises with sets/reps (e.g. "Leg swings 2×10 each side", "World's greatest stretch 5 reps each side", "Band pull-aparts 2×15"). No static stretching in warm-up.
- whole_group_instruction: Technique instruction and spotting protocols (5–10 min). For each main lift in today's session: describe setup/stance/grip, coaching cues (2–3 per lift), common errors to watch for, and spotting responsibilities/hand placement if applicable. Include equipment safety check (collars, rack height).
- fitness_activities: Main workout block. List exercises with sets × reps × rest format (e.g. "Goblet Squat — 3×10, 90s rest"). Include coaching cue callouts the teacher should give during sets. Group by superset or circuit if applicable. Include load guidance (e.g. "Start at bodyweight or light load; challenge on last 2 reps should be moderate").
- independent_practice: Students execute workout with teacher circulating for form checks. Describe how to run the floor: rotation cues, how teacher monitors multiple athletes simultaneously, when to intervene on form. Include progressive overload note (how to advance load/reps next session if today's target is met).
- closure: Cool-down (5 min) — static stretching targeting muscles worked. Include workout log prompt (what students should record: exercises, sets, reps, load). Include brief reflection question tied to today's focus.
- safety_notes: Include weight room safety rules (collars on all barbells, no horseplay, controlled descent, re-rack weights), and specific spotting protocols for any barbell movements in this lesson.
- standards: Align to NSCA Youth Resistance Training Position Statement principles and, where applicable, ${stateName} physical education standards for fitness/strength content. Use NSCA citation format for NSCA standards (e.g. "NSCA YRT 2009 — Principle 3: Technique before load").`;
    default: { // PE
      // Virginia adopted UPDATED PE Standards of Learning in 2022 (approved Jan 2022),
      // which use different strand names than the 2015 version. We identify the correct
      // 2022 strand by content but do NOT fabricate the numeric code — the exact 2022
      // numbering/format must be verified against the official framework.
      const peStrandGuidance = `

PE STANDARDS — VIRGINIA 2022 PE SOL, SELECT BY CONTENT (do NOT default to one strand): Virginia's CURRENT physical education standards are the 2022 SOL (approved January 2022). Use the 2022 STRAND NAMES. Read this lesson's skill_focus and its ACTUAL activities, then identify the 2022 strand that matches the lesson's PRIMARY focus:
- Motor skills & techniques — serving, dribbling, striking, throwing, catching, locomotor / non-locomotor patterns, sport/game skill execution → SKILLED MOVEMENT.
- Movement principles — biomechanics, anatomy/physiology of movement, tactics & strategy / game concepts, applying feedback to refine performance → MOVEMENT PRINCIPLES AND CONCEPTS.
- Health-related fitness — fitness testing (PACER, curl-ups, push-ups, mile run, FitnessGram), fitness components, fitness planning, training principles, monitoring intensity → PERSONAL FITNESS.
- Cooperation & behavior — teamwork, sportsmanship, respect, safety, communication, conflict resolution (e.g. cooperative games, team-building) → RESPONSIBLE BEHAVIORS.
- Valuing lifelong activity — pursuing physical activity beyond class, enjoyment / motivation, and the role of nutrition and energy in an active lifestyle → PHYSICALLY ACTIVE LIFESTYLE.
Different lessons MUST identify different strands when their content differs — a volleyball-skills lesson (Skilled Movement), a FitnessGram testing lesson (Personal Fitness), and a cooperative-games lesson (Responsible Behaviors) must NOT all get the same strand.
CODES — HEDGE, do NOT guess numbers: do NOT invent a numeric 2022 SOL code; the exact 2022 numbering and format must be verified against the official Virginia framework. Set each standard's "code" to the 2022 STRAND NAME (e.g. "Skilled Movement"), and in "text" give the competency description for this grade followed by "(verify against official Virginia 2022 PE SOL)".`;
      // Virginia-only: the 2022 VA PE SOL strand guidance must NOT be appended for
      // other states (it would make e.g. a Texas lesson cite Virginia strands).
      return isVirginia
        ? "Focus on motor skill development, game play, fitness, and Virginia's 2022 Physical Education Standards of Learning — use the 2022 strand names and terminology (see the standards guidance below), and choose the strand by content, never a single default." + peStrandGuidance
        : `Focus on motor skill development, game play, fitness, and ${stateName} physical education standards. Use the correct standard code format for ${stateName}, and choose the standard whose focus matches THIS lesson's content — never default to a single standard across different lessons.`;
    }
  }
}

/**
 * @param {Object} input
 * @param {number[]} input.gradeBands
 * @param {string} input.unit
 * @param {string} input.topic
 * @param {"PE"|"Health"|"Family Life"|"Driver's Ed"|"Strength & Conditioning"} input.subject
 * @param {string[]} input.equipment
 * @param {number} input.classSize
 * @param {number} input.durationMinutes
 * @param {string} [input.targetStandard]
 * @param {string} [input.state]           two-letter US state abbreviation, e.g. "VA"
 * @param {boolean} [input.stationsMode]   when true, structure independent_practice as rotating stations
 * @param {number} [input.stationCount]    number of stations (2-6), used when stationsMode is true
 * @param {{ name_or_initials: string, accommodation_notes: string }[]} [input.students]
 * @returns {{ system: string, user: string }}
 */
// Cross-cutting elementary lens: when the teacher enables the "Hands-On /
// Kinesthetic" toggle (K-2 / 3-5 only), this directive steers the lesson toward
// manipulatives, movement, and tactile work and away from worksheet/seatwork.
export const HANDS_ON_DIRECTIVE = `\n\nHANDS-ON / KINESTHETIC EMPHASIS (elementary): Make the PRIMARY mode of learning hands-on, kinesthetic, and movement-based — NOT worksheets or seatwork. Favor manipulatives and physical objects (counters, tiles, cards, blocks, real materials), whole-body movement and gesture, tactile exploration, sorting / building / acting-out, learning stations, and partner or group activities where students are up and doing. The MAIN activity must be concrete and physical (e.g., physical objects for counting / sorting / fraction work in math, movement- or gesture-based vocabulary and word work in reading and language, hands-on building and exploration in science, manipulating real materials otherwise). Actively STEER AWAY from paper-based independent worksheets as the core task — keep any written recording brief and secondary to the physical doing. Keep it developmentally appropriate for young learners' attention spans and motor skills.`

// Two sections required in the PE planbook, ALWAYS included for PE (core — not a
// toggle). Scoped to PE only; other subjects keep the base schema untouched.
const PE_CORE_SECTIONS_DIRECTIVE = `

REQUIRED PE SECTIONS (core — always include, not optional): In addition to all fields in the schema above, this PE lesson MUST include these two REQUIRED top-level fields, each genuinely populated:
- "instructional_practices": string[] — 3–6 items naming the specific instructional practices / teaching strategies used in THIS lesson (e.g. teacher modeling / demonstration, guided practice with feedback, checks for understanding, differentiated practice by skill level, questioning, peer feedback). Name the practice AND tie it briefly to what the teacher actually does here — grounded in the real activities, not generic.
- "evidence_of_learning": string[] — 3–5 items naming the concrete evidence of student learning the teacher collects in THIS lesson, tied to the success criteria (e.g. exit ticket naming the cues, teacher observation checklist during rotations, count of successful attempts out of 5, peer-feedback form, self-assessment). Specific and observable, not generic.`;

export function buildLessonGenerationPrompt(input) {
  const {
    gradeBands = [],
    unit = "",
    topic = "",
    subject = "PE",
    equipment = [],
    classSize = 28,
    durationMinutes = 45,
    targetStandard = "",
    state = "",
    stationsMode = false,
    stationCount = 3,
    students = [],
    includeELL = false,
    handsOn = false,
    includeUdlEf = false,
    includeMtss = false,
    coreActivityOnly = false,
  } = input;

  const stateName = resolveStateName(state);
  const subjectGuidance = getSubjectGuidance(subject, stateName);

  const system = `You are an expert ${subject} curriculum writer for ${stateName} middle/high schools, producing content that exactly matches real district Plan Book formatting conventions.

${subjectGuidance}

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — matching this exact schema:

{
  "title": string,
  "grade_bands": number[],
  "unit": string,
  "subject": "PE" | "Health" | "Family Life" | "Driver's Ed" | "Strength & Conditioning",
  "duration_minutes": number,
  "class_size": number,
  "standards": [{ "grade": number, "code": string, "text": string }],
  "learning_targets": { "<grade>": string },
  "success_criteria": { "<grade>": string[] },
  "skill_focus": string[],
  "assessment_type": "formative" | "summative" | "self-assessment",
  "equipment_needed": string[],
  "equipment_alternatives": string[],
  "location": string,
  "setup_diagram": string,
  "warm_up": string,
  "fitness_activities": string,
  "whole_group_instruction": string,
  "independent_practice": string,
  "closure": string,
  "modifications": { "<grade>": string },
  "known_vocabulary": string[],
  "new_vocabulary": string[],
  "routines": string[],
  "behavior_notes": string[],
  "safety_notes": string[],
  "sub_friendly_instructions": "",
  "sub_script": "",
  "sub_management_script": "",
  "sub_diagram": "",
  "suggested_video_searches": string[]
}

Rules:
- REQUIRED: suggested_video_searches must always contain exactly 2-3 search queries — this field should never be empty. Write specific, well-formed YouTube search queries directly relevant to this lesson's topic, skill, or vocabulary. Write queries a teacher or student could paste straight into YouTube and find useful results — not generic topic names. Examples for a nutrition lesson: "MyPlate nutrition for kids", "how to read a food label tutorial". Examples for a PE lesson on passing: "chest pass basketball technique middle school", "basketball passing drills for beginners".
- Provide one standards entry PER grade band, choosing the standard that matches THIS lesson's actual content and focus (see the subject focus above) — never reuse a generic or habitual default code across different lessons. Present an exact standard code ONLY when you are confident it matches the official ${stateName} ${subject} standards framework. If you are NOT certain of the precise strand number or substrand for a given grade, name the correct strand/competency in that standard's "text" and append '(verify against official standards)' — prefer hedging to the strand by name over emitting a guessed code as if it were definitive.
- learning_targets, success_criteria, and modifications must have one entry per grade band, keyed by the grade number as a string.
- success_criteria arrays should have exactly 3 bullets per grade band, phrased as "I can..." statements.
- learning_targets should be phrased as "Today I will..." statements.
- The lesson/instruction fields (warm_up, fitness_activities, whole_group_instruction, independent_practice, closure) are SHARED across all grade bands — write them so they work for the full range given. Format these fields with clear structure: use \\n\\n between major phases or sections (give each INTERNAL phase a descriptive header, e.g. "Setup (2 min):", "Small-group work (8 min):", "Debrief (2 min):" — do NOT open a field with a header that restates the field's own name, e.g. don't begin warm_up with "WARM-UP" or closure with "CLOSURE"; the app already labels each field) and \\n between individual steps or cues within a phase. Do NOT write one continuous paragraph — structure each field like a teacher's actual lesson notes, with named sections and numbered or sequenced steps.
- modifications should describe concrete differentiation strategies per grade band (not generic "differentiate as needed" language).
- setup_diagram should be a simple text/ASCII layout description of the space and equipment placement.
- equipment_needed should reflect realistic quantities for the given class size.
- Leave sub_friendly_instructions, sub_script, sub_management_script, and sub_diagram as empty strings — they are generated separately.
- Do not include any fields not listed in the schema above.${stationsMode ? `

STATIONS MODE: Structure the independent_practice section explicitly as ${stationCount} rotating skill stations. Label each station as STATION A, STATION B, STATION C, etc. — do NOT use "Round 1", "Round 2", or any other labeling. The rotation structure must be unambiguous. For each station: state the skill focus in the header (e.g. "STATION A — Chest Pass Technique"), describe the physical setup, describe the activity, specify rotation timing, and note any equipment needed at that station. Use \\n\\n between stations.` : ""}${students.length > 0 ? `

ACCOMMODATIONS: The following students in this class need specific accommodations. Write the standard grade-level differentiation content in the "modifications" field first, then append each student's accommodation as a clearly labeled separate line at the END of that field. Each accommodation must be specific to the actual activities in this lesson (not generic advice) and formatted exactly as:

\\n\\nACCOMMODATION — [name_or_initials]: [specific accommodation referencing the lesson activity]

Example: "\\n\\nACCOMMODATION — Jamie: during the kickball batting drill, allow Jamie to use a tee instead of a pitched ball, accommodating reduced reaction time"

Do NOT blend student accommodations into the middle of a paragraph. They must appear as distinctly labeled lines at the end of the modifications text, one per student.

Students requiring accommodations:
${students.map((s) => `- ${s.name_or_initials}: ${s.accommodation_notes}`).join("\n")}` : ""}${includeELL ? `\n\nELL ACCOMMODATIONS: This lesson will be taught to a class that includes English Language Learners. In addition to all fields in the schema above, add an "ell_accommodations" object to the JSON with these subfields:\n- language_objectives: 2–3 strings in format "Students will [language skill] in order to [content purpose]"\n- tiered_vocabulary: { tier_1: [everyday words students likely know], tier_2: [academic cross-subject vocabulary], tier_3: [content-specific vocabulary unique to this lesson] } — each value is an array of strings\n- sentence_frames: 4–6 strings, each labeled with the specific lesson context (e.g. "During partner practice: 'I noticed that you ___'", "When explaining your work: 'I chose ___ because ___'")\n- visual_supports: 4–6 specific, concrete suggestions for visual supports, gestures, or realia tied to this lesson's actual activities\n- simplified_instructions: single string — 2–3 short sentences describing the core task at a 2nd-grade reading level, no idioms, no figurative language` : ""}${handsOn ? HANDS_ON_DIRECTIVE : ""}${includeUdlEf ? udlEfDirective() : ""}${includeMtss ? mtssDirective() : ""}${(subject === "PE" || subject === "PE & Health") ? PE_CORE_SECTIONS_DIRECTIVE : ""}${coreActivityOnly ? coreActivityDirective() : ""}`;

  const user = `Generate a complete lesson with these parameters:

- Grade band(s): ${gradeBands.join(", ") || "6, 7, 8"}
- Unit: ${unit || "(infer an appropriate unit from the topic)"}
- Lesson topic/title: ${topic || "(generate an appropriate title for this unit)"}
- Subject: ${subject}
- Equipment on hand: ${equipment.length ? equipment.join(", ") : "standard PE/classroom equipment"}
- Class size: ${classSize}
- Duration: ${durationMinutes} minutes${targetStandard ? `\n- Target standard/objective: ${targetStandard} (build the lesson specifically around this standard; ensure it appears in the standards array)` : ""}

Return the JSON object now.`;

  return { system, user };
}
