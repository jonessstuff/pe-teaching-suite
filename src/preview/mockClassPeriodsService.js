export const previewPeriods = [
  { id: 'period-4x', label: 'Period 4X', subject: 'PE', grade_bands: [4], class_size: 6, duration_minutes: 45 },
  { id: 'period-art', label: 'Grade 4 Art', subject: 'Art', grade_bands: [4], class_size: 5, duration_minutes: 45 },
]

export async function listPeriods() { return previewPeriods }
export async function createPeriod(values) { const row = { id: `period-${Date.now()}`, ...values }; previewPeriods.push(row); return row }
export async function updatePeriod(id, values) { const row = previewPeriods.find((item) => item.id === id); Object.assign(row, values); return row }
export async function deletePeriod(id) { const index = previewPeriods.findIndex((item) => item.id === id); if (index >= 0) previewPeriods.splice(index, 1) }
