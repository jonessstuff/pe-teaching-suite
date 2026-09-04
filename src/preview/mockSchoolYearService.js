const dateOffset = (days) => {
  const value = new Date()
  value.setDate(value.getDate() + days)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

const tasks = [
  { id: 'year-task-1', school_year_label: '2026–2027', title: 'Finalize September family fitness night stations', notes: 'Confirm rain plan and volunteer assignments.', module_label: 'PE & Health', category: 'event', priority: 'high', due_date: dateOffset(2), status: 'open', created_at: new Date().toISOString() },
  { id: 'year-task-2', school_year_label: '2026–2027', title: 'Send Grade 4 library challenge family note', notes: null, module_label: 'Library & Media', category: 'communication', priority: 'normal', due_date: dateOffset(4), status: 'open', created_at: new Date().toISOString() },
  { id: 'year-task-3', school_year_label: '2026–2027', title: 'Order replacement cones and two playground balls', notes: 'Use the supply request before purchasing personally.', module_label: 'PE & Health', category: 'supplies', priority: 'normal', due_date: dateOffset(8), status: 'open', created_at: new Date().toISOString() },
  { id: 'year-task-4', school_year_label: '2026–2027', title: 'Save August participation evidence', notes: null, module_label: 'PE & Health', category: 'evidence', priority: 'normal', due_date: dateOffset(-1), status: 'completed', completed_at: new Date().toISOString(), created_at: new Date().toISOString() },
]

export async function listSchoolYearTasks() { return structuredClone(tasks) }
export async function createSchoolYearTask(values) {
  const task = { id: `year-task-${Date.now()}`, school_year_label: values.schoolYearLabel, title: values.title.trim(), notes: values.notes?.trim() || null, module_label: values.moduleLabel || null, category: values.category || 'planning', priority: values.priority || 'normal', due_date: values.dueDate || null, status: 'open', created_at: new Date().toISOString() }
  tasks.push(task)
  return structuredClone(task)
}
export async function updateSchoolYearTask(id, updates) { const task = tasks.find((item) => item.id === id); Object.assign(task, updates, { updated_at: new Date().toISOString() }); return structuredClone(task) }
export async function setSchoolYearTaskComplete(task, completed) { return updateSchoolYearTask(task.id, { status: completed ? 'completed' : 'open', completed_at: completed ? new Date().toISOString() : null }) }
export async function archiveSchoolYearTask(id) { return updateSchoolYearTask(id, { status: 'archived' }) }
