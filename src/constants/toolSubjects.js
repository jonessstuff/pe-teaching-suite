// Subject lists for the shared dashboard tools (Assessment Bank, Standards
// Tracker, Pacing Guide, Activity Bank, EOY Narrative, Portfolio). Phase 3
// expands these beyond the original six modules, respecting the same
// content-delivery vs. non-evaluative gating as the per-lesson tools.
//
// Values are the `subject` strings modules actually save (so filter tools
// match saved lessons/assessments, and generation tools frame `${subject}`
// naturally).

// Already offered by the original tools.
const ORIGINAL = ['PE & Health', 'Adaptive PE', 'Art', 'Library & Media', 'Music', 'STEM']

// Content-delivery specialists that produce gradable, standards-based lessons.
const CONTENT_SPECIALISTS = [
  'Theater', 'Dance', 'World Languages', 'JROTC', 'Elementary Technology',
  'ESL/ELL Specialist', 'Gifted & Talented', 'Reading Specialists',
  'Math Specialists', 'Special Education', 'CTE', 'Test Prep',
]

// Deliver lessons/activities to students, but not standard graded assessments.
const OTHER_TEACHING = ['School Counselors', 'Early Childhood', 'After-School Clubs']

// Activity-idea / clinical / non-evaluative / adult-facing — no gradable
// delivered content (get professional tools only, never Assessment/Standards).
const NON_TEACHING = [
  'Occupational Therapists', 'Physical Therapists', 'Speech-Language Pathologists',
  'Teacher of the Visually Impaired', 'Teacher of the Deaf & Hard of Hearing',
  'Student Support Team Activities', 'Intervention Planning',
  'Staff PD & Meeting Planning', 'Instructional Coaching',
]

// Assessment Bank + Standards Tracker: content-delivery, gradable subjects only
// (same non-evaluative exclusion as the Quiz/Rubric gating).
export const ASSESSABLE_SUBJECTS = [...ORIGINAL, ...CONTENT_SPECIALISTS]

// Pacing Guide + Activity Bank: any subject that plans/runs lessons or activities.
export const PLANNING_SUBJECTS = [...ORIGINAL, ...CONTENT_SPECIALISTS, ...OTHER_TEACHING]

// EOY Narrative + Portfolio: any teacher/specialist writes these.
export const ALL_TEACHER_SUBJECTS = [...ORIGINAL, ...CONTENT_SPECIALISTS, ...OTHER_TEACHING, ...NON_TEACHING]
