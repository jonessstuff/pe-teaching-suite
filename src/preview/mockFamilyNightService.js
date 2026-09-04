let rows = []
export async function listFamilyNightProjects(type) { return structuredClone(rows.filter((item) => item.night_type === type)) }
export async function createFamilyNightProject(values) { const row = { id: `family-night-${rows.length + 1}`, night_type: values.type, title: values.title, inputs: structuredClone(values.inputs), plan: structuredClone(values.plan), updated_at: new Date().toISOString() }; rows = [row, ...rows]; return structuredClone(row) }
export async function updateFamilyNightProject(id, values) { const row = rows.find((item) => item.id === id); Object.assign(row, { title: values.title, inputs: structuredClone(values.inputs), plan: structuredClone(values.plan), updated_at: new Date().toISOString() }); return structuredClone(row) }
