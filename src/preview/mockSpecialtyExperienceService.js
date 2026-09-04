let rows = []

export async function listSpecialtyExperiences(experienceType, moduleLabel = null) {
  return structuredClone(rows.filter((item) => item.experience_type === experienceType && (!moduleLabel || item.module_label === moduleLabel)))
}

export async function createSpecialtyExperience(values) {
  const row = {
    id: `specialty-event-${rows.length + 1}`,
    experience_type: values.experienceType,
    module_label: values.moduleLabel,
    title: values.title,
    inputs: structuredClone(values.inputs),
    plan: structuredClone(values.plan),
    status: values.status ?? 'active',
    updated_at: new Date().toISOString(),
  }
  rows = [row, ...rows]
  return structuredClone(row)
}

export async function updateSpecialtyExperience(id, values) {
  const row = rows.find((item) => item.id === id)
  if (!row) throw new Error('Saved experience not found')
  Object.assign(row, { title: values.title, inputs: structuredClone(values.inputs), plan: structuredClone(values.plan), status: values.status ?? row.status, updated_at: new Date().toISOString() })
  return structuredClone(row)
}
