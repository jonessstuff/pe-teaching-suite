import { previewStudents } from './mockStudentsService.js'

const now = new Date().toISOString()
const goals = [{
  id: 'goal-1', scope: 'class', class_period_id: 'period-4x', grade_label: null, subject: 'PE & Health',
  title: 'Improve cardiovascular endurance',
  specific_statement: 'By October 15, Period 4X will decrease average half-mile run time from 12:00 to 11:00, as measured by teacher progress checks and the PlansK12 Run Tracker.',
  metric_name: 'average half-mile run time', metric_unit: 'seconds', direction: 'decrease', baseline_value: 720, target_value: 660,
  target_date: '2026-10-15', status: 'active', source_type: 'run_tracker', source_label: 'Half-mile', created_at: now,
  smart_goal_updates: [
    { id: 'update-1', goal_id: 'goal-1', student_id: null, observed_at: '2026-08-20', value: 720, note: 'Baseline run' },
    { id: 'update-2', goal_id: 'goal-1', student_id: null, observed_at: '2026-08-27', value: 694, note: 'Second class run · steadier pacing' },
  ],
  smart_goal_students: previewStudents.slice(0, 4).map((student, index) => ({ id: `student-goal-${index}`, goal_id: 'goal-1', student_id: student.id, students: student, baseline_value: 720 + index * 12, target_value: 660 + index * 8, current_value: 694 + index * 10, status: 'active' })),
}, {
  id: 'goal-library-1', scope: 'grade', class_period_id: null, grade_label: '4', subject: 'Library & Media',
  title: 'Strengthen research and source evaluation',
  specific_statement: 'By October 30, Grade 4 students will increase independent use of the research criteria from 40% to 80%, as measured by source-evaluation checks and student research organizers.',
  metric_name: 'students independently meeting the research criteria', metric_unit: 'percent', direction: 'increase', baseline_value: 40, target_value: 80,
  target_date: '2026-10-30', status: 'active', source_type: 'manual', source_label: null, created_at: now,
  smart_goal_updates: [
    { id: 'update-library-1', goal_id: 'goal-library-1', student_id: null, observed_at: '2026-08-21', value: 40, note: 'Baseline source check' },
    { id: 'update-library-2', goal_id: 'goal-library-1', student_id: null, observed_at: '2026-08-28', value: 56, note: 'Students used the source checklist independently' },
  ],
  smart_goal_students: [],
}]

export async function listSmartGoals() { return structuredClone(goals) }
export async function createSmartGoal(goal, studentIds = []) {
  const id = `goal-${Date.now()}`
  const row = { id, scope: goal.scope, class_period_id: goal.classPeriodId || null, grade_label: goal.gradeLabel || null, subject: goal.subject, title: goal.title, specific_statement: goal.specificStatement, metric_name: goal.metricName, metric_unit: goal.metricUnit, direction: goal.direction, baseline_value: Number(goal.baselineValue), target_value: Number(goal.targetValue), target_date: goal.targetDate, status: 'active', source_type: goal.sourceType || 'manual', source_label: goal.sourceLabel || null, created_at: new Date().toISOString(), smart_goal_updates: [], smart_goal_students: studentIds.map((studentId, index) => { const student = previewStudents.find((item) => item.id === studentId); return { id: `student-goal-${Date.now()}-${index}`, goal_id: id, student_id: studentId, students: student, baseline_value: Number(goal.baselineValue), target_value: Number(goal.targetValue), current_value: Number(goal.baselineValue), status: 'active' } }) }
  goals.push(row); return row
}
export async function addSmartGoalUpdate({ goalId, value, observedAt, note, studentId = null }) { const goal = goals.find((item) => item.id === goalId); const update = { id: `update-${Date.now()}`, goal_id: goalId, student_id: studentId, value: Number(value), observed_at: observedAt, note }; goal.smart_goal_updates.push(update); return update }
export async function updateSmartGoalStatus(goalId, status) { const goal = goals.find((item) => item.id === goalId); goal.status = status; return goal }
export async function updateStudentGoal({ goalId, studentId, currentValue, targetValue, status, notes }) { const goal = goals.find((item) => item.id === goalId); const studentGoal = goal.smart_goal_students.find((item) => item.student_id === studentId); Object.assign(studentGoal, { current_value: Number(currentValue), target_value: Number(targetValue), status, notes }); return studentGoal }
export async function getRunTrackerClassProgress() { return { baseline: { observedAt: '2026-08-20', value: 720, studentCount: 6 }, current: { observedAt: new Date().toISOString().slice(0, 10), value: 681, studentCount: 6 }, observations: [] } }
