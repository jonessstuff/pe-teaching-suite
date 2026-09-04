let newsletters = []

export async function listLibraryNewsletters() { return structuredClone(newsletters) }

export async function createLibraryNewsletter(values) {
  const row = { id: `newsletter-${newsletters.length + 1}`, title: values.title, audience: values.audience, issue_month: values.issueMonth, draft: structuredClone(values.draft), updated_at: new Date().toISOString() }
  newsletters = [row, ...newsletters]
  return structuredClone(row)
}

export async function updateLibraryNewsletter(id, values) {
  const row = newsletters.find((item) => item.id === id)
  Object.assign(row, { title: values.title, audience: values.audience, issue_month: values.issueMonth, draft: structuredClone(values.draft), updated_at: new Date().toISOString() })
  return structuredClone(row)
}
