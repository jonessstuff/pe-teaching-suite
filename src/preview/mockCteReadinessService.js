let rows = []

export async function listCteReadinessKits() { return structuredClone(rows) }

export async function createCteReadinessKit(values) {
  const row = { id: `cte-kit-${rows.length + 1}`, tool_type: values.toolType, title: values.title, inputs: structuredClone(values.inputs), output: structuredClone(values.output), updated_at: new Date().toISOString() }
  rows = [row, ...rows]
  return structuredClone(row)
}

export async function updateCteReadinessKit(id, values) {
  const row = rows.find((item) => item.id === id)
  if (!row) throw new Error('Saved CTE kit not found')
  Object.assign(row, { title: values.title, inputs: structuredClone(values.inputs), output: structuredClone(values.output), updated_at: new Date().toISOString() })
  return structuredClone(row)
}
