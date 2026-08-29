const NAME_HEADERS = new Set(['name', 'student', 'student name', 'studentname', 'full name', 'fullname'])
const FIRST_HEADERS = new Set(['first', 'first name', 'firstname', 'given name'])
const LAST_HEADERS = new Set(['last', 'last name', 'lastname', 'surname', 'family name'])
const GRADE_HEADERS = new Set(['grade', 'grade level', 'gradelevel'])

function normalizeHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function parseCsvRows(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i += 1 }
      else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field.trim()); field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field.trim()); field = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else {
      field += char
    }
  }
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function gradeNumber(value) {
  const match = String(value ?? '').match(/\d{1,2}/)
  if (!match) return null
  const number = Number(match[0])
  return number >= 0 && number <= 12 ? number : null
}

export function parseRosterCsv(text) {
  const rows = parseCsvRows(String(text ?? '').replace(/^\uFEFF/, ''))
  if (!rows.length) return { rows: [], skipped: 0, hasHeader: false }

  const headers = rows[0].map(normalizeHeader)
  const nameIndex = headers.findIndex((h) => NAME_HEADERS.has(h))
  const firstIndex = headers.findIndex((h) => FIRST_HEADERS.has(h))
  const lastIndex = headers.findIndex((h) => LAST_HEADERS.has(h))
  const gradeIndex = headers.findIndex((h) => GRADE_HEADERS.has(h))
  const hasHeader = nameIndex >= 0 || firstIndex >= 0 || lastIndex >= 0 || gradeIndex >= 0
  const source = hasHeader ? rows.slice(1) : rows
  const parsed = []
  let skipped = 0

  for (const columns of source) {
    let name
    if (nameIndex >= 0) name = columns[nameIndex] ?? ''
    else if (firstIndex >= 0 || lastIndex >= 0) {
      const first = columns[firstIndex] ?? ''
      const last = columns[lastIndex] ?? ''
      name = [last, first].filter(Boolean).join(', ')
    } else if (columns.length === 1) name = columns[0]
    else name = [columns[0], columns[1]].filter(Boolean).join(', ')

    const cleanName = name.trim()
    if (!cleanName) { skipped += 1; continue }
    parsed.push({ name: cleanName, grade: gradeIndex >= 0 ? gradeNumber(columns[gradeIndex]) : null })
  }

  return { rows: parsed, skipped, hasHeader }
}
