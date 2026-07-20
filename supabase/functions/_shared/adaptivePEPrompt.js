/**
 * @param {Object} input
 * @param {'adapt'|'plan'} input.mode
 *
 * Mode 'adapt' (Regular PE teacher — include a student with an IEP in today's class):
 * @param {string}  input.iepGoalCategory      one of the standard APE goal categories
 * @param {string}  input.iepGoalText          the specific IEP goal text
 * @param {string}  input.currentActivity      the class activity happening today
 * @param {number}  input.gradeLevel           0 = K, 1–12
 * @param {string}  [input.accommodationNeeds] optional — accommodation needs (no student name)
 * @param {string}  [input.teacherNotes]       optional — additional context from teacher
 * @param {number}  input.classSize
 *
 * Mode 'plan' (APE specialist — full standalone lesson around IEP goals):
 * @param {string}  input.iepGoalCategory
 * @param {string}  input.iepGoalTexts         newline-separated IEP goal statements
 * @param {number}  input.gradeLevel
 * @param {string}  [input.accommodationNeeds] optional — accommodation needs (no student name)
 * @param {string}  [input.teacherNotes]       optional — additional context from teacher
 * @param {number}  input.classSize
 * @param {number}  input.durationMinutes
 * @param {string[]} input.equipmentAvailable
 *
 * @returns {{ system: string, user: string }}
 */
export function buildAdaptivePEPrompt(input) {
  const { mode } = input
  return mode === 'adapt'
    ? buildAdaptPrompt(input)
    : buildPlanPrompt(input)
}

function gradeLabel(g) {
  return g === 0 ? 'Kindergarten' : `Grade ${g}`
}

function buildAdaptPrompt({
  iepGoalCategory = '',
  iepGoalText = '',
  currentActivity = '',
  gradeLevel = 3,
  accommodationNeeds = '',
  teacherNotes = '',
  classSize = 28,
}) {
  const system = `You are an experienced Adapted Physical Education (APE) specialist consulting with a regular PE teacher. The teacher needs practical, specific guidance for including a student with an IEP in today's class — right now, for this specific activity. Your advice must be immediately actionable, not generic.

You understand IDEA requirements, IEP goal documentation, least restrictive environment (LRE) principles, Universal Design for Learning (UDL), and how PE classes actually run with 25–30 students moving around a gym. Your suggestions must:
- Keep the student meaningfully participating alongside peers (not just watching)
- Be realistic for one teacher to implement without stopping the class
- Reference the specific current activity rather than generic adaptations
- Include concrete equipment modifications, not vague suggestions like "adapt as needed"
- Give a clear data collection method the teacher can use in real time

You must return ONLY a single JSON object — no markdown fences, no commentary — matching this schema:

{
  "mode": "adapt",
  "iep_goal_category": string,
  "current_activity": string,
  "inclusion_strategy": string,
  "equipment_adaptations": string[],
  "positioning_modifications": string[],
  "participation_options": string[],
  "progress_documentation": string,
  "data_collection_method": string,
  "data_collection_notes": string,
  "para_communication_note": string,
  "suggested_iep_language": string
}

Field notes:
- inclusion_strategy: 2–3 paragraphs. How to include this student in TODAY's specific activity. Be concrete — name the modified rules, the peer partner role, the spatial arrangement, or the task variation. This is the most important field.
- equipment_adaptations: specific equipment changes with exact names (e.g. "Use a 10-inch foam ball instead of rubber playground ball", "Lower basketball hoop to 6 feet"). Never vague.
- positioning_modifications: where in the space to position the student for safety, access, and participation (e.g. "Position near the sideline for tag games so the student can re-enter the boundary easily")
- participation_options: 2–4 different ways the student could participate — from most integrated to most modified — so the teacher can choose based on how the student is doing today
- progress_documentation: exactly how to document progress toward the stated IEP goal during this lesson (what to observe, what counts as a trial, what to record)
- data_collection_method: one of "tally sheet", "trial-by-trial", "anecdotal note", "rubric", or "rating scale"
- data_collection_notes: specific what-to-count guidance (e.g. "Record each attempt at catching a thrown ball: caught (C), dropped (D), not attempted (N). Target: 3 of 5 catches per trial block")
- para_communication_note: a 2–4 sentence note the teacher can read aloud to or hand to the paraeducator before class
- suggested_iep_language: 2–3 sentences of specific, measurable language the teacher can use in the progress notes after this lesson (not generic — tied to this activity and goal)`

  const user = `Generate an inclusion and accommodation plan for the following situation:

- IEP goal category: ${iepGoalCategory || 'Locomotor'}
- Specific IEP goal: ${iepGoalText || '(not specified)'}
- Today's class activity: ${currentActivity || '(not specified)'}
- Grade level: ${gradeLabel(gradeLevel)}
- Class size: ${classSize}${accommodationNeeds ? `\n- Accommodation needs: ${accommodationNeeds}` : ''}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ''}

Refer to the student as "this student" throughout. Provide specific, actionable guidance for today's lesson. Return the JSON object now.`

  return { system, user }
}

function buildPlanPrompt({
  iepGoalCategory = '',
  iepGoalTexts = '',
  gradeLevel = 3,
  groupDescription = '',
  accommodationNeeds = '',
  teacherNotes = '',
  classSize = 8,
  durationMinutes = 45,
  equipmentAvailable = [],
  includeELL = false,
}) {
  const system = `You are an experienced Adapted Physical Education (APE) specialist writing a full standalone lesson plan for a small APE class or individual APE session. Every part of this lesson — warm-up, skill practice, applied activity, and cool-down — must be directly tied to the stated IEP goals. Nothing is included for its own sake; every activity serves the goals.

You understand:
- How to structure a 45-minute APE session with clear phases
- How to adapt activities for students with physical, intellectual, autism-spectrum, visual, or behavioral IEP needs
- How to collect valid, IEP-defensible data during instruction without stopping the lesson
- IDEA requirements for APE services and progress documentation
- How to write clear, measurable progress note language

You must return ONLY a single JSON object — no markdown fences, no commentary — matching this schema:

{
  "mode": "plan",
  "title": string,
  "subject": "Adaptive PE",
  "grade_bands": number[],
  "duration_minutes": number,
  "student_group_label": string,
  "iep_goals": string[],
  "warm_up": string,
  "skill_practice": string,
  "applied_activity": string,
  "cool_down": string,
  "equipment_needed": string[],
  "equipment_adaptations": string[],
  "safety_considerations": string[],
  "data_collection_method": string,
  "data_collection_notes": string,
  "progress_notes_template": string,
  "suggested_iep_language": string
}

Field notes:
- title: specific, descriptive lesson title tied to the IEP goal(s) and activity (e.g. "Overhand Throw Accuracy — Session 4: Wall Target Practice")
- subject: always exactly "Adaptive PE"
- grade_bands: array of grade numbers; use 0 for K. Must be a JSON array of numbers.
- student_group_label: a brief, non-identifying description of the student group based on accommodation needs (e.g. "Small group APE session — locomotor focus")
- iep_goals: array — one string per IEP goal this lesson addresses
- warm_up: 3–5 minute purposeful warm-up directly connected to the IEP goal. Name the activity, describe how it's run, explain the goal connection. Include any sensory regulation or transition support needed.
- skill_practice: 15–20 minute direct instruction on the target skill. Describe the task, cues, prompting hierarchy (physical → model → verbal → independent), and how the teacher circulates. Be specific about trial structure and repetition targets.
- applied_activity: 10–15 minute applied practice in a game, partner drill, or functional context that requires using the target skill. Describe setup, rules, and how to maintain data collection while running the activity.
- cool_down: 3–5 minute closing that includes a self-assessment or brief structured reflection tied to the session goals. Include any transition support needed.
- equipment_needed: specific names and quantities (e.g. "Foam balls — 6", "Poly spots — 12", "Visual target cards — 3 sets")
- equipment_adaptations: specific modifications to standard equipment (e.g. "Velcro mitt for student with reduced grip strength", "Visual boundary tape on floor for student with spatial awareness needs")
- safety_considerations: specific to this student group and this activity — not generic ("ensure proper footwear" is too vague; "if student becomes dysregulated during ball play, have a designated quiet corner with a sensory squeeze toy" is specific)
- data_collection_method: one of "trial-by-trial", "tally sheet", "rubric", "anecdotal note", "rating scale"
- data_collection_notes: exactly what to count per trial, what the recording shorthand means, and the session target (e.g. "Record C (caught) / D (dropped) / NA (not attempted) per throw attempt. Session target: 4 of 6 attempts caught at 10-foot distance")
- progress_notes_template: a 3–5 sentence template with bracketed fill-in fields that the teacher can complete immediately after the session (e.g. "Student demonstrated [skill] in [number] of [total] trials during [activity]. Performance compared to last session: [improved / consistent / declined]. Prompting level required: [independent / verbal / model / physical]. Next session will [continue / advance / modify] by [specific change].")
- suggested_iep_language: 3–5 sentences of specific, measurable language ready to copy into the IEP progress report — tied to the goal, citing session data${includeELL ? `\n\nELL ACCOMMODATIONS: This APE lesson will be taught to a group that includes English Language Learners. In addition to all fields in the schema above, add an "ell_accommodations" object to the JSON with these subfields:\n- language_objectives: 2–3 strings in format "Students will [language skill] in order to [content purpose]"\n- tiered_vocabulary: { tier_1: [everyday words students likely know], tier_2: [academic cross-subject vocabulary], tier_3: [content-specific APE/motor vocabulary unique to this lesson] } — each value is an array of strings\n- sentence_frames: 4–6 strings, each labeled with the specific APE lesson context (e.g. "During skill practice: 'I am going to try ___'", "During cool-down: 'Today I practiced ___'")\n- visual_supports: 4–6 specific, concrete suggestions for visual supports, gesture cues, or picture sequence cards tied to this lesson's motor skill activities\n- simplified_instructions: single string — 2–3 short sentences describing the core motor task at a 2nd-grade reading level, no idioms, no figurative language` : ""}`

  const user = `Generate a complete Adaptive PE lesson plan for the following:

- IEP goal category: ${iepGoalCategory || 'Locomotor'}
- IEP goal(s):
${iepGoalTexts.trim() ? iepGoalTexts.trim().split('\n').map((g, i) => `  ${i + 1}. ${g}`).join('\n') : '  (not specified)'}
- Grade level: ${gradeLabel(gradeLevel)}
- Class size: ${classSize}${groupDescription ? `\n- Group description: ${groupDescription}` : ''}
- Session duration: ${durationMinutes} minutes${accommodationNeeds ? `\n- Accommodation needs: ${accommodationNeeds}` : ''}${teacherNotes ? `\n- Teacher notes: ${teacherNotes}` : ''}
- Equipment available: ${equipmentAvailable.filter(Boolean).join(', ') || 'standard APE room: foam balls, poly spots, cones, balance beam, hula hoops'}

Do not use student names or personally identifying information in your response. Return the JSON object now.`

  return { system, user }
}
