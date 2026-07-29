import { useEffect, useState } from 'react'
import { ASSESSABLE_SUBJECTS } from '../constants/toolSubjects'
import { subjectMatchesFilter } from '../constants/modules'
import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart2, Loader2 } from 'lucide-react'
import { listLessons } from '../services/lessonsService'

const SUBJECTS = ['All Subjects', ...ASSESSABLE_SUBJECTS]
const GRADES = ['All Grades', 'K', 1, 2, 3, 4, 5, 6, 7, 8]

function frequencyClass(count) {
  if (count === 0) return 'bg-ink-200/30 text-ink-600'
  if (count === 1) return 'bg-amber-500/20 text-amber-400'
  if (count <= 3) return 'bg-green-500/20 text-green-400'
  return 'bg-green-500/40 text-green-300'
}

export default function StandardsTracker() {
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)
  const [filterSubject, setFilterSubject] = useState('All Subjects')
  const [filterGrade, setFilterGrade] = useState('All Grades')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    listLessons()
      .then(setLessons)
      .catch(e => setError(e.message))
  }, [])

  const filtered = (lessons ?? []).filter(l => {
    if (filterSubject !== 'All Subjects' && !subjectMatchesFilter(l.subject, filterSubject)) return false
    if (filterGrade !== 'All Grades') {
      const grade = filterGrade === 'K' ? 0 : Number(filterGrade)
      if (!(l.grade_bands ?? []).includes(grade)) return false
    }
    return true
  })

  // Build standards map: key = `${grade}-${code}` → { grade, code, text, count, lessons[] }
  const standardsMap = {}
  for (const lesson of filtered) {
    // Defensively parse lesson_object in case Supabase returns it as a JSON string
    const lo = typeof lesson.lesson_object === 'string'
      ? (() => { try { return JSON.parse(lesson.lesson_object) } catch { return null } })()
      : lesson.lesson_object
    let lessonStandards = lo?.standards
    if (!Array.isArray(lessonStandards) || lessonStandards.length === 0) {
      // Newer specialist modules use standards_alignment: [{ framework, text }]
      // (no per-grade code). Map each to a tracker entry keyed by framework/text
      // and attributed to the lesson's grade band(s).
      const alignment = lo?.standards_alignment
      const grades = Array.isArray(lo?.grade_bands) && lo.grade_bands.length ? lo.grade_bands : [0]
      lessonStandards = Array.isArray(alignment)
        ? alignment.flatMap((a) => {
            if (!a) return []
            const code = a.code ?? a.framework ?? (a.text ?? '').slice(0, 28)
            return grades.map((g) => ({ grade: g, code, text: a.text ?? a.framework ?? '' }))
          })
        : []
    }
    if (!Array.isArray(lessonStandards)) continue
    for (const s of lessonStandards) {
      if (!s || s.code == null) continue
      const grade = typeof s.grade === 'number' ? s.grade : (s.grade === 'K' ? 0 : Number(s.grade) || 0)
      const key = `${grade}-${s.code}`
      if (!standardsMap[key]) {
        standardsMap[key] = { grade, code: s.code, text: s.text ?? '', count: 0, lessons: [] }
      }
      standardsMap[key].count++
      standardsMap[key].lessons.push(lesson)
    }
  }

  const standards = Object.values(standardsMap).sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade
    return (a.code ?? '').localeCompare(b.code ?? '')
  })

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors mb-3">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
            <BarChart2 size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">Standards Tracker</h1>
            <p className="text-sm text-ink-500">Standards covered in your lesson library</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-300 outline-none focus:border-violet-500"
        >
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value)}
          className="rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-300 outline-none focus:border-violet-500"
        >
          {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <p className="flex items-center text-sm text-ink-500 ml-1">
          {filtered.length} lesson{filtered.length !== 1 ? 's' : ''} · {standards.length} standard{standards.length !== 1 ? 's' : ''} covered
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-amber-500/20" /> 1×</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-green-500/20" /> 2–3×</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-green-500/40" /> 4×+</span>
      </div>

      {!lessons && !error && (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading lessons…
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {lessons && standards.length === 0 && (
        <div className="card p-8 text-center">
          <BarChart2 size={32} className="mx-auto mb-3 text-ink-600" />
          <p className="font-medium text-ink-300">No standards found</p>
          <p className="mt-1 text-sm text-ink-600">
            Standards appear here as you generate lessons. Try adjusting filters.
          </p>
        </div>
      )}

      <div className="grid gap-2">
        {standards.map(s => {
          const gradeLabel = s.grade === 0 ? 'K' : String(s.grade)
          const isSelected = selected?.code === s.code && selected?.grade === s.grade
          return (
            <div key={`${s.grade}-${s.code}`}>
              <button
                type="button"
                onClick={() => setSelected(isSelected ? null : s)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  isSelected
                    ? 'border-violet-500/50 bg-violet-500/10'
                    : 'border-ink-800 hover:border-ink-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-mono font-semibold ${frequencyClass(s.count)}`}>
                    {s.count}×
                  </span>
                  <span className="rounded bg-ink-200/40 px-1.5 py-0.5 text-[11px] font-mono text-ink-600">
                    Gr.{gradeLabel}
                  </span>
                  <span className="text-xs font-semibold text-ink-400 font-mono">{s.code}</span>
                  <span className="text-sm text-ink-700 truncate">{s.text}</span>
                </div>
              </button>

              {isSelected && (
                <div className="ml-4 mt-1 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                  <p className="mb-2 text-xs font-semibold text-violet-400">
                    {s.count} lesson{s.count !== 1 ? 's' : ''} covering this standard
                  </p>
                  <ul className="space-y-1">
                    {s.lessons.map(l => (
                      <li key={l.id}>
                        <Link
                          to={`/lessons/${l.id}`}
                          className="text-sm text-ink-400 hover:text-ink-100 transition-colors underline-offset-2 hover:underline"
                        >
                          {l.lesson_object?.title ?? l.title}
                        </Link>
                        <span className="ml-2 text-xs text-ink-600">{l.subject}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
