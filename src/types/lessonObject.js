/**
 * Core LessonObject schema.
 *
 * ONE AI call per lesson populates this structure. Every output
 * (Plan Book export, sub plan, warm-up card, station signs, PPT, quiz,
 * parent letter, curriculum map row) is a template/formatter over this
 * object — no additional AI calls.
 *
 * This file documents the shape via JSDoc typedefs so editors get
 * autocomplete/type-checking without requiring a TS build step.
 * If the project later migrates to TypeScript, these typedefs map
 * directly to interfaces.
 */

/**
 * @typedef {Object} StandardEntry
 * @property {number} grade
 * @property {string} code  // full SOL code
 * @property {string} text  // full SOL text
 */

/**
 * @typedef {"PE"|"Health"|"Family Life"|"Driver's Ed"|"Strength & Conditioning"} SubjectArea
 */

/**
 * @typedef {"formative"|"summative"|"self-assessment"} AssessmentType
 */

/**
 * @typedef {Object} LessonObject
 *
 * // --- Metadata ---
 * @property {string} title                 // e.g. "Kickball Day 1"
 * @property {number[]} grade_bands          // e.g. [6, 7, 8]
 * @property {string} unit                   // e.g. "Striking & Fielding"
 * @property {SubjectArea} subject
 * @property {number} duration_minutes
 * @property {number} class_size
 * @property {StandardEntry[]} standards     // one set per grade band
 *
 * // --- Objectives (per grade band) ---
 * @property {Object.<number, string>} learning_targets     // "Today I will..."
 * @property {Object.<number, string[]>} success_criteria   // 3 bullets typical
 * @property {string[]} skill_focus
 * @property {AssessmentType} assessment_type
 *
 * // --- Equipment & Space ---
 * @property {string[]} equipment_needed         // e.g. "Kickballs 2-3", "Cones (bases/stations)"
 * @property {string[]} equipment_alternatives
 * @property {string} location                   // e.g. "Baseball/softball field"
 * @property {string} setup_diagram               // text/ASCII, becomes visual later
 *
 * // --- Lesson Flow (shared across grade bands) ---
 * @property {string} warm_up
 * @property {string} fitness_activities
 * @property {string} whole_group_instruction
 * @property {string} independent_practice
 * @property {string} closure
 *
 * // --- Differentiation (per grade band) ---
 * @property {Object.<number, string>} modifications
 *
 * // --- Vocabulary ---
 * @property {string[]} known_vocabulary   // "Words they should know"
 * @property {string[]} new_vocabulary     // "Words they will learn"
 *
 * // --- Classroom Management (added value beyond Plan Book) ---
 * @property {string[]} routines
 * @property {string[]} behavior_notes
 * @property {string[]} safety_notes
 *
 * // --- Sub Plan Layer (derived/generated, optional until sub plan is requested) ---
 * @property {string} [sub_friendly_instructions]
 * @property {string} [sub_script]
 * @property {string} [sub_management_script]
 * @property {string} [sub_diagram]
 *
 * // --- Quiz Layer (derived/generated, optional until quiz is requested) ---
 * @property {Object.<string, { grade: number, questions: Array<{ type: string, question: string, options?: string[], answer: string }> }>} [quiz_questions]
 *
 * // --- Supplemental Resources ---
 * @property {string[]} suggested_video_searches  // YouTube search queries relevant to the lesson topic/vocabulary
 *
 * // --- Weather Alternative Layer (derived/generated, optional until weather alt is requested) ---
 * @property {string} [weather_alt_warm_up]
 * @property {string} [weather_alt_fitness_activities]
 * @property {string} [weather_alt_whole_group_instruction]
 * @property {string} [weather_alt_independent_practice]
 * @property {string} [weather_alt_closure]
 * @property {string} [weather_alt_location]
 * @property {string[]} [weather_alt_equipment_needed]
 * @property {string} [weather_alt_setup_diagram]
 * @property {string} [weather_alt_notes]
 *
 * // --- Parent Note Layer (derived/generated, optional until parent note is requested) ---
 * @property {string} [parent_note_intro]
 * @property {string[]} [parent_note_skills]
 * @property {Array<{word: string, definition: string}>} [parent_note_vocabulary]
 * @property {string[]} [parent_note_ask]
 *
 * // --- Observation Summary Layer (derived/generated, optional until observation prep is requested) ---
 * @property {string} [obs_overview]           // 2-3 sentence lesson arc summary for evaluator
 * @property {string[]} [obs_differentiation]  // 2-3 differentiation highlights in evaluator language
 * @property {string[]} [obs_look_for]         // 2-3 specific observable indicators
 */

/**
 * Returns a blank LessonObject with all fields initialized to empty
 * values. Useful for forms and as a safe default before AI generation
 * completes.
 *
 * @returns {LessonObject}
 */
export function createEmptyLessonObject() {
  return {
    title: "",
    grade_bands: [],
    unit: "",
    subject: "PE",
    duration_minutes: 45,
    class_size: 0,
    standards: [],

    learning_targets: {},
    success_criteria: {},
    skill_focus: [],
    assessment_type: "formative",

    equipment_needed: [],
    equipment_alternatives: [],
    location: "",
    setup_diagram: "",

    warm_up: "",
    fitness_activities: "",
    whole_group_instruction: "",
    independent_practice: "",
    closure: "",

    modifications: {},

    known_vocabulary: [],
    new_vocabulary: [],

    routines: [],
    behavior_notes: [],
    safety_notes: [],

    sub_friendly_instructions: "",
    sub_script: "",
    sub_management_script: "",
    sub_diagram: "",

    quiz_questions: {},

    suggested_video_searches: [],

    weather_alt_warm_up: "",
    weather_alt_fitness_activities: "",
    weather_alt_whole_group_instruction: "",
    weather_alt_independent_practice: "",
    weather_alt_closure: "",
    weather_alt_location: "",
    weather_alt_equipment_needed: [],
    weather_alt_setup_diagram: "",
    weather_alt_notes: "",

    parent_note_intro: "",
    parent_note_skills: [],
    parent_note_vocabulary: [],
    parent_note_ask: [],

    obs_overview: "",
    obs_differentiation: [],
    obs_look_for: [],
  };
}

export const SUBJECT_AREAS = ["PE", "Health", "Family Life", "Driver's Ed", "Strength & Conditioning", "Library/Media", "Art", "Music", "Adaptive PE", "STEM", "Theater", "Dance", "Elementary Technology", "World Languages", "After-School Clubs", "JROTC", "CTE", "Gifted & Talented", "Reading Specialists", "Math Specialists", "Test Prep", "Makerspace", "Special Education", "ESL/ELL Specialist", "School Counselors", "Speech-Language Pathologists", "Occupational Therapists", "Physical Therapists", "Teacher of the Visually Impaired", "Teacher of the Deaf & Hard of Hearing", "Student Support Team Activities", "Early Childhood", "Early Childhood Special Education", "Intervention Planning", "Staff PD & Meeting Planning", "Instructional Coaching"];
export const ASSESSMENT_TYPES = ["formative", "summative", "self-assessment"];
export function gradeLabel(grade) {
  return grade === 0 ? "K" : String(grade);
}

export function gradeBandsLabel(gradeBands) {
  return (gradeBands ?? []).map(gradeLabel).join("/");
}
