import { sampleKickballLesson } from '../types/sampleLesson'

/**
 * Mock lessonsService for the standalone preview build.
 * Mirrors the real service's exported function signatures but uses
 * in-memory data instead of Supabase.
 */

const now = new Date().toISOString()
const dateOffset = (days) => {
  const value = new Date()
  value.setDate(value.getDate() + days)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

const lessons = [
  {
    id: '1',
    teacher_id: 'preview-user',
    title: 'Kickball Day 1',
    subject: 'PE',
    grade_bands: [6, 7, 8],
    duration_minutes: 45,
    scheduled_date: dateOffset(0),
    period_label: 'Period 1',
    lesson_object: sampleKickballLesson,
    created_at: now,
    updated_at: now,
  },
  {
    id: '2',
    teacher_id: 'preview-user',
    title: 'Volleyball Bump & Set',
    subject: 'PE',
    grade_bands: [6, 7, 8],
    duration_minutes: 45,
    scheduled_date: dateOffset(1),
    period_label: 'Period 2',
    lesson_object: { ...sampleKickballLesson, title: 'Volleyball Bump & Set', unit: 'Net Games' },
    created_at: now,
    updated_at: now,
  },
  {
    id: '3',
    teacher_id: 'preview-user',
    title: 'Nutrition Basics',
    subject: 'Health',
    grade_bands: [6, 7, 8],
    duration_minutes: 45,
    scheduled_date: dateOffset(3),
    period_label: 'Period 3',
    lesson_object: { ...sampleKickballLesson, title: 'Nutrition Basics', unit: 'Nutrition', subject: 'Health' },
    created_at: now,
    updated_at: now,
  },
  {
    id: '4',
    teacher_id: 'preview-user',
    title: 'Defensive Driving Intro',
    subject: "Driver's Ed",
    grade_bands: [9, 10, 11, 12],
    duration_minutes: 50,
    scheduled_date: dateOffset(6),
    period_label: 'Period 4',
    lesson_object: { ...sampleKickballLesson, title: 'Defensive Driving Intro', unit: 'Road Safety', subject: "Driver's Ed", grade_bands: [9, 10, 11, 12] },
    created_at: now,
    updated_at: now,
  },
  {
    id: '5',
    teacher_id: 'preview-user',
    title: 'Professional Communication: Workplace Introductions',
    subject: 'CTE',
    grade_bands: [9, 10],
    duration_minutes: 55,
    scheduled_date: dateOffset(0),
    period_label: 'Period 2',
    lesson_object: { ...sampleKickballLesson, title: 'Professional Communication: Workplace Introductions', unit: 'Employability Skills', subject: 'CTE', grade_bands: [9, 10], standards: [{ code: '21.2', text: 'Demonstrate professional communication and workplace-readiness skills.' }], learning_targets: ['I can introduce myself professionally and adjust my communication for a workplace audience.'], success_criteria: ['Use an appropriate greeting and introduction.', 'Maintain professional body language.', 'Respond to a follow-up question clearly.'], warm_up: 'Compare two sample introductions and identify which sounds more professional.', whole_group_instruction: 'Model the greeting, name, role or interest, and follow-up question in a concise workplace introduction.', fitness_activities: 'Students rotate through partner scenarios for a job fair, first day at work, and customer greeting.', closure: 'Students complete a self-check and name one communication choice they will improve.', evidence_of_learning: 'Teacher observation checklist, partner feedback, and a final 30-second introduction.', equipment_needed: ['Workplace scenario cards', 'Communication checklist'], tier1_supports: ['Display a visual introduction frame and model one complete example.'], tier2_supports: ['Rehearse with the teacher in a small group before the final introduction.'] },
    created_at: now,
    updated_at: now,
  },
  {
    id: '6',
    teacher_id: 'preview-user',
    title: 'Dollars & Sense: Building a Monthly Budget',
    subject: 'CTE',
    grade_bands: [8, 9],
    duration_minutes: 55,
    scheduled_date: dateOffset(2),
    period_label: 'Period 4',
    lesson_object: { ...sampleKickballLesson, title: 'Dollars & Sense: Building a Monthly Budget', unit: 'Financial Literacy', subject: 'CTE', grade_bands: [8, 9], standards: [{ code: 'FIN.4', text: 'Create and evaluate a personal spending and savings plan.' }], learning_targets: ['I can build a balanced monthly budget using income, fixed expenses, and variable expenses.'], success_criteria: ['Categorize common monthly expenses.', 'Calculate remaining income accurately.', 'Explain one responsible budget decision.'], warm_up: 'Sort six expenses into needs, wants, fixed costs, and variable costs.', whole_group_instruction: 'Model a monthly budget and demonstrate how to calculate the remaining balance.', fitness_activities: 'Teams complete a realistic household budget scenario and respond to one unexpected expense card.', closure: 'Students explain one adjustment that keeps their budget balanced.', evidence_of_learning: 'Completed budget sheet, calculation check, and a written financial decision.', equipment_needed: ['Budget scenario cards', 'Calculator or spreadsheet', 'Monthly budget template'], tier1_supports: ['Use a color-coded budget model and provide a completed example.'], tier2_supports: ['Use a reduced-number budget and guided calculation check with the teacher.'] },
    created_at: now,
    updated_at: now,
  },
]

export async function listLessons() {
  return lessons
}

export async function getLesson(id) {
  const lesson = lessons.find((l) => l.id === id)
  if (!lesson) throw new Error('Lesson not found')
  return lesson
}

export async function createLesson(lessonObject, meta = {}) {
  const id = String(lessons.length + 1)
  const row = {
    id,
    teacher_id: 'preview-user',
    title: lessonObject.title,
    subject: lessonObject.subject,
    grade_bands: lessonObject.grade_bands,
    duration_minutes: lessonObject.duration_minutes,
    scheduled_date: null,
    period_label: null,
    lesson_object: lessonObject,
    ai_model: meta.aiModel ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  lessons.push(row)
  return row
}

export async function createUnit({ name, subject, gradeBands }) {
  return { id: `unit-${Date.now()}`, name, subject, grade_bands: gradeBands }
}

export async function updateLesson(id, { lessonObject, meta = {} } = {}) {
  const lesson = lessons.find((l) => l.id === id)
  if (!lesson) throw new Error('Lesson not found')

  if (lessonObject) {
    lesson.lesson_object = { ...lesson.lesson_object, ...lessonObject }
  }
  Object.assign(lesson, meta)
  lesson.updated_at = new Date().toISOString()
  return lesson
}

export async function deleteLesson(id) {
  const index = lessons.findIndex((l) => l.id === id)
  if (index !== -1) lessons.splice(index, 1)
}

export async function saveSubPlan(id, subPlanFields) {
  return updateLesson(id, { lessonObject: subPlanFields })
}

export async function deleteUnit(unit) {
  for (let i = lessons.length - 1; i >= 0; i -= 1) if (lessons[i].lesson_object?.unit === unit) lessons.splice(i, 1)
}

export async function duplicateLesson(id) {
  const source = await getLesson(id)
  return createLesson({ ...source.lesson_object, title: `${source.title} (Copy)` })
}

export async function updateTags(id, tags) {
  return updateLesson(id, { meta: { tags } })
}

export async function toggleFavorite(id) {
  const lesson = await getLesson(id)
  lesson.is_favorite = !lesson.is_favorite
  return lesson
}
