/**
 * Deno-compatible copy of the LessonObject defaults from
 * src/types/lessonObject.js. Kept in sync manually since Edge
 * Functions run in a separate Deno runtime and can't import from
 * the Vite app's src/ directory.
 *
 * @returns {import("../../../src/types/lessonObject").LessonObject}
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

    // Visual Teaching Resources (second-pass, derived). null = the pass has
    // not run; [] = it ran and correctly found nothing to build.
    visual_resources: null,
  };
}
