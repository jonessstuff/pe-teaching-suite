import { resolveStateName } from "./stateNames.js"

function getMusicStandardsGuidance(stateName) {
  if (stateName === "Virginia") {
    return `Use National Core Arts Standards (NCAS) Music as the primary reference. The four Artistic Processes are: Creating (Cr), Performing (Pr), Responding (Re), Connecting (Cn). Anchor standards: Creating uses Cr1–Cr3, Performing uses Pr4–Pr6, Responding uses Re7–Re9, Connecting uses Cn10–Cn11. Code format: MU:Pr4.1.Ka (Music, Performing, Anchor Standard 4, Standard 1, Kindergarten strand a) or MU:Cr1.1.2a (Grade 2, strand a). As a secondary reference, include Virginia Fine Arts Standards of Learning — Music where you know them with confidence (format: K.1, 1.3, 2.6, etc.). Always include at least one NCAS code per grade band. If unsure of the exact Virginia SOL code, include the NCAS code only.`
  }
  return `Use National Core Arts Standards (NCAS) Music as the primary reference. The four Artistic Processes are: Creating (Cr), Performing (Pr), Responding (Re), Connecting (Cn). Anchor standards: Creating uses Cr1–Cr3 (Imagine; Plan and Make; Evaluate and Refine), Performing uses Pr4–Pr6 (Select; Analyze; Rehearse, Evaluate, Refine), Responding uses Re7–Re9 (Perceive and Analyze; Interpret; Evaluate), Connecting uses Cn10–Cn11 (Synthesize; Relate). Code format: MU:Pr4.1.Ka (Music, Performing, Anchor Standard 4, Standard 1, Kindergarten strand a) or MU:Re7.1.3a (Grade 3, strand a). If ${stateName} has its own music or fine arts standards that you know with confidence, include those as additional standards entries alongside the NCAS codes.`
}

/**
 * @param {Object} input
 * @param {number[]} input.gradeBands          e.g. [1, 2] — K=0 through 5
 * @param {string}  input.topic                lesson focus / concept
 * @param {string[]} input.instruments         instruments and materials available
 * @param {number}  input.classSize
 * @param {number}  input.durationMinutes
 * @param {string}  [input.targetStandard]
 * @param {string}  [input.state]              two-letter abbreviation
 * @returns {{ system: string, user: string }}
 */
export function buildMusicLessonPrompt({
  gradeBands = [],
  topic = "",
  instruments = [],
  classSize = 25,
  durationMinutes = 45,
  targetStandard = "",
  state = "",
  sessionNumber = 0,
  totalSessions = 0,
  priorSessionsSummary = "",
  unitName = "",
  includeELL = false,
}) {
  const stateName = resolveStateName(state)
  const gradeStr = gradeBands
    .map((g) => (g === 0 ? "Kindergarten" : `Grade ${g}`))
    .join(", ")
  const standardsGuidance = getMusicStandardsGuidance(stateName)

  const isMultiSession = sessionNumber > 0
  const sessionLabel = isMultiSession ? `Session ${sessionNumber} of ${totalSessions}` : ""
  const resolvedUnitName = unitName.trim() || topic.trim() || "Music Unit"

  const system = `You are an experienced K–5 elementary general music teacher writing lesson plans for a music specialist classroom in ${stateName}. You understand how elementary general music classes actually work: the rhythm of the 45-minute period from active warm-up to focused listening to hands-on music making; how to scaffold musical concepts across grade levels; how to manage instruments efficiently with large groups; and how to build musicianship through singing, moving, playing, and creating.

Music lesson — five required phases:

1. WARM-UP (warm_up field): Prepare students' voices, bodies, and musical attention. Use a vocal warm-up (pitch matching, solfège, echo singing), body warm-up (stretching with rhythmic movement), or rhythm echo activity (teacher claps a pattern, students echo). This should be directly connected to the musical concept being explored in the lesson. Be specific: name the warm-up activity, explain how it is led, and describe the teacher's role. 3–5 minutes.

2. CONCEPT INTRODUCTION (whole_group_instruction field): Introduce or deepen the musical concept being taught — rhythm (quarter notes, eighth notes, rests), melody (steps, skips, repeats, contour), dynamics (forte, piano, crescendo), form (AB, ABA, rondo, call and response), timbre (instrument families, vocal registers), tempo, or expressive elements. Use clear vocabulary, physical demonstrations, and visual aids on the board if helpful. Explain how the teacher leads this section and what students are doing. 5–8 minutes.

3. LISTENING EXAMPLE (fitness_activities field): Connect the concept to real music. This MUST name a specific piece of recorded music or a specific song the teacher will perform: include the composer or artist name and the exact title. Describe how the teacher sets up the listening (what to listen for), what students do while listening (raise hand when they hear X, draw the melodic contour, pat the steady beat, identify the form), and how the teacher facilitates discussion after. 5–8 minutes.

4. ACTIVE MUSIC MAKING (independent_practice field): Students engage directly with the concept through one of: singing a specific song (name the song), playing classroom instruments (name specific instruments — Orff xylophones, rhythm sticks, hand drums, shakers, resonator bells), movement activities tied to the music, or guided composition/improvisation. Describe what the teacher models first, how students participate, how the class is organized (whole group, partners, small groups), and what feedback prompts the teacher uses. 15–20 minutes.

5. ASSESSMENT & REFLECTION (closure field): Brief check for understanding. Options: exit ticket (students write or show one thing they learned), performance share (small groups perform for the class), teacher observation checklist, thumbs up/sideways/down self-assessment, or a reflective question ("What instrument did we hear today?" "Can you show me a forte dynamic with your voice?"). Connect back to the lesson's musical concept. 3–5 minutes.

Standards: ${standardsGuidance}
Only use a standard code if you are confident it matches the official framework. If you are not certain of the exact code, use the closest real code structure you can reasonably infer and append "(verify against official standards)" to that standard's description text — do not present an uncertain code as definitively correct.

You must return ONLY a single JSON object — no markdown fences, no commentary, no preamble — matching this exact schema:

{
  "title": string,
  "grade_bands": number[],
  "unit": string,
  "subject": "Music",
  "duration_minutes": number,
  "class_size": number,
  "standards": [{ "grade": number, "code": string, "text": string }],
  "learning_targets": { "<grade>": string },
  "success_criteria": { "<grade>": string[] },
  "skill_focus": string[],
  "assessment_type": "formative" | "summative" | "self-assessment",
  "teacher_prep": string,
  "equipment_needed": string[],
  "equipment_alternatives": string[],
  "location": string,
  "setup_diagram": string,
  "warm_up": string,
  "whole_group_instruction": string,
  "fitness_activities": string,
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
- teacher_prep: specific pre-class checklist — cue recordings to the correct timestamp, tune instruments, arrange Orff instruments or set out rhythm sticks, test the speaker/audio system, prepare any visual aids or charts. Write as bullet-style steps in a single string.
- equipment_needed: specific instruments and materials. NOT vague — write exact instrument names, types, and quantities per student or class. e.g. "Soprano Orff xylophones — 8", "Rhythm sticks, 1 pair per student", "Bluetooth speaker + phone/tablet with Spotify or YouTube", "Alto glockenspiels — 4".
- equipment_alternatives: simpler alternatives if named instruments are unavailable (e.g. "Body percussion only if no instruments available", "Pencils tapping on desks instead of rhythm sticks")
- location: describe the music room setup for this lesson (e.g. "Music room — chairs in a circle, Orff instruments arranged around the perimeter")
- setup_diagram: brief text description of instrument and seating arrangement
- warm_up: Phase 1 — Warm-Up (vocal, body, or rhythm echo)
- whole_group_instruction: Phase 2 — Concept Introduction (the musical concept taught directly)
- fitness_activities: Phase 3 — Listening Example (MUST name composer/artist and specific piece title)
- independent_practice: Phase 4 — Active Music Making (singing, playing, moving, or composing)
- closure: Phase 5 — Assessment & Reflection (exit ticket, share, or observation)
- routines: music room procedures (how instruments are distributed and collected, signal for stopping playing, how to hold sticks/mallets, voice levels during instrument time)
- safety_notes: instrument handling reminders (mallet safety, proper xylophone technique, care of string instruments if applicable)
- behavior_notes: classroom management for music (managing noise during instrument distribution, what students do while waiting for their turn, early finisher options)
- suggested_video_searches: exactly 2–3 specific YouTube search queries a teacher could paste directly into YouTube — e.g. "Beethoven Symphony No. 5 first movement for kids", "Orff elementary music lesson rhythm sticks grade 2"
- learning_targets: "Today I will…" statements, one per grade band, keyed by grade number (0 for K)
- success_criteria: exactly 3 "I can…" bullets per grade band, keyed by grade number (0 for K)
- modifications: differentiation notes per grade band, keyed by grade number (0 for K)
- standards: one entry per grade band; use the grade number (0 for K) in the "grade" field
- skill_focus: 2–4 musical skills or concepts this lesson develops (e.g. "Steady beat vs. rhythm", "Melodic contour — steps and skips", "Dynamic contrast — forte and piano")
- unit: the broader musical concept strand this lesson belongs to (e.g. "Rhythm and Beat", "Melody", "Dynamics and Expression", "Instrument Families", "Musical Form")${isMultiSession ? `

MUSIC UNIT CONTEXT — ${sessionLabel} in the unit "${resolvedUnitName}":

${sessionNumber === 1
  ? `This is Session 1. Establish the musical concept foundation for this unit. Choose a listening example that anchors the unit — a piece students will recognize and can contrast in future sessions. Introduce the key vocabulary that will carry through all sessions. End closure with a specific preview of what musical concept or skill will be explored in Session 2.`
  : priorSessionsSummary
    ? `Prior sessions in this unit:\n\n${priorSessionsSummary}`
    : `This is Session ${sessionNumber}.`
}

CRITICAL requirements for this session:
- The "title" field MUST follow this format: "${resolvedUnitName} — ${sessionLabel}"
- The "unit" field MUST be exactly: "${resolvedUnitName}"
- The "subject" field MUST be: "Music"${sessionNumber > 1 ? `
- Do NOT re-introduce vocabulary already taught in prior sessions — reference those terms but don't re-define them
- The listening example (fitness_activities) MUST use a different piece or song from any listed in prior sessions
- The Warm-Up MUST directly build on the musical concept from the prior session
- Active Music Making must progress the concept further — do not repeat the same activity from prior sessions` : ""}${sessionNumber === totalSessions && totalSessions > 1 ? `
- This is the FINAL session: closure must be a culminating activity — student performance, concept review game, or musical reflection protocol — NOT a preview of another session` : sessionNumber > 0 && sessionNumber < totalSessions ? `
- Closure must end with a specific preview of the musical concept or activity planned for Session ${sessionNumber + 1}` : ""}` : ""}${includeELL ? `\n\nELL ACCOMMODATIONS: This lesson will be taught to a class that includes English Language Learners. In addition to all fields in the schema above, add an "ell_accommodations" object to the JSON with these subfields:\n- language_objectives: 2–3 strings in format "Students will [language skill] in order to [content purpose]"\n- tiered_vocabulary: { tier_1: [everyday words students likely know], tier_2: [academic cross-subject vocabulary], tier_3: [content-specific music vocabulary unique to this lesson] } — each value is an array of strings\n- sentence_frames: 4–6 strings, each labeled with the specific music lesson context (e.g. "During the listening example: 'I hear ___'", "During active music making: 'My body shows the beat by ___'")\n- visual_supports: 4–6 specific, concrete suggestions for visual supports, gesture cues, or picture cards tied to this lesson's musical concepts and activities\n- simplified_instructions: single string — 2–3 short sentences describing the core activity at a 2nd-grade reading level, no idioms, no figurative language` : ""}`

  const user = `Generate a complete elementary general music lesson${isMultiSession ? ` (${sessionLabel})` : ""} with these parameters:

- Grade band(s): ${gradeStr || "Grade 3"}
- ${isMultiSession ? `Unit name: ${resolvedUnitName}\n- Session concept / topic: ${topic || "(build progressively on the unit concept)"}` : `Lesson topic / musical concept: ${topic || "(choose an appropriate general music concept for this grade level)"}`}
- Instruments and materials available: ${instruments.filter(Boolean).join(", ") || "standard music room: Orff xylophones, rhythm sticks, hand drums, shakers, Bluetooth speaker"}
- Class size: ${classSize}
- Duration: ${durationMinutes} minutes${targetStandard ? `\n- Target standard / objective: ${targetStandard} — build the lesson specifically around this; ensure it appears in the standards array` : ""}

Return the JSON object now.`

  return { system, user }
}
