import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react'
import { listLessons } from '../services/lessonsService'

const TOOLS = ['Sub Binder', 'Rubric', 'Family Newsletter', 'Differentiation', 'Assessment', 'Exit Ticket', 'Cross-Curricular', 'Warm-Up', 'Progress Note', 'Pacing Guide']

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink-50">{value}</p>
      {sub && <p className="text-xs text-ink-600 mt-1">{sub}</p>}
    </div>
  )
}

function HeatCell({ count }) {
  const cls = count === 0 ? 'bg-ink-200/20'
    : count === 1 ? 'bg-amber-400/30 text-amber-300'
    : count <= 3 ? 'bg-emerald-500/30 text-emerald-300'
    : 'bg-emerald-500/60 text-emerald-200'
  return (
    <div className={`flex h-7 w-full items-center justify-center rounded text-xs font-mono ${cls}`}>
      {count > 0 ? count : ''}
    </div>
  )
}

export default function DistrictReport() {
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listLessons().then(setLessons).catch(e => setError(e.message))
  }, [])

  if (error) return <div className="text-sm text-red-400">{error}</div>
  if (!lessons) return (
    <div className="flex items-center gap-2 text-ink-400 text-sm">
      <Loader2 size={16} className="animate-spin" /> Loading data…
    </div>
  )

  // Subject lives in the top-level `subject` column (denormalized from the
  // lesson_object). There is no `meta` field on a lesson row — the old code
  // read l.meta?.subject, which was always undefined (hence "Subjects: 0" and
  // everything bucketed under "Unknown").
  const subjectOf = (l) => l.subject ?? l.lesson_object?.subject ?? null

  const totalLessons = lessons.length
  const favCount = lessons.filter(l => l.is_favorite).length
  const subjects = [...new Set(lessons.map(subjectOf).filter(Boolean))]

  // Lessons per month (last 12 months)
  const now = new Date()
  const monthBuckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return { label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), year: d.getFullYear(), month: d.getMonth(), count: 0 }
  })
  lessons.forEach(l => {
    const d = new Date(l.created_at)
    const bucket = monthBuckets.find(b => b.year === d.getFullYear() && b.month === d.getMonth())
    if (bucket) bucket.count++
  })
  const maxMonthCount = Math.max(...monthBuckets.map(b => b.count), 1)

  // Grade distribution — grade_bands is a top-level int[] column (mirrored in
  // lesson_object). It is a list of grade levels, NOT objects.
  const gradeMap = {}
  lessons.forEach(l => {
    const gbs = l.grade_bands ?? l.lesson_object?.grade_bands ?? []
    gbs.forEach(gb => {
      gradeMap[gb] = (gradeMap[gb] ?? 0) + 1
    })
  })
  const gradeEntries = Object.entries(gradeMap).sort((a, b) => Number(a[0]) - Number(b[0]))

  // Subject distribution
  const subjectMap = {}
  lessons.forEach(l => {
    const s = subjectOf(l) || 'Unknown'
    subjectMap[s] = (subjectMap[s] ?? 0) + 1
  })
  const maxSubjectCount = Math.max(...Object.values(subjectMap), 1)

  // Standards heatmap (top 30 by frequency).
  // Standards codes live in lesson_object.standards ([{grade, code, text}] for
  // the core PE schema) and, for the specialist modules, in
  // lesson_object.standards_alignment ([{framework|standard|code, note}]).
  // The old code walked grade_bands[].standards — but grade_bands are plain
  // numbers, so it always found nothing ("Standards covered: 0").
  const stdMap = {}
  lessons.forEach(l => {
    const lo = l.lesson_object ?? {}
    const core = Array.isArray(lo.standards) ? lo.standards : []
    const aligned = Array.isArray(lo.standards_alignment) ? lo.standards_alignment : []
    ;[...core, ...aligned].forEach(std => {
      const key = std.code ?? std.standard_code ?? std.standard ?? std.framework ?? ''
      if (key) stdMap[key] = (stdMap[key] ?? 0) + 1
    })
  })
  const topStandards = Object.entries(stdMap).sort((a, b) => b[1] - a[1]).slice(0, 30)

  // Tags cloud
  const tagMap = {}
  lessons.forEach(l => {
    const tags = l.tags ?? []
    tags.forEach(t => { tagMap[t] = (tagMap[t] ?? 0) + 1 })
  })
  const tagEntries = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 20)

  return (
    <div className="space-y-8">
      <div>
        <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 mb-3">
          <ArrowLeft size={14} /> Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
            <BarChart3 size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">District Report</h1>
            <p className="text-sm text-ink-500">Whole-library analytics across every module — all subjects combined</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total lessons" value={totalLessons} />
        <StatCard label="Favorited" value={favCount} sub={totalLessons > 0 ? `${Math.round(favCount / totalLessons * 100)}% of library` : undefined} />
        <StatCard label="Subjects" value={subjects.length} />
        <StatCard label="Standards covered" value={Object.keys(stdMap).length} />
      </div>

      {/* Lessons per month bar chart */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-ink-300">Lessons created — last 12 months</h2>
        <div className="flex items-end gap-1.5 h-28">
          {monthBuckets.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t" style={{ height: `${Math.round((b.count / maxMonthCount) * 80)}px`, minHeight: b.count > 0 ? '4px' : '0', background: 'rgb(139 92 246 / 0.5)' }} />
              <span className="text-[9px] text-ink-600 whitespace-nowrap -rotate-45 origin-top-left mt-1">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject breakdown */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-ink-300">Lessons by subject</h2>
        <div className="space-y-2">
          {Object.entries(subjectMap).sort((a, b) => b[1] - a[1]).map(([subject, count]) => (
            <div key={subject} className="flex items-center gap-3">
              <span className="w-32 flex-shrink-0 text-sm text-ink-500 truncate">{subject}</span>
              <div className="flex-1 h-5 rounded-full bg-ink-200/20 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500/50" style={{ width: `${Math.round(count / maxSubjectCount * 100)}%` }} />
              </div>
              <span className="w-8 text-right text-sm font-mono text-ink-400">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grade bands */}
      {gradeEntries.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-300">Grade band coverage</h2>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gradeEntries.length}, minmax(0, 1fr))` }}>
            {gradeEntries.map(([grade, count]) => (
              <div key={grade} className="flex flex-col items-center gap-1">
                <HeatCell count={count} />
                <span className="text-[10px] text-ink-600">Gr {grade === '0' ? 'K' : grade}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-600">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-400/30" /> 1 lesson</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/30" /> 2–3 lessons</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/60" /> 4+ lessons</span>
          </div>
        </div>
      )}

      {/* Standards heatmap */}
      {topStandards.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-300">Most-used standards (top 30)</h2>
          <div className="flex flex-wrap gap-2">
            {topStandards.map(([code, count]) => {
              const bg = count >= 4 ? 'bg-emerald-500/60 text-emerald-200' : count >= 2 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
              return (
                <span key={code} className={`rounded-lg px-2 py-1 text-xs font-mono ${bg}`}>
                  {code} <span className="ml-1 opacity-70">×{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {tagEntries.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-300">Lesson tags</h2>
          <div className="flex flex-wrap gap-2">
            {tagEntries.map(([tag, count]) => (
              <span key={tag} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
                {tag} <span className="opacity-60">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder: Tools used */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-ink-300">Secondary tools</h2>
        <p className="text-xs text-ink-600">Usage analytics for secondary tools (rubrics, newsletters, exit tickets, etc.) will appear here once usage data is tracked server-side.</p>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map(t => (
            <span key={t} className="rounded-full border border-ink-700 px-3 py-1 text-xs text-ink-600">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
