let projects = []

export async function listLibraryProjects(projectType) {
  return structuredClone(projectType ? projects.filter((item) => item.project_type === projectType) : projects)
}

export async function createLibraryProject(values) {
  const row = { id: `library-project-${projects.length + 1}`, project_type: values.projectType, title: values.title, inputs: structuredClone(values.inputs), output: structuredClone(values.output), updated_at: new Date().toISOString() }
  projects = [row, ...projects]
  return structuredClone(row)
}

export async function updateLibraryProject(id, values) {
  const row = projects.find((item) => item.id === id)
  Object.assign(row, { title: values.title, inputs: structuredClone(values.inputs), output: structuredClone(values.output), updated_at: new Date().toISOString() })
  return structuredClone(row)
}
