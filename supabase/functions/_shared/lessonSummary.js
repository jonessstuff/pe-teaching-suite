/**
 * serializeLessonForTools(lessonObject) → a readable, generic text summary of
 * ANY module's lesson object, so the per-lesson tools (quiz, rubric, sub plan,
 * …) can ground themselves in a specialist lesson (Theater, World Languages,
 * JROTC, …) — not just the PE PlanBook shape their prompts were written for.
 *
 * It walks the object's own content fields and formats strings, string arrays,
 * and arrays/objects of short values. Metadata and tool-output layers (sub_*,
 * quiz_questions, poster_content, etc.) are skipped so the summary stays focused
 * on the lesson's actual instructional content.
 */

// Shown explicitly at the top (so order/labels are nice); skipped in the walk.
const HEADER_KEYS = ['title', 'subject', 'grade_bands']

// Never include these in the body (metadata, or tool-generated layers).
const SKIP_KEYS = new Set([
  'id', 'title', 'subject', 'grade_bands', 'class_size', 'aiModel',
  'quiz_questions', 'poster_content', 'ell_accommodations',
  'scheduled_date', 'period_label',
])
// Any key beginning with one of these prefixes is a tool-output layer, skip it.
const SKIP_PREFIXES = ['sub_', 'weather_alt_', 'parent_note_', 'obs_', 'unit_']

const CAP = 600 // max chars per field, keeps prompts bounded

function humanize(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function short(v) {
  const s = String(v).trim()
  return s.length > CAP ? s.slice(0, CAP) + '…' : s
}

// Render one value (string / number / array / object) to a compact string.
function renderValue(v, depth = 0) {
  if (v == null) return ''
  if (typeof v === 'string') return short(v)
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) {
    if (v.length === 0) return ''
    if (v.every((x) => typeof x === 'string' || typeof x === 'number')) {
      return short(v.join(', '))
    }
    // Array of objects → one line each, "k: v" pairs of their scalar fields.
    return v
      .map((item, i) => {
        if (item && typeof item === 'object') {
          const pairs = Object.entries(item)
            .filter(([, val]) => val != null && (typeof val === 'string' || typeof val === 'number' || Array.isArray(val)))
            .map(([k, val]) => `${humanize(k)}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('; ')
          return `  ${i + 1}. ${short(pairs)}`
        }
        return `  ${i + 1}. ${short(item)}`
      })
      .join('\n')
  }
  if (typeof v === 'object') {
    if (depth > 1) return ''
    const parts = Object.entries(v)
      .map(([k, val]) => {
        const r = renderValue(val, depth + 1)
        return r ? `${humanize(k)}: ${r}` : ''
      })
      .filter(Boolean)
    return parts.join(depth === 0 ? '\n' : '; ')
  }
  return ''
}

export function serializeLessonForTools(lo) {
  if (!lo || typeof lo !== 'object') return ''

  const lines = []
  const grades = (lo.grade_bands ?? []).map((g) => (g === 0 ? 'K' : g)).join(', ')
  if (lo.title) lines.push(`Title: ${lo.title}`)
  if (lo.subject) lines.push(`Subject: ${lo.subject}`)
  if (grades) lines.push(`Grade band(s): ${grades}`)

  for (const [key, val] of Object.entries(lo)) {
    if (SKIP_KEYS.has(key)) continue
    if (SKIP_PREFIXES.some((p) => key.startsWith(p))) continue
    const rendered = renderValue(val)
    if (rendered) lines.push(`${humanize(key)}:\n${rendered}`)
  }

  return lines.join('\n\n')
}
