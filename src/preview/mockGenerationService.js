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
export async function generateArtLesson(input = {}) { return generateLesson({ ...input, subject: 'Art', gradeBands: input.gradeBands ?? [3] }) }
export async function generateMusicLesson(input = {}) { return generateLesson({ ...input, subject: 'Music', gradeBands: input.gradeBands ?? [3] }) }
export async function generateLibraryLesson(input = {}) { return generateLesson({ ...input, subject: 'Library/Media', gradeBands: input.gradeBands ?? [3] }) }
export async function generateMakerProject(input = {}) { return generateLesson({ ...input, subject: 'Library/Media', gradeBands: input.gradeBands ?? [3] }) }
export async function generateCteLesson(input = {}) { return generateLesson({ ...input, subject: 'CTE', gradeBands: [] }) }
export async function generateSlp(input = {}) { return generateLesson({ ...input, subject: 'Speech-Language Pathologists', gradeBands: input.gradeBands ?? [3] }) }
export async function generateIntervention(input = {}) { return generateLesson({ ...input, subject: 'Intervention Planning', gradeBands: input.gradeBands ?? [3] }) }
export async function generateSchoolCounselor(input = {}) { return generateLesson({ ...input, subject: 'School Counselors', gradeBands: input.gradeBands ?? [3] }) }
export async function generateEarlyChildhood(input = {}) { return generateLesson({ ...input, subject: 'Early Childhood', gradeBands: input.gradeBands ?? [0] }) }
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
    { type: 'teacher_card', title: 'Kickball Setup & Teaching Cues', supports: 'Teacher use', instructions: 'Print or keep courtside for quick reference.', items: ['Set four bases with clear running lanes.', 'Cue: plant beside the ball, swing through, follow through.', 'Freeze signal: two whistle blasts.'] },
    { type: 'student_card', title: 'Safe Base Running', supports: 'Student use · large print', instructions: 'Post beside home plate.', items: ['Look before running.', 'Run through first base.', 'No sliding.', 'Encourage your teammates.'] },
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
export async function generateQuiz() { await delay(400); return { questions: [] } }
export async function generateRubric() { await delay(400); return { criteria: [] } }
export async function generateWorksheet() { await delay(400); return { title: 'Student Practice Page', sections: [] } }
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
