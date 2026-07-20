/**
 * Sample LessonObject — "Kickball Day 1"
 *
 * Mirrors the reference example from the build spec. Used for
 * developing/testing renderers (Plan Book, sub plan, etc.) without
 * needing a live AI generation call.
 *
 * @type {import("./lessonObject").LessonObject}
 */
export const sampleKickballLesson = {
  title: "Kickball Day 1",
  grade_bands: [6, 7, 8],
  unit: "Striking & Fielding",
  subject: "PE",
  duration_minutes: 45,
  class_size: 28,

  standards: [
    { grade: 6, code: "6.2.a", text: "Apply mature form to combination of manipulative, locomotor, and non-locomotor skills in a variety of settings." },
    { grade: 7, code: "7.2.a", text: "Demonstrate mature form in combinations of manipulative, locomotor, and non-locomotor skills in modified game and sport activities." },
    { grade: 8, code: "8.2.a", text: "Demonstrate competence in combinations of manipulative, locomotor, and non-locomotor skills in modified game and sport activities." },
  ],

  learning_targets: {
    6: "Today I will use proper kicking and fielding form to participate in a kickball game.",
    7: "Today I will apply offensive and defensive strategies while demonstrating mature kicking and throwing form.",
    8: "Today I will demonstrate consistent, game-ready striking and fielding skills while applying basic strategy.",
  },

  success_criteria: {
    6: [
      "I can kick a rolled ball using proper approach and follow-through.",
      "I can field a ground ball and make an accurate throw to a base.",
      "I can identify my role on offense and defense.",
    ],
    7: [
      "I can consistently kick for placement, not just power.",
      "I can communicate with teammates to make a fielding play.",
      "I can apply a simple offensive strategy (e.g., bunting, placement kicking).",
    ],
    8: [
      "I can demonstrate mature kicking and fielding form under game pressure.",
      "I can adjust strategy based on the defensive setup.",
      "I can officiate or self-assess a play using game rules.",
    ],
  },

  skill_focus: ["Kicking", "Fielding ground balls", "Throwing accuracy", "Base running"],
  assessment_type: "formative",

  equipment_needed: ["Kickballs (2-3)", "Cones (bases/stations)", "Pinnies (2 colors)"],
  equipment_alternatives: ["Volleyballs or playground balls if kickballs unavailable", "Poly spots if cones unavailable"],
  location: "Baseball/softball field",
  setup_diagram:
    "Diamond layout: home plate, 1st/2nd/3rd marked with cones.\n" +
    "Outfield divided into 3 zones with cones.\n" +
    "Two teams split evenly; batting order posted on whiteboard near home plate.",

  warm_up: "Dynamic stretching + light jog around the bases (3-4 min), followed by partner toss-and-catch to activate throwing arm.",
  fitness_activities: "Base-running shuttle relay: students jog/sprint between bases in groups of 4, focusing on running through 1st base.",
  whole_group_instruction:
    "Teacher demonstrates proper kicking form (approach, contact point, follow-through) and fielding mechanics " +
    "(ready position, two hands, throw to nearest base). Quick walk-through of game rules and rotation.",
  independent_practice:
    "Students play modified kickball in small-sided games (teams of 6-7) across multiple fields/stations to " +
    "maximize touches; rotate positions every 2 outs.",
  closure:
    "Cool-down walk + group reflection: 1-2 students share a success from the game and one thing they'll work on next time.",

  modifications: {
    6: "Allow tee option for students still developing kicking form; reduce base distances if needed.",
    7: "Introduce optional 'bunt zone' for students working on placement over power.",
    8: "Allow advanced students to call their own defensive shifts based on the kicker.",
  },

  known_vocabulary: ["Base", "Out", "Strike", "Team"],
  new_vocabulary: ["Force out", "Fielder's choice", "Ready position", "Follow-through"],

  routines: [
    "Whistle = freeze and look at teacher.",
    "Equipment grab/return routine at start/end of class.",
    "Rotation signal (clap pattern) to switch positions every 2 outs.",
  ],
  behavior_notes: [
    "Pre-assign teams before class to avoid social conflict during selection.",
    "Use proximity control near students who struggle with turn-taking.",
  ],
  safety_notes: [
    "Check field for holes/debris before class.",
    "Enforce 'no sliding' rule for middle school.",
    "Bats are not used in this activity — kickball only.",
  ],

  sub_friendly_instructions: "",
  sub_script: "",
  sub_management_script: "",
  sub_diagram: "",
};
