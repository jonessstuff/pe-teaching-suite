const assessments = []

export async function listAssessments() { return assessments }
export async function deleteAssessment(id) {
  const index = assessments.findIndex((item) => item.id === id)
  if (index >= 0) assessments.splice(index, 1)
}
export async function saveAssessment(assessment) {
  const row = { id: `assessment-${Date.now()}`, ...assessment }
  assessments.push(row)
  return row
}
export async function createAssessment(assessment) { return saveAssessment(assessment) }
