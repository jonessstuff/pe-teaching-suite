import { starterFormat } from '../lib/lessonPlanFormats'
import { OWNER_INSTRUCTIONAL_PRACTICES } from '../constants/instructionalPractices'

const briefFormat = starterFormat('brief-review')

let formats = [{
  id: 'format-gms-brief',
  ...briefFormat,
  name: 'My school brief format',
  sections: briefFormat.sections.map((section) => section.key === 'instructional_practices' ? { ...section, enabled: true, required: true } : section),
  requirement_notes: 'Keep the plan brief and make the Tier 2 response or N/A visible.',
  instructional_practice_bank: OWNER_INSTRUCTIONAL_PRACTICES,
  mtss_goal_bank: [
    { tier: 'tier_1', number: 'T1-001', label: 'Universal modeling and guided practice' },
    { tier: 'tier_1', number: 'T1-002', label: 'Visual directions and frequent checks for understanding' },
    { tier: 'tier_2', number: 'T2-001', label: 'Targeted small-group reteaching' },
    { tier: 'tier_2', number: 'T2-002', label: 'Progress check after targeted practice' },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}]

export { LESSON_FORMAT_SECTIONS, starterSections, starterFormat, parseMtssGoalBank, normalizeMtssGoalNumber } from '../lib/lessonPlanFormats'
export async function listLessonPlanFormats() { return structuredClone(formats) }
export async function getDefaultLessonPlanFormat() { return structuredClone(formats.find((format) => format.is_default) ?? null) }
export async function createLessonPlanFormat(values) {
  if (values.is_default) formats = formats.map((format) => ({ ...format, is_default: false }))
  const format = { id: `format-${Date.now()}`, ...structuredClone(values), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  formats.unshift(format)
  return structuredClone(format)
}
export async function updateLessonPlanFormat(id, values) {
  if (values.is_default) formats = formats.map((format) => ({ ...format, is_default: false }))
  formats = formats.map((format) => format.id === id ? { ...format, ...structuredClone(values), updated_at: new Date().toISOString() } : format)
  return structuredClone(formats.find((format) => format.id === id))
}
export async function setDefaultLessonPlanFormat(id) {
  formats = formats.map((format) => ({ ...format, is_default: format.id === id }))
  return structuredClone(formats.find((format) => format.id === id))
}
export async function deleteLessonPlanFormat(id) { formats = formats.filter((format) => format.id !== id) }
const lessonValues = new Map([['1:format-gms-brief', { mtss_goal_numbers: ['T1-001', 'T1-002'], mtss_notes: '', instructional_practice_ids: ['CE-SCI-RPS-01', 'CE-SCI-STD-03'] }]])
export async function getLessonPlanFormatValues(lessonId, formatId) { return structuredClone(lessonValues.get(`${lessonId}:${formatId}`) ?? null) }
export async function saveLessonPlanFormatValues(lessonId, formatId, values) { const row = { ...structuredClone(values), lesson_id: lessonId, format_id: formatId }; lessonValues.set(`${lessonId}:${formatId}`, row); return structuredClone(row) }
