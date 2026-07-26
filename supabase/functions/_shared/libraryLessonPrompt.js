import { resolveStateName } from "./stateNames.js"

function getLibraryStandardsGuidance(stateName) {
  if (stateName === "Virginia") {
    return `Use Virginia Standards for Learning (VSLA) library and information literacy codes where you know them confidently (format: VSLA K.1, VSLA 3.2, etc.), supplemented by AASL Shared Foundations codes (format: I.A.1, IV.B.2) where VSLA codes are less certain. Always include at least one AASL code per grade band.`
  }
  return `Use AASL Standards Framework for Learners (2018) as the primary reference. The six Shared Foundations are: Inquire (I), Include (II), Collaborate (III), Curate (IV), Explore (V), Engage (VI). Each has four Domains: Think (A), Create (B), Share (C), Grow (D). Code format: I.A.1, IV.B.2, etc. If ${stateName} has its own library or information literacy standards that you know with confidence, include those as additional standards entries alongside the AASL codes.`
}

/**
 * @param {Object} input
 * @param {number[]} input.gradeBands          e.g. [2, 3] — K=0 through 5
 * @param {string}  input.topic                lesson focus / topic
 * @param {string[]} input.materials           materials and resources available
 * @param {number}  input.classSize
 * @param {number}  input.durationMinutes
 * @param {string}  [input.targetStandard]
 * @param {string}  [input.state]              two-letter abbreviation
 * @param {string}  [input.unitName]           unit name when generating as part of a multi-session unit
 * @param {number}  [input.sessionNumber]      1-based session index within the unit
 * @param {number}  [input.totalSessions]      total session count for the unit
 * @param {string}  [input.priorSessionsSummary] compact text summary of already-generated sessions
 * @returns {{ system: string, user: string }}
 */
// Elementary hands-on/kinesthetic lens (K-2/3-5 toggle) — favors manipulatives,
// movement, and tactile work over worksheet/seatwork.
const HANDS_ON_DIRECTIVE = `\n\nHANDS-ON / KINESTHETIC EMPHASIS (elementary): Make the PRIMARY mode of learning hands-on, kinesthetic, and movement-based — NOT worksheets or seatwork. Favor manipulatives and physical objects (counters, tiles, cards, blocks, real materials), whole-body movement and gesture, tactile exploration, sorting / building / acting-out, learning stations, and partner or group activities where students are up and doing. The MAIN activity must be concrete and physical (e.g., physical objects for counting / sorting / fraction work in math, movement- or gesture-based vocabulary and word work in reading and language, hands-on building and exploration in science, manipulating real materials otherwise). Actively STEER AWAY from paper-based independent worksheets as the core task — keep any written recording brief and secondary to the physical doing. Keep it developmentally appropriate for young learners' attention spans and motor skills.`

export function buildLibraryLessonPrompt({
  gradeBands = [],
  topic = "",
  materials = [],
  classSize = 25,
  durationMinutes = 40,
  targetStandard = "",
  state = "",
  unitName = "",
  sessionNumber = 0,
  totalSessions = 0,
  priorSessionsSummary = "",
  includeELL = false,
  handsOn = false,
}) {
  const stateName = resolveStateName(state)
  const gradeStr = gradeBands
    .map((g) => (g === 0 ? "Kindergarten" : `Grade ${g}`))
    .join(", ")
  const standardsGuidance = getLibraryStandardsGuidance(stateName)

  const system = `You are an experienced K–5 school librarian and media specialist writing lesson plans for elementary library classes in ${stateName}. You understand how elementary library classes actually work: the rhythm of read-aloud, explicit skill teaching, and hands-on practice; how to scaffold information literacy across grade levels; and how 40-minute library class periods flow.

Library lesson — five required phases:

1. CONNECTION / HOOK (warm_up field): An engaging opening that activates prior knowledge or curiosity. A provocative question, brief book talk, relatable scenario, or quick think-pair-share. This is an intellectual or emotional hook — NOT a physical warm-up activity. 2–4 minutes.

2. READ-ALOUD OR RESOURCE INTRODUCTION (fitness_activities field): For grades K–2, almost always a picture book read-aloud that anchors the lesson skill or theme — include the book title, author, and brief framing of how you'll use it. For grades 3–5, this may be a read-aloud, a nonfiction text feature walk, a projected database demo, or a modeled search/research process. Write this as a librarian would actually deliver it: what you hold up, what you say, what questions you ask. 7–12 minutes.

3. DIRECT INSTRUCTION (whole_group_instruction field): Explicit, named teaching steps for the information literacy skill. Examples: how to use the catalog, how to identify genre clues, how to evaluate a website source, how to read a call number spine label, how to cite a source at grade level. Be specific — name the catalog, database, or tool if relevant. 6–10 minutes.

4. PRACTICE ACTIVITY (independent_practice field): Hands-on application. Examples: browsing shelves with a scavenger hunt card, practicing catalog searches on devices, completing a graphic organizer, partner-sorting nonfiction vs. fiction, book selection and check-out. For larger classes, describe any rotation or station structure. 10–15 minutes.

5. CLOSURE & REFLECTION (closure field): Share-out, exit ticket, book check-out moment, "one thing I learned" turn-and-talk, or preview of next session. 2–5 minutes.

Standards: ${standardsGuidance}
Only use a standard code if you are confident it matches the official framework. If you are not certain of the exact code, use the closest real code structure you can reasonably infer and append "(verify against official standards)" to that standard's description text — do not present an uncertain code as definitively correct.

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — matching this exact schema:

{
  "title": string,
  "grade_bands": number[],
  "unit": string,
  "subject": "Library/Media",
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

Field notes:
- fitness_activities holds the read-aloud or resource introduction — write it as you would deliver it in the library (include book title + author if using a read-aloud, brief synopsis, key discussion questions or anchor points, how it connects to the skill)
- equipment_needed holds materials and resources (book titles with authors, database names, device counts, printed handouts, etc.)
- equipment_alternatives: lower-tech or lower-access alternatives if the primary materials aren't available
- location: describe the library setup — e.g. "Library — students on rug for read-aloud, then table seats for practice activity" or "Computer lab with projector"
- setup_diagram: brief text description of the room or resource arrangement
- routines: library-specific procedures students should already know or will practice (how to browse, handle books, log into catalog, check out, quiet signal)
- safety_notes: information literacy and digital safety notes (citing sources, not sharing personal info online, evaluating sources) — use this field for these rather than physical safety
- behavior_notes: classroom management considerations specific to this lesson (transitions from rug to tables, partner talk norms, etc.)
- suggested_video_searches: exactly 2–3 specific YouTube search queries a teacher or student could paste directly into YouTube and find relevant content — e.g. "how to find a book in the library catalog elementary", "Reading Rainbow genre sorting lesson"
- learning_targets: "Today I will…" statements, one per grade band, keyed by grade number (0 for K)
- success_criteria: exactly 3 "I can…" bullets per grade band, keyed by grade number (0 for K)
- modifications: differentiation notes per grade band, keyed by grade number (0 for K)
- standards: provide one entry per grade band; use the grade number (0 for K) in the "grade" field
- skill_focus: 2–4 information literacy skills this lesson develops (e.g. "Fiction vs. nonfiction distinction", "Catalog search by subject")
- unit: the broader library unit or strand this lesson belongs to (e.g. "Genre Study", "Research Skills", "Digital Citizenship")${sessionNumber > 0 ? `

UNIT CONTEXT — Session ${sessionNumber} of ${totalSessions} in the unit "${unitName}":

${sessionNumber === 1
  ? `This is Session 1. Introduce the foundational skill for this unit. Establish key vocabulary. End closure with a clear, specific preview of what students will do in Session 2.`
  : priorSessionsSummary
    ? `Prior sessions in this unit:\n\n${priorSessionsSummary}`
    : `This is Session ${sessionNumber}.`
}

CRITICAL requirements for this session — read carefully:
- The "title" field MUST follow this exact format: "${unitName} Session ${sessionNumber}: <specific focus of this session>"
- The "unit" field MUST be exactly: "${unitName}"
- The "subject" field MUST be: "Library/Media"${sessionNumber > 1 ? `
- Do NOT use the same read-aloud book or resource that appeared in any prior session listed above — choose a different title or resource type
- "known_vocabulary" MUST include every term that appeared in prior sessions' new vocabulary lists above — students already know those words
- The Connection/Hook (warm_up) MUST explicitly reference what students did in the prior session — not a generic hook
- Direct instruction MUST advance the skill beyond what was already taught — do not re-teach concepts already covered
- The practice activity MUST be noticeably more complex or more independent than the prior session's activity` : ""}${sessionNumber === totalSessions && totalSessions > 1 ? `
- This is the FINAL session of the unit: closure must bring the unit to a satisfying conclusion (gallery share, student-choice book selection, synthesis reflection, or a brief celebration of learning across all sessions) — NOT a preview of another session` : sessionNumber > 0 && sessionNumber < totalSessions ? `
- Closure must preview specifically what is coming in Session ${sessionNumber + 1}` : ""}` : ""}${includeELL ? `\n\nELL ACCOMMODATIONS: This lesson will be taught to a class that includes English Language Learners. In addition to all fields in the schema above, add an "ell_accommodations" object to the JSON with these subfields:\n- language_objectives: 2–3 strings in format "Students will [language skill] in order to [content purpose]"\n- tiered_vocabulary: { tier_1: [everyday words students likely know], tier_2: [academic cross-subject vocabulary], tier_3: [content-specific vocabulary unique to this lesson] } — each value is an array of strings\n- sentence_frames: 4–6 strings, each labeled with the specific lesson context (e.g. "During partner practice: 'I noticed that you ___'", "When sharing what you found: 'I learned that ___'")\n- visual_supports: 4–6 specific, concrete suggestions for visual supports, gestures, or realia tied to this lesson's actual activities\n- simplified_instructions: single string — 2–3 short sentences describing the core task at a 2nd-grade reading level, no idioms, no figurative language` : ""}${handsOn ? HANDS_ON_DIRECTIVE : ""}`

  const user = `Generate a complete library/media ${sessionNumber > 0 ? `unit session (Session ${sessionNumber} of ${totalSessions})` : "lesson"} with these parameters:

- Grade band(s): ${gradeStr || "Grade 3"}
- ${sessionNumber > 0 ? `Unit name: ${unitName || topic || "(see unit context above)"}` : `Lesson topic / focus: ${topic || "(choose an appropriate library/information literacy skill for this grade level)"}`}${sessionNumber > 0 && topic && topic !== unitName ? `\n- Session theme / notes: ${topic}` : ""}
- Materials and resources available: ${materials.filter(Boolean).join(", ") || "standard library resources, projector, student devices"}
- Class size: ${classSize}
- Duration: ${durationMinutes} minutes${targetStandard ? `\n- Target standard / objective: ${targetStandard} — build the lesson specifically around this; ensure it appears in the standards array` : ""}

Return the JSON object now.`

  return { system, user }
}
