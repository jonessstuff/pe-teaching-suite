let challenges = [{
  id: 'reading-challenge-preview-1',
  teacher_id: 'preview-user',
  title: 'Read Around the World',
  theme: 'around-the-world',
  scope: 'class',
  metric: 'books',
  target_mode: 'collective',
  goal_value: 40,
  grade_label: '4',
  class_period_ids: ['period-library'],
  starts_on: '2026-08-24',
  ends_on: '2026-09-25',
  status: 'active',
  progress: {
    'student-7': 5,
    'student-8': 4,
    'student-9': 6,
    'student-10': 3,
    'student-11': 4,
  },
  logs: [
    { id: 'log-1', student_id: 'student-9', amount: 1, book_title: 'The Wild Robot', genre: 'Science fiction', logged_on: '2026-08-29' },
    { id: 'log-2', student_id: 'student-7', amount: 1, book_title: 'Because of Winn-Dixie', genre: 'Realistic fiction', logged_on: '2026-08-29' },
  ],
  updated_at: new Date().toISOString(),
}]

export async function listReadingChallenges() {
  return structuredClone(challenges)
}

export async function createReadingChallenge(values) {
  const row = {
    id: `reading-${Date.now()}`,
    teacher_id: 'preview-user',
    title: values.title,
    theme: values.theme,
    scope: values.scope,
    metric: values.metric,
    target_mode: values.targetMode,
    goal_value: Number(values.goalValue),
    grade_label: values.gradeLabel || null,
    class_period_ids: values.classPeriodIds ?? [],
    starts_on: values.startsOn,
    ends_on: values.endsOn,
    status: 'active',
    progress: {},
    logs: [],
    updated_at: new Date().toISOString(),
  }
  challenges = [row, ...challenges]
  return structuredClone(row)
}

export async function updateReadingChallenge(id, updates) {
  const row = challenges.find((item) => item.id === id)
  Object.assign(row, structuredClone(updates), { updated_at: new Date().toISOString() })
  return structuredClone(row)
}
