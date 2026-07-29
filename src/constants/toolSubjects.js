// Subject lists for the shared dashboard tools (Assessment Bank, Standards
// Tracker, Pacing Guide, Activity Bank, EOY Narrative, Portfolio). Phase 3
// expands these beyond the original six modules, respecting the same
// content-delivery vs. non-evaluative gating as the per-lesson tools.
//
// Values are MODULE labels (matching MODULES[].label in constants/modules.js).
// For most modules the label IS the saved `subject` string; but two module labels
// own differently-named saved subjects — 'PE & Health' owns 'PE'/'Health'/'Family
// Life'/"Driver's Ed"/'Strength & Conditioning', and 'Library & Media' owns
// 'Library/Media'. So FILTER tools (Assessment Bank, Standards Tracker) must match
// via subjectMatchesFilter() from constants/modules.js, NOT an exact string ===,
// or those lessons are silently hidden. Generation tools frame `${label}` directly.

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
  'Early Childhood Special Education',
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
