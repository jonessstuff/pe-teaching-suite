export const previewStudents = [
  ['student-1', 'Avery M.', 4, 'period-4x'], ['student-2', 'Jordan R.', 4, 'period-4x'], ['student-3', 'Casey L.', 4, 'period-4x'],
  ['student-4', 'Morgan T.', 4, 'period-4x'], ['student-5', 'Riley K.', 4, 'period-4x'], ['student-6', 'Taylor S.', 4, 'period-4x'],
].map(([id, name_or_initials, grade, class_period_id]) => ({ id, name_or_initials, grade, class_period_id, accommodation_type: 'None' }))

export async function listStudents() { return previewStudents }
export async function listStudentsByPeriod(id) { return previewStudents.filter((student) => student.class_period_id === id) }
export async function createStudent(values) { const row = { id: `student-${Date.now()}`, ...values }; previewStudents.push(row); return row }
export async function createStudents(rows) { const created = rows.map((row, index) => ({ id: `student-${Date.now()}-${index}`, ...row })); previewStudents.push(...created); return created }
export async function updateStudent(id, values) { const row = previewStudents.find((item) => item.id === id); Object.assign(row, values); return row }
export async function deleteStudent(id) { const index = previewStudents.findIndex((item) => item.id === id); if (index >= 0) previewStudents.splice(index, 1) }
