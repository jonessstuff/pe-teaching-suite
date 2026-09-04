let projects = []

export async function listArtShowProjects() { return structuredClone(projects) }

export async function createArtShowProject(values) {
  const row = { id: `art-show-${projects.length + 1}`, title: values.title, inputs: structuredClone(values.inputs), artworks: structuredClone(values.artworks), plan: structuredClone(values.plan), updated_at: new Date().toISOString() }
  projects = [row, ...projects]
  return structuredClone(row)
}

export async function updateArtShowProject(id, values) {
  const row = projects.find((item) => item.id === id)
  Object.assign(row, { title: values.title, inputs: structuredClone(values.inputs), artworks: structuredClone(values.artworks), plan: structuredClone(values.plan), updated_at: new Date().toISOString() })
  return structuredClone(row)
}
