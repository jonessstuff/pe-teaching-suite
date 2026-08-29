import { sampleKickballLesson } from '../types/sampleLesson'

/**
 * Mock generationService for the standalone preview build.
 * Returns canned data after a short delay to simulate the real
 * AI generation calls.
 */

const SUB_PLAN_FIELDS = {
  sub_friendly_instructions:
    "Today the class is playing kickball outside. You don't need any PE background — just follow the script below, keep an eye on safety, and use the diagram to set up the field.",
  sub_script:
    '1. Take students to the field and have them sit on the line.\n2. Lead a quick warm-up: students jog one lap, then toss a ball back and forth with a partner for 2 minutes.\n3. Split students into the two pre-assigned teams (list is on the clipboard).\n4. Explain the basic rules: kick the ball, run the bases, field team gets outs by tagging a base or the runner.\n5. Play 2-3 innings, rotating fielding positions every 2 outs (use the clap signal).\n6. With 5 minutes left, blow the whistle, have students walk one cool-down lap, then sit for a 1-2 minute reflection.',
  sub_management_script:
    "If students argue about a call, restate the rule calmly and move on — don't relitigate plays. If a student refuses to participate, offer them a 'helper' role (scorekeeper, base coach). The clap-clap signal means freeze and look at the teacher.",
  sub_diagram:
    '      [Outfield Zone 3]\n   [Zone 2]   [Zone 1]\n        \\     /\n  3rd -- HOME -- 1st\n        |\n       2nd\n\nTeams sit on the foul line before splitting up.',
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function gradeNumber(value, fallback = 3) {
  if (Array.isArray(value)) return Number(value[0] ?? fallback)
  const match = String(value ?? '').match(/\d+/)
  return Number(match?.[0] ?? fallback)
}

function classroomPreview(input = {}, subject, defaults) {
  const grades = input.gradeBands?.length ? input.gradeBands : [3]
  const title = input.topic?.trim() || input.focus?.trim() || defaults.title
  const targets = Object.fromEntries(grades.map((grade) => [grade, defaults.target]))
  const criteria = Object.fromEntries(grades.map((grade) => [grade, defaults.criteria]))
  const modifications = Object.fromEntries(grades.map((grade) => [grade, defaults.modification]))
  return {
    ...sampleKickballLesson,
    title,
    unit: defaults.unit,
    subject,
    grade_bands: grades,
    duration_minutes: input.durationMinutes ?? 45,
    class_size: input.classSize ?? 24,
    standards: grades.map((grade) => ({ grade, code: defaults.standardCode, text: defaults.standard })),
    learning_targets: targets,
    success_criteria: criteria,
    skill_focus: defaults.skills,
    equipment_needed: input.materials?.length ? input.materials : defaults.materials,
    equipment_alternatives: defaults.alternatives ?? [],
    location: defaults.location,
    setup_diagram: defaults.setup,
    warm_up: defaults.warmUp,
    fitness_activities: defaults.guided,
    whole_group_instruction: defaults.instruction,
    independent_practice: defaults.practice,
    closure: defaults.closure,
    modifications,
    known_vocabulary: defaults.knownVocabulary ?? [],
    new_vocabulary: defaults.vocabulary,
    routines: defaults.routines,
    behavior_notes: defaults.behaviorNotes ?? [],
    safety_notes: defaults.safety,
    teacher_prep: defaults.teacherPrep,
  }
}

function artPreview(input = {}) {
  return classroomPreview(input, 'Art', {
    title: 'Warm and Cool Color Landscapes', unit: 'Color and Mood',
    target: 'I can use warm and cool colors intentionally to create a mood in an original landscape.',
    criteria: ['I used a clear warm or cool color family.', 'My foreground, middle ground, and background are visible.', 'I can explain how color changes the mood.'],
    modification: 'Offer a limited color tray, landscape shape templates, and a verbal or pointing-based reflection option.',
    standardCode: 'VA:Cr2.1.3a', standard: 'Create personally satisfying artwork using a variety of artistic processes and materials.',
    skills: ['Color families', 'Landscape space', 'Artistic choice'], materials: ['Drawing paper', 'Tempera or watercolor sets', 'Brushes', 'Water cups', 'Black crayons'],
    alternatives: ['Crayons or colored pencils for a no-paint version'], location: 'Art room tables with a drying area', setup: 'Place warm palettes on one side and cool palettes on the other; display one teacher example of each.',
    warmUp: 'Project two landscapes with different color palettes. Students silently point to the one that feels energetic, then discuss why.',
    guided: 'Students sort color cards into warm, cool, and neutral groups, then test two small color combinations.',
    instruction: 'Model a simple three-layer landscape and think aloud while choosing one color family. Demonstrate rinsing the brush and controlling water.',
    practice: 'Students create an original landscape using primarily warm or cool colors. Midway through, partners identify the intended mood and one successful color choice.',
    closure: 'Gallery walk: students leave one noticing statement, then complete: “My colors make the scene feel ___ because ___.”',
    vocabulary: ['warm colors', 'cool colors', 'foreground', 'middle ground', 'background'], knownVocabulary: ['line', 'shape', 'color'],
    routines: ['Carry artwork with two hands.', 'Use the table drying rack assigned to your group.'], safety: ['Wipe spills immediately.', 'Use only classroom-safe paint materials.'],
    teacherPrep: 'Pre-fill water cups halfway, set out limited palettes, and prepare two contrasting landscape examples.',
  })
}

function ctePreview(input = {}) {
  const topic = input.topic?.trim() || 'Build a Monthly Budget from a First Paycheck'
  const pathway = input.pathway || 'finance'
  return {
    ...classroomPreview({ ...input, topic, gradeBands: [] }, 'CTE', {
      title: topic, unit: 'Career-Ready Financial Skills', target: '', criteria: [], modification: '', standardCode: '', standard: '',
      skills: ['Budgeting', 'Spreadsheet formulas', 'Financial decision-making'], materials: ['Budget scenario cards', 'Laptop or calculator per pair', 'Monthly budget template'],
      location: 'Classroom computer stations', setup: 'Post the sample paycheck and expense categories; pair students intentionally.',
      warmUp: 'Students rank five expenses from “must pay first” to “can wait” and justify one choice.',
      guided: 'Complete the first three budget categories together and model a SUM formula.',
      instruction: 'Explain take-home pay, fixed expenses, variable expenses, savings, and the difference between a want and a need using one realistic paycheck.',
      practice: 'Pairs build a balanced monthly budget for a fictional entry-level employee, make one unexpected-expense adjustment, and explain their tradeoff.',
      closure: 'Students submit one budget decision they would keep and one they would change after seeing the ending balance.',
      vocabulary: ['net pay', 'fixed expense', 'variable expense', 'savings rate', 'balance'], routines: ['Use fictional financial information only.'], safety: ['Do not enter personal or family financial information.'],
    }),
    pathway,
    pathway_label: pathway === 'finance' ? 'Finance' : 'Career & Technical Education',
    tier: input.tier || 'hs', level: input.level || 'introductory', tier_label: input.tier === 'ms' ? 'Middle School (Exploratory)' : 'High School (Pathway) — Introductory',
    success_criteria: ['Budget totals equal the available net pay.', 'The plan includes savings and essential expenses.', 'The student explains one tradeoff using evidence.'],
    modifications: 'Provide a partially completed spreadsheet, a printed calculation option, vocabulary cards, and an extension scenario with irregular income.',
    competencies: [{ code: 'FN-1', framework: 'Career Ready Practice', text: 'Apply financial reasoning and digital tools to a realistic workplace or life task.' }],
    tools_and_platforms: ['Spreadsheet software or printed budget table', 'Calculator'],
    career_pathway_context: { sequence: [{ level: 'introductory', course: 'Foundations of Finance', description: 'Personal finance and workplace applications', is_current: true }, { level: 'concentrator', course: 'Accounting & Financial Services', description: 'Deeper analysis and industry skills' }], note: 'Connects personal financial literacy to finance, accounting, banking, and business careers.' },
    work_based_learning: { internships: ['Local bank or credit-union career exploration'], guest_speakers: ['Payroll, banking, or financial-services professional'], job_shadows: ['Bookkeeping or business-office observation'] },
  }
}

function slpPreview(input = {}) {
  const grade = gradeNumber(input.gradeBand)
  const focus = input.focus?.trim() || 'Following two-step directions using first/then and before/after concepts'
  return {
    title: 'Listen, Plan, and Do: Two-Step Directions', subject: 'Speech-Language Pathologists', grade_bands: [grade], band_label: `Grade ${grade}`,
    content_area: input.contentArea || 'Receptive Language', focus, session_length_minutes: input.sessionLengthMinutes ?? 30,
    target_area_summary: 'Practice listening for two actions, holding both steps in working memory, and completing them in the stated order.',
    warm_up: 'Use three picture cards for a quick “listen and do” routine: point to the book, then touch the pencil. Repeat once with the visuals visible and once after turning them over.',
    activities: [
      { name: 'First/Then Picture Build', how_to_run: 'Give each student two action cards. Read a direction using first/then; the student sequences the cards and performs both actions.', why_it_works: 'Makes order language visible before the student responds.' },
      { name: 'Barrier-Game Directions', how_to_run: 'Partners use identical small scenes. One gives a two-step direction and the other changes the scene without seeing the model.', why_it_works: 'Creates a meaningful reason to listen precisely and request clarification.' },
      { name: 'Classroom Carryover Challenge', how_to_run: 'Practice three authentic directions such as “Put the marker away and bring your folder.” Fade the visual cue as accuracy improves.', why_it_works: 'Connects the skill to classroom participation.' },
    ],
    cueing_and_scaffolding: ['Pause between the two steps without repeating the full direction.', 'Point to a first/then visual, then fade the gesture.', 'Allow the student to repeat the direction before acting.'],
    response_modalities: [{ modality: 'Movement', how: 'Complete both actions.' }, { modality: 'Visual sequencing', how: 'Arrange two picture cards in order.' }, { modality: 'Verbal rehearsal', how: 'Repeat the direction using first/then language.' }],
    materials: ['First/then visual', 'Action picture cards', 'Two matching barrier-game scenes'],
    generalization: 'Send one classroom-ready cue card and invite the teacher to use one two-step direction during arrival or cleanup.',
    progress_check: 'Record independent accuracy across five two-step directions and note the least intrusive cue needed.',
    age_dignity_note: 'Use age-respectful classroom actions and visuals selected for the student group.',
    standards_alignment: [{ framework: 'ASHA Practice Portal', text: 'Activity ideas support receptive-language goals and functional participation; the clinician selects targets from each student’s plan.' }],
    clinical_boundary_note: 'This is a planning aid, not an evaluation, diagnosis, or replacement for the SLP’s clinical judgment and student-specific plan.',
    state_verification_note: 'Follow district documentation, service-delivery, and progress-monitoring requirements.',
  }
}

function earlyChildhoodPreview(input = {}) {
  const theme = input.studyTheme?.trim() || 'Fall leaves: sorting, color, and texture'
  return {
    title: 'Leaf Scientists: Sort, Notice, and Create', subject: 'Early Childhood', age_group: input.ageGroup || 'Preschool (3–5)', program_type: input.programType || 'General education', study_theme: theme,
    big_idea: 'Leaves can be alike and different. What do you notice when you look closely?',
    invitation: 'Arrange a low tray with real or paper leaves, magnifiers, baskets, and blank cards. Invite children to touch, compare, sort, draw, and change their sorting rule.',
    developmental_focus: [{ domain: 'Approaches to Learning', description: 'Sustain attention, make a plan, and revise a sorting idea.' }, { domain: 'Cognition', description: 'Compare attributes and explain how objects belong together.' }, { domain: 'Language', description: 'Use describing words such as smooth, bumpy, curved, and pointed.' }, { domain: 'Fine Motor', description: 'Pick up, place, trace, and make leaf rubbings.' }],
    learning_centers: [
      { name: 'Discovery & Sorting', domains: ['Cognition', 'Language'], invitation: 'Sort leaves by one visible attribute, then invent a new rule.', materials: ['Leaves', 'sorting hoops', 'magnifiers'], teacher_moves: 'Ask “How are these the same?” and record the child’s rule in their own words.' },
      { name: 'Art Studio', domains: ['Fine motor', 'Creative arts'], invitation: 'Make leaf rubbings and combine shapes into an imaginary creature.', materials: ['Leaves', 'paper', 'peeled crayons'], teacher_moves: 'Model holding the paper steady, then let children choose placement and colors.' },
      { name: 'Low-Screen Math Mat', domains: ['Math', 'Self-regulation'], invitation: 'Place one leaf in each box, count, and compare which row has more.', materials: ['Printed ten-frame mats', 'leaf counters'], teacher_moves: 'Invite pointing, moving, or spoken responses.' },
    ],
    circle_time: { opening: 'Pass one leaf around and share one noticing word.', read_aloud: 'Choose a familiar fall or nature picture book from the classroom library.', music_movement: 'Move like leaves in slow wind, fast wind, and still air.', shared_wondering: 'Why might leaves look and feel different?' },
    small_group_play: { focus: 'Sorting and explaining a rule', activity: 'Children sort six leaves, photograph or draw the groups, then ask a partner to guess the rule.', teacher_scaffolds: 'Offer two-choice language, gesture to attributes, or model one example without completing the child’s sort.' },
    outdoor_gross_motor: 'Collect or spot leaves on a short walk. Step over, around, and beside marked leaf shapes while using positional words.',
    routines_transitions: 'Call children by an attribute: “If your leaf has a point, walk to wash hands.”',
    observation_look_fors: ['Sorts by one attribute', 'Changes or explains a sorting rule', 'Uses at least one describing word', 'Persists when two leaves could fit more than one group'],
    family_connection: 'Invite families to notice one leaf on the way home and describe its color, edge, or texture. No materials need to be returned.',
    standards_alignment: { naeyc_dap: 'Children learn through active, joyful investigation with multiple ways to participate and communicate.', naeyc_standards: [{ code: 'Standard 1', text: 'Promote child development and learning through responsive, play-based experiences.' }], head_start_elof: [{ domain: 'Cognition', text: 'Uses classification and comparison in everyday exploration.' }] },
    teacher_note: 'Use only clean, non-toxic materials; substitute paper leaves for allergy or sanitation needs.',
  }
}

function interventionPreview(input = {}) {
  const domain = input.domain || 'Reading'
  const concern = input.concern?.trim() || 'Students can read individual short-vowel words but lose accuracy when blending connected text.'
  return {
    title: 'Short-Vowel Blending: Explicit Small-Group Cycle', subject: 'Intervention Planning', domain, tier: 'Tier 2', grade_band: input.gradeBand || '2',
    concern_summary: concern, targeted_skill: 'Blend and read CVC words accurately, then apply the same pattern in a controlled sentence.',
    tier_rationale: 'A brief, explicit small-group cycle with frequent response opportunities is appropriate before considering more intensive individualization.',
    framework_basis: 'Uses explicit modeling, cumulative practice, immediate corrective feedback, and a brief aligned progress measure.',
    intervention_code: { code: 'RD-F-02', name: 'Phoneme blending and decoding', tier: 'Tier 2' },
    udl_alignment: { engagement: 'Students choose one of two practice word sets.', representation: 'Map sounds with counters, letters, and teacher mouth cues.', action_expression: 'Respond by speaking, pointing, building, or writing.' },
    executive_function_supports: [{ skill: 'Working memory', support: 'Keep the three sound boxes visible while blending.' }, { skill: 'Self-monitoring', support: 'Use a check card: sound it, blend it, reread it.' }],
    intervention: { format: '3–5 students', schedule: '15 minutes, 4 times per week for 6 weeks', materials: ['Sound boxes', 'letter tiles', 'controlled word list', 'one-minute probe'], steps: [{ step: 'Hear and map', detail: 'Say a word; students push one counter for each sound.' }, { step: 'Build and blend', detail: 'Replace counters with letters and sweep a finger under the word while blending.' }, { step: 'Read in context', detail: 'Read a controlled sentence containing two practiced words.' }, { step: 'Correct and retry', detail: 'Give the sound, rebuild the word, and return to it after two successful items.' }], teacher_moves: 'Keep the pace brisk, require a response from every student, and praise the strategy rather than speed.' },
    progress_monitoring: { what_to_watch: 'Accurate whole-word blending without added or omitted sounds.', success_indicators: 'At least 90% accuracy across two consecutive controlled probes.', simple_measure: 'Ten-word CVC decoding probe; record correct words and error pattern.', recheck_frequency: 'Weekly under the same conditions.', decision_guidance: 'Continue when the trend is improving; intensify modeling or group size if four data points remain below the aimline.' },
    decision_rules: { goal_aimline: 'Increase from baseline to 9 of 10 correct in six weeks.', measure: 'Parallel ten-word CVC probes', schedule: 'Every Friday', response_criteria: 'Two consecutive scores at or above 90%', decision: 'Generalize to mixed short-vowel text after meeting the criterion.' },
    standards_alignment: [{ framework: 'IDA Structured Literacy', note: 'Explicit, systematic phoneme-grapheme mapping and cumulative decoding practice.' }],
    documentation_note: 'Record group, date, minutes, score, error pattern, and instructional adjustment.', disclaimer: 'Use screening and diagnostic data, district MTSS procedures, and professional judgment when selecting or intensifying intervention.',
  }
}

export async function generateLesson(input) {
  await delay(800)
  return {
    ...sampleKickballLesson,
    title: input.topic || sampleKickballLesson.title,
    unit: input.unit || sampleKickballLesson.unit,
    subject: input.subject,
    grade_bands: input.gradeBands,
    duration_minutes: input.durationMinutes,
    class_size: input.classSize,
  }
}

// The review build only needs these module forms to be navigable. Reuse the
// stable canned lesson response so reviewers can inspect the local UI without
// calling production AI services.
export async function generateArtLesson(input = {}) { await delay(800); return artPreview(input) }
export async function generateMusicLesson(input = {}) { return generateLesson({ ...input, subject: 'Music', gradeBands: input.gradeBands ?? [3] }) }
export async function generateLibraryLesson(input = {}) { return generateLesson({ ...input, subject: 'Library/Media', gradeBands: input.gradeBands ?? [3] }) }
export async function generateMakerProject(input = {}) { return generateLesson({ ...input, subject: 'Library/Media', gradeBands: input.gradeBands ?? [3] }) }
export async function generateCteLesson(input = {}) { await delay(800); return ctePreview(input) }
export async function generateSlp(input = {}) { await delay(800); return slpPreview(input) }
export async function generateIntervention(input = {}) { await delay(800); return interventionPreview(input) }
export async function generateSchoolCounselor(input = {}) { return generateLesson({ ...input, subject: 'School Counselors', gradeBands: input.gradeBands ?? [3] }) }
export async function generateEarlyChildhood(input = {}) { await delay(800); return earlyChildhoodPreview(input) }
export async function generateAdaptivePE(input = {}) { return generateLesson({ ...input, subject: 'Adaptive PE', gradeBands: input.gradeBands ?? [3] }) }
export async function generateStemLesson(input = {}) { return generateLesson({ ...input, subject: 'STEM', gradeBands: input.gradeBands ?? [3] }) }
export async function generateTheater(input = {}) { return generateLesson({ ...input, subject: 'Theater', gradeBands: input.gradeBands ?? [6] }) }
export async function generateDance(input = {}) { return generateLesson({ ...input, subject: 'Dance', gradeBands: input.gradeBands ?? [6] }) }
export async function generateWorldLanguages(input = {}) { return generateLesson({ ...input, subject: 'World Languages', gradeBands: input.gradeBands ?? [6] }) }
export async function generateJrotc(input = {}) { return generateLesson({ ...input, subject: 'JROTC', gradeBands: input.gradeBands ?? [9] }) }
export async function generateElementaryTech(input = {}) { return generateLesson({ ...input, subject: 'Elementary Technology', gradeBands: input.gradeBands ?? [3] }) }
export async function generateEslSpecialist(input = {}) { return generateLesson({ ...input, subject: 'ESL/ELL Specialist', gradeBands: input.gradeBands ?? [3] }) }
export async function generateGiftedTalented(input = {}) { return generateLesson({ ...input, subject: 'Gifted & Talented', gradeBands: input.gradeBands ?? [5] }) }
export async function generateSpecialEducation(input = {}) { return generateLesson({ ...input, subject: 'Special Education', gradeBands: input.gradeBands ?? [5] }) }
export async function generateReadingSpecialist(input = {}) { return generateLesson({ ...input, subject: 'Reading Specialists', gradeBands: input.gradeBands ?? [3] }) }
export async function generateMathSpecialist(input = {}) { return generateLesson({ ...input, subject: 'Math Specialists', gradeBands: input.gradeBands ?? [3] }) }
export async function generateTutoringSession(input = {}) { return generateLesson({ ...input, subject: input.subject || 'Specialist Tutoring', gradeBands: input.gradeBands ?? [3] }) }
export async function generateEcse(input = {}) { return generateLesson({ ...input, subject: 'Early Childhood Special Education', gradeBands: input.gradeBands ?? [0] }) }
export async function generateAfterSchoolClubs(input = {}) { return generateLesson({ ...input, subject: 'After-School Clubs', gradeBands: input.gradeBands ?? [5] }) }
export async function generateOt(input = {}) { return generateLesson({ ...input, subject: 'Occupational Therapists', gradeBands: input.gradeBands ?? [3] }) }
export async function generatePt(input = {}) { return generateLesson({ ...input, subject: 'Physical Therapists', gradeBands: input.gradeBands ?? [3] }) }
export async function generateTvi(input = {}) { return generateLesson({ ...input, subject: 'Teacher of the Visually Impaired', gradeBands: input.gradeBands ?? [3] }) }
export async function generateDhh(input = {}) { return generateLesson({ ...input, subject: 'Teacher of the Deaf & Hard of Hearing', gradeBands: input.gradeBands ?? [3] }) }
export async function generateStaffPd(input = {}) { return generateLesson({ ...input, subject: 'Staff PD & Meeting Planning', gradeBands: [] }) }
export async function generateInstructionalCoaching(input = {}) { return generateLesson({ ...input, subject: 'Instructional Coaching', gradeBands: [] }) }
export async function generateSstActivity(input = {}) { return generateLesson({ ...input, subject: 'Student Support Team Activities', gradeBands: input.gradeBands ?? [6] }) }
export async function generateTestPrep(input = {}) { return generateLesson({ ...input, subject: 'Test Prep', gradeBands: input.gradeBands ?? [10] }) }

export async function generateSubPlan() {
  await delay(800)
  return SUB_PLAN_FIELDS
}

export async function generateFitnessTestPrep(input = {}) {
  return generateLesson({ ...input, topic: input.topic || 'Fitness Test Preparation' })
}

export async function generateYearPlan() {
  await delay(500)
  return { title: 'A Ready-to-Teach Year', overview: 'A balanced year of skill development, fitness, teamwork, and reflection.', units: [] }
}

export async function generateVisualResources() {
  await delay(400)
  return { visual_resources: [
    { type: 'teacher_card', title: 'Teacher Quick-Start Card', supports: 'Teacher use', instructions: 'Print or keep beside the lesson for quick reference.', items: ['State the learning target.', 'Model one complete example.', 'Check for understanding before independent work.', 'Close with one reflection prompt.'] },
    { type: 'student_card', title: 'Student Success Card', supports: 'Student use · large print', instructions: 'Project or print for student reference.', items: ['Listen for the goal.', 'Try the modeled strategy.', 'Ask for a cue when needed.', 'Explain what helped you succeed.'] },
  ] }
}
export async function generateDifferentiatedLesson(_lessonId, type = 'advanced') {
  await delay(400)
  const variants = {
    advanced: { label: 'Advanced', warm_up: 'Add reaction-start sprints.', main_activity: 'Students choose and explain an offensive placement strategy.', materials: 'Strategy cards and cones', assessment: 'Explain one adjustment made during play.', notes: 'Increase decision-making, not just speed.' },
    below_grade: { label: 'Modified', warm_up: 'Walk the base path and rehearse the order.', main_activity: 'Kick from a stationary ball and use shorter base paths.', materials: 'Larger ball, spot marker, closer bases', assessment: 'Demonstrate one safe kick and one ready fielding position.', notes: 'Use peer modeling and extra practice attempts.' },
  }
  return { differentiation: { [type]: variants[type] || variants.below_grade } }
}
export async function generateQuiz() {
  await delay(400)
  return { quiz_questions: { '3': { grade: 3, questions: [
    { type: 'multiple_choice', question: 'Which choice best shows the strategy practiced in this lesson?', options: ['Use the modeled steps', 'Skip the directions', 'Change the goal', 'Wait for someone else'], answer: 'A', explanation: 'The lesson asks students to apply the modeled steps.' },
    { type: 'true_false', question: 'Explaining your choice can show what you understand.', answer: 'True', explanation: 'A brief explanation provides evidence of understanding.' },
    { type: 'short_answer', question: 'Describe one step you would use again.', answer: 'Answers will vary; the response should name a lesson step and its purpose.' },
  ] } } }
}
export async function generateRubric() {
  await delay(400)
  return { rubric: { title: 'Lesson Performance Rubric', level_labels: ['4 - Exceeds', '3 - Meets', '2 - Developing', '1 - Beginning'], criteria: [
    { name: 'Understanding', descriptors: ['Explains the concept and makes a new connection.', 'Explains the concept accurately.', 'Shows partial understanding with a prompt.', 'Needs support to identify the concept.'] },
    { name: 'Application', descriptors: ['Applies the strategy independently and flexibly.', 'Applies the modeled strategy correctly.', 'Applies part of the strategy with support.', 'Does not yet apply the strategy.'] },
    { name: 'Reflection', descriptors: ['Uses specific evidence to evaluate progress.', 'Names a success and next step.', 'Names a general success or difficulty.', 'Needs prompting to reflect.'] },
  ] } }
}
export async function generateWorksheet(_lessonId, requestedFormats = ['fill_blank', 'matching']) {
  await delay(400)
  const samples = {
    fill_blank: { type: 'fill_blank', title: 'Use the Lesson Vocabulary', instructions: 'Complete each sentence with the best word.', items: [{ text: 'The learning ____ tells what you are working toward.', answer: 'target' }, { text: 'A successful strategy is a set of useful ____.', answer: 'steps' }, { text: 'A reflection explains what worked and what to try ____.', answer: 'next' }] },
    matching: { type: 'matching', title: 'Match the Ideas', instructions: 'Write the correct letter beside each term.', pairs: [{ term: 'Target', definition: 'What you are learning' }, { term: 'Strategy', definition: 'Steps that help you succeed' }, { term: 'Evidence', definition: 'Something that shows what you understand' }] },
    word_search: { type: 'word_search', title: 'Lesson Word Search', instructions: 'Find the key lesson words.', words: ['target', 'strategy', 'practice', 'evidence', 'reflect'] },
    multiple_choice: { type: 'multiple_choice', title: 'Quick Practice', instructions: 'Circle the best answer.', questions: [{ question: 'What should you do after seeing a model?', options: ['Try the strategy', 'Ignore the goal', 'Skip practice', 'Change the topic'], answer: 'A' }] },
    research: { type: 'research', title: 'Explore the Topic', instructions: 'Use an approved class source.', overview: 'Connect the lesson idea to a real example.', questions: ['Where is this idea used outside school?', 'What is one fact that supports your answer?'], sources: ['Class text', 'Teacher-approved website', 'Library resource'] },
    cut_paste: { type: 'cut_paste', title: 'Sort the Learning Steps', instructions: 'Cut out the cards and place them in the best category.', mode: 'sort', categories: [{ name: 'Before', items: ['Read the goal', 'Gather materials'] }, { name: 'During', items: ['Use the strategy', 'Check your work'] }, { name: 'After', items: ['Reflect', 'Choose a next step'] }] },
  }
  return { worksheet: { formats: requestedFormats.map((type) => samples[type] ?? { type, applicable: false, reason: 'No preview sample is available for this format.' }) } }
}
export async function generateAnswerKey() { await delay(400); return { answers: [] } }
export async function generateWeatherAlt() { return { weather_alt_notes: 'Move stations indoors and preserve the same learning targets.' } }
export async function generateParentNote() { return { parent_note_intro: 'Today we practiced safe movement, teamwork, and striking skills.', parent_note_skills: ['Safe participation', 'Teamwork'] } }
export async function generateObservationSummary() { return { obs_overview: 'Students practice a standards-aligned skill progression with clear checks for understanding.' } }
export async function generatePoster() { return { poster_content: { title: 'Kickball Cues', steps: ['Plant', 'Swing', 'Follow through'] } } }
export async function generateFamilyNewsletter() { return { family_newsletter: { title: 'This Week in Class', body: 'Students are building safe movement and teamwork skills.' } } }
export async function generateProgressNote() { return { progress_note: { summary: 'Sample progress note for preview.' } } }
export async function generateExitTicket() { return { exit_tickets: [{ prompt: 'Name one safe base-running choice.' }] } }
export async function generateCrossCurricular() { return { connections: [{ subject: 'Math', idea: 'Compare elapsed run times.' }] } }
export async function generateWarmup() { return { warmup_options: [{ title: 'Dynamic base-path warm-up', duration: 8 }] } }
export async function generateBehaviorNote() { return { behavior_note: { summary: 'Sample private behavior documentation.' } } }
export async function generateConferencePrep() { return { conference_prep: { strengths: ['Teamwork'], next_steps: ['Continue skill practice'] } } }
export async function generateIncidentReport() { return { incident_report: { summary: 'Sample incident report for preview.' } } }
export async function generateEoyNarrative() { return { title: 'End-of-Year Narrative', narrative: 'A polished sample end-of-year summary for local preview.' } }
export async function generateActivityBank() { return { title: 'Ready-to-Use Activities', activities: [] } }
export async function generateFieldDay() { return { title: 'Field Day Plan', stations: [] } }
export async function generateImportedLesson(input = {}) { return generateLesson({ ...input, subject: input.subject || 'PE & Health', gradeBands: input.gradeBands ?? [3] }) }
export async function generatePacingGuide() { return { title: 'Pacing Guide', quarters: [] } }
export async function generatePortfolio() { return { title: 'Teaching Portfolio', sections: [] } }
export async function generateLibraryUnit(input = {}) { return generateLesson({ ...input, subject: 'Library/Media', gradeBands: input.gradeBands ?? [3] }) }
