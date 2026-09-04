function splitCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && quoted && line[index + 1] === '"') { current += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { cells.push(current.trim()); current = '' }
    else current += char
  }
  cells.push(current.trim())
  return cells
}

const headerKey = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const aliases = {
  title: ['title', 'booktitle', 'name'], author: ['author', 'creator'], genres: ['genre', 'genres', 'category', 'categories'],
  gradeMin: ['grademin', 'mingrade', 'lowestgrade'], gradeMax: ['grademax', 'maxgrade', 'highestgrade'],
  format: ['format', 'materialtype', 'type'], themes: ['theme', 'themes', 'subjects', 'topics'], series: ['series', 'seriesname'], available: ['available', 'status'],
}

function findColumn(headers, key) { return headers.findIndex((header) => aliases[key].includes(headerKey(header))) }
const listValue = (value) => String(value ?? '').split(/[;|]/).map((item) => item.trim()).filter(Boolean)
const numberValue = (value) => value === '' || value == null || Number.isNaN(Number(value)) ? null : Number(value)

export function parseLibraryCatalogCsv(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!lines.length) return { rows: [], errors: [] }
  const first = splitCsvLine(lines[0])
  const hasHeader = first.some((cell) => Object.values(aliases).flat().includes(headerKey(cell)))
  const headers = hasHeader ? first : ['title', 'author', 'genres', 'gradeMin', 'gradeMax', 'format', 'themes', 'series']
  const indexes = Object.fromEntries(Object.keys(aliases).map((key) => [key, findColumn(headers, key)]))
  const errors = []
  const rows = (hasHeader ? lines.slice(1) : lines).map((line, index) => {
    const cells = splitCsvLine(line)
    const value = (key) => indexes[key] >= 0 ? cells[indexes[key]] : ''
    const title = value('title') || cells[0]
    if (!title) { errors.push(`Line ${index + (hasHeader ? 2 : 1)} needs a title`); return null }
    return {
      title, author: value('author') || cells[1] || 'Unknown author', genres: listValue(value('genres') || cells[2]),
      gradeMin: numberValue(value('gradeMin') || cells[3]), gradeMax: numberValue(value('gradeMax') || cells[4]),
      format: value('format') || cells[5] || 'Book', themes: listValue(value('themes') || cells[6]),
      series: value('series') || cells[7] || null, available: !/^(no|false|checked out|unavailable)$/i.test(value('available')),
    }
  }).filter(Boolean)
  return { rows, errors }
}

const MOOD_WORDS = {
  funny: ['humor', 'funny', 'silly', 'comedy'], adventurous: ['adventure', 'survival', 'heroes', 'quest'],
  mysterious: ['mystery', 'magic', 'suspense'], inspiring: ['courage', 'hope', 'inventors', 'history', 'biography'],
  comforting: ['friendship', 'family', 'animals', 'belonging'], factual: ['nonfiction', 'facts', 'science', 'stem', 'history'],
}

export function matchLibraryBooks(books, filters) {
  const interests = String(filters.interests ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2)
  return (books ?? []).filter((book) => book.available !== false).map((book) => {
    let score = 1
    const reasons = []
    const haystack = [book.title, book.author, ...(book.genres ?? []), ...(book.themes ?? []), book.series, book.format].filter(Boolean).join(' ').toLowerCase()
    if (filters.grade !== '') {
      const grade = Number(filters.grade)
      if ((book.grade_min == null || grade >= book.grade_min) && (book.grade_max == null || grade <= book.grade_max)) { score += 5; reasons.push(`fits Grade ${filters.grade === '0' ? 'K' : filters.grade}`) }
      else score -= 6
    }
    if (filters.genre && (book.genres ?? []).some((item) => item.toLowerCase().includes(filters.genre.toLowerCase()))) { score += 5; reasons.push(filters.genre) }
    if (filters.format && String(book.format).toLowerCase().includes(filters.format.toLowerCase())) { score += 4; reasons.push(book.format) }
    if ((MOOD_WORDS[filters.mood] ?? []).some((word) => haystack.includes(word))) { score += 4; reasons.push(`${filters.mood} mood`) }
    const matchedInterests = interests.filter((word) => haystack.includes(word))
    if (matchedInterests.length) { score += matchedInterests.length * 3; reasons.push(`matches ${matchedInterests.slice(0, 2).join(' & ')}`) }
    return { ...book, matchScore: score, matchReasons: reasons.length ? reasons : ['a fresh choice from your library'] }
  }).filter((book) => book.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore || a.title.localeCompare(b.title))
}
