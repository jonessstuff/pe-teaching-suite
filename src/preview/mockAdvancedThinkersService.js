let curricula = []

export async function listAdvancedThinkersCurricula() { return structuredClone(curricula) }

export async function createAdvancedThinkersCurriculum(values) {
  const row = { id: `advanced-${curricula.length + 1}`, title: values.title, grade_band: values.gradeBand, weeks: values.weeks, inputs: structuredClone(values.inputs), curriculum: structuredClone(values.curriculum), updated_at: new Date().toISOString() }
  curricula = [row, ...curricula]
  return structuredClone(row)
}
