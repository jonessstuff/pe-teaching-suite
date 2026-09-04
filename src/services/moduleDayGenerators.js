// Shared per-module day-generation dispatch.
//
// Both the Long-Term Sub Binder and the sequential Unit Builder generate a
// content-delivery module's lesson ONE day at a time by calling that module's
// own generator with its real required params. This module centralizes the
// subject catalog, the grade model, the per-module option lists, and the two
// dispatch functions so the two features can't drift apart.
//
// Non-evaluative / clinical modules (OT, PT, SLP, TVI, D/HH, School Counselors,
// Intervention, SST) are intentionally absent — they don't produce day-by-day
// class lessons, so neither the Sub Binder nor the Unit Builder offers them.
import {
  generateLesson,
  generateLibraryLesson,
  generateArtLesson,
  generateMusicLesson,
  generateStemLesson,
  generateTheater,
  generateDance,
  generateWorldLanguages,
  generateJrotc,
  generateElementaryTech,
  generateEslSpecialist,
  generateGiftedTalented,
  generateSpecialEducation,
  generateCteLesson,
  generateReadingSpecialist,
  generateMathSpecialist,
  generateEarlyChildhood,
} from './generationService'

// Original six modules use the PE-shaped generator path (numeric grade band(s) +
// a single `topic` prompt).
export const CORE_SUBJECTS = ['PE & Health', 'Library & Media', 'Art', 'Music', 'STEM', 'Adaptive PE']

// Newer content-lesson modules → grade input model + which extra required params
// to collect. grade: 'k12' | 'k5' numeric toggle, or 'none' for modules that use
// their own level model (JROTC LET level, CTE tier, Early Childhood age group).
// Each key is the canonical lesson_object.subject string (must match LESSON_RENDERERS).
export const NEWER_SUBJECTS = {
  'Theater':               { grade: 'k12', extras: [] },
  'Dance':                 { grade: 'k12', extras: [] },
  'World Languages':       { grade: 'k12', extras: ['targetLanguage', 'wlLevel'] },
  'JROTC':                 { grade: 'none', extras: ['letLevel'] },
  'Elementary Technology': { grade: 'k5',  extras: [] },
  'ESL/ELL Specialist':    { grade: 'k12', extras: [] },
  'Gifted & Talented':     { grade: 'k12', extras: [] },
  'Special Education':     { grade: 'k12', extras: [] },
  'CTE':                   { grade: 'none', extras: ['cte'] },
  'Reading Specialists':   { grade: 'k12', extras: ['readingSkill'] },
  'Math Specialists':      { grade: 'k12', extras: [] },
  'Early Childhood':       { grade: 'none', extras: ['ecAge'] },
}

// Every content-delivery subject, in catalog order (originals first).
export const CONTENT_SUBJECTS = [...CORE_SUBJECTS, ...Object.keys(NEWER_SUBJECTS)]

export function isK12Subject(subj) {
  return subj === 'PE & Health' || subj === 'Adaptive PE'
}

// 'k12' | 'k5' | 'none' — which grade input a subject uses.
export function gradeModel(subject) {
  if (NEWER_SUBJECTS[subject]) return NEWER_SUBJECTS[subject].grade
  return isK12Subject(subject) ? 'k12' : 'k5'
}

// Numeric K-12 grade → the band string the newer generators expect.
export function numToBand(n) {
  if (n == null) return '9-12'
  if (n <= 2) return 'k-2'
  if (n <= 5) return '3-5'
  if (n <= 8) return '6-8'
  return '9-12'
}

// ── Grade + per-module option lists ─────────────────────────────────────────

export const K5_GRADES = [
  { value: 0, label: 'K' }, { value: 1, label: '1' }, { value: 2, label: '2' },
  { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' },
]

export const K12_GRADES = [
  { value: 0, label: 'K' }, { value: 1, label: '1' }, { value: 2, label: '2' },
  { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' },
  { value: 6, label: '6' }, { value: 7, label: '7' }, { value: 8, label: '8' },
  { value: 9, label: '9' }, { value: 10, label: '10' }, { value: 11, label: '11' },
  { value: 12, label: '12' },
]

export const STEM_FOCUS_AREAS = [
  { value: 'engineering', label: 'Engineering Design' },
  { value: 'coding', label: 'Coding & CS' },
  { value: 'science', label: 'Science Investigation' },
  { value: 'maker', label: 'Maker / Tinkering' },
]

export const LET_LEVELS = ['LET 1', 'LET 2', 'LET 3', 'LET 4']

export const CTE_PATHWAYS = [
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'human_services', label: 'Human Services / FCS' },
  { value: 'health_science', label: 'Health Science' },
  { value: 'education', label: 'Education & Training' },
  { value: 'career_readiness', label: 'Career Readiness' },
  { value: 'information_technology', label: 'Information Technology' },
  { value: 'transportation', label: 'Transportation, Distribution & Logistics' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'engineering_tech', label: 'STEM / Engineering & Technology' },
  { value: 'business_mgmt', label: 'Business Management & Administration' },
  { value: 'agriculture', label: 'Agriculture, Food & Natural Resources' },
  { value: 'construction', label: 'Architecture & Construction' },
  { value: 'arts_av', label: 'Arts, A/V Technology & Communications' },
  { value: 'government', label: 'Government & Public Administration' },
  { value: 'law_safety', label: 'Law, Public Safety, Corrections & Security' },
  { value: 'cosmetology', label: 'Cosmetology / Personal Care Services' },
  { value: 'business_law', label: 'Business Law' },
  { value: 'sports_entertainment', label: 'Sports & Entertainment Marketing' },
  { value: 'exercise_science', label: 'Exercise Science / Sports Medicine' },
  { value: 'early_childhood', label: 'Early Childhood Education & Services' },
]
export const CTE_LEVELS = [
  { value: 'introductory', label: 'Introductory' },
  { value: 'concentrator', label: 'Concentrator' },
  { value: 'completer', label: 'Completer' },
]
export const READING_SKILLS = [
  'Phonological & Phonemic Awareness',
  'Phonics & Word Recognition (Decoding)',
  'Reading Fluency',
  'Vocabulary',
  'Reading Comprehension',
  'Written Expression',
]
export const EC_AGE_GROUPS = [
  { value: 'toddler', label: 'Toddlers (about 2s)' },
  { value: 'preschool3', label: 'Preschool (3s)' },
  { value: 'prek4', label: 'Pre-K (4s)' },
  { value: 'tk5', label: 'Transitional K (older 5s)' },
]

// ── Generator dispatch ──────────────────────────────────────────────────────

// Original six: takes a PE-shaped payload ({ gradeBands: number[], topic, classSize,
// durationMinutes, state }). gradeBands may hold one grade (Sub Binder) or several
// (a Unit Builder multi-band lesson).
export async function callCoreDayGenerator(subject, stemFocusArea, payload) {
  switch (subject) {
    case 'Library & Media':
      return generateLibraryLesson(payload)
    case 'Art':
      return generateArtLesson(payload)
    case 'Music':
      return generateMusicLesson(payload)
    case 'STEM':
      return generateStemLesson({ focusArea: stemFocusArea, ...payload })
    default:
      // PE & Health and Adaptive PE both use the general lesson generator.
      return generateLesson({ subject, ...payload })
  }
}

// Newer modules: each calls its OWN generator with its real required params.
// `focus` is the day's instructional topic + sequence position; `notes` carries
// any extra framing (substitute context, or unit progression). `band` is unused
// for the 'none'-grade modules (JROTC/CTE/Early Childhood).
export async function callNewerDayGenerator(subject, { band, focus, notes, duration, classSize, state, extra, clientHandlesRetry = false }) {
  const retryMarker = clientHandlesRetry ? { __clientHandlesRetry: true } : {}
  switch (subject) {
    case 'Theater':
      return generateTheater({ ...retryMarker, gradeBand: band, artisticProcess: 'creating', hsTier: 'proficient', focus, durationMinutes: duration, teacherNotes: notes })
    case 'Dance':
      return generateDance({ ...retryMarker, gradeBand: band, artisticProcess: 'creating', hsTier: 'proficient', focus, durationMinutes: duration, teacherNotes: notes })
    case 'World Languages':
      return generateWorldLanguages({ ...retryMarker, targetLanguage: extra.targetLanguage, gradeBand: band, proficiencyLevel: extra.wlLevel, theme: focus, sessionLengthMinutes: duration, teacherNotes: notes })
    case 'JROTC':
      return generateJrotc({ ...retryMarker, topic: focus, letLevel: extra.letLevel, contentArea: 'leadership_fundamentals', durationMinutes: duration, notes })
    case 'Elementary Technology':
      return generateElementaryTech({ ...retryMarker, topic: focus, gradeBand: band, contentArea: '', durationMinutes: duration, teacherNotes: notes })
    case 'ESL/ELL Specialist':
      return generateEslSpecialist({ ...retryMarker, topic: focus, gradeBand: band, proficiencyLevel: 'developing', contentArea: '', durationMinutes: duration, homeLanguages: '', teacherNotes: notes })
    case 'Gifted & Talented':
      return generateGiftedTalented({ ...retryMarker, mode: 'differentiate', gradeBand: band, topic: focus, contentArea: '', teacherNotes: notes })
    case 'Special Education':
      return generateSpecialEducation({ ...retryMarker, mode: 'multitier', gradeBand: band, topic: focus, contentArea: '', teacherNotes: notes })
    case 'CTE':
      return generateCteLesson({
        ...retryMarker,
        pathway: extra.ctePathway, tier: extra.cteTier, level: extra.cteTier === 'hs' ? extra.cteLevel : '',
        topic: focus, materials: [], classSize, durationMinutes: duration, targetCompetency: '', state,
        sessionNumber: 0, totalSessions: 0, includeELL: false,
      })
    case 'Reading Specialists':
      return generateReadingSpecialist({ ...retryMarker, skillArea: extra.readingSkill, gradeBand: band, focus, durationMinutes: duration, groupSize: 'Whole class', studentPattern: '', teacherNotes: notes, handsOn: false })
    case 'Math Specialists':
      return generateMathSpecialist({ ...retryMarker, topic: focus, gradeBand: band, domain: '', setting: 'differentiation', focus: '', durationMinutes: duration, studentContext: '', teacherNotes: notes, handsOn: false })
    case 'Early Childhood':
      return generateEarlyChildhood({ ...retryMarker, studyTheme: focus, ageGroup: extra.ecAgeGroup, programType: 'general', teacherNotes: notes })
    default:
      throw new Error(`No day-generator for module: ${subject}`)
  }
}
