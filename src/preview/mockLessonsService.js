import { sampleKickballLesson } from '../types/sampleLesson'

/**
 * Mock lessonsService for the standalone preview build.
 * Mirrors the real service's exported function signatures but uses
 * in-memory data instead of Supabase.
 */

const now = new Date().toISOString()

const lessons = [
  {
    id: '1',
    teacher_id: 'preview-user',
    title: 'Kickball Day 1',
    subject: 'PE',
    grade_bands: [6, 7, 8],
    duration_minutes: 45,
    scheduled_date: '2026-06-15',
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
    scheduled_date: '2026-06-16',
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
    scheduled_date: '2026-06-17',
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
    scheduled_date: '2026-06-18',
    period_label: 'Period 4',
    lesson_object: { ...sampleKickballLesson, title: 'Defensive Driving Intro', unit: 'Road Safety', subject: "Driver's Ed", grade_bands: [9, 10, 11, 12] },
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
