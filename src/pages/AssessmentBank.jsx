import { useEffect, useState } from 'react'
import { ASSESSABLE_SUBJECTS } from '../constants/toolSubjects'
import { subjectMatchesFilter } from '../constants/modules'
import { Link } from 'react-router-dom'
import { ArrowLeft, Archive, Trash2, Printer, Search, Loader2 } from 'lucide-react'
import { listAssessments, deleteAssessment } from '../services/assessmentService'
import QuizRenderer from '../components/renderers/QuizRenderer'
import RubricRenderer from '../components/renderers/RubricRenderer'
import WorksheetRenderer from '../components/renderers/WorksheetRenderer'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'

const TRIAL_PREVIEW_COUNT = 3

const TYPE_COLORS = {
  quiz:      { badge: 'bg-amber-500/15 text-amber-400',   label: 'Quiz' },
  rubric:    { badge: 'bg-blue-500/15 text-blue-400',     label: 'Rubric' },
  labeling:  { badge: 'bg-teal-500/15 text-teal-400',     label: 'Labeling' },
  cut_paste: { badge: 'bg-purple-500/15 text-purple-400', label: 'Cut & Paste' },
}

const SUBJECTS = ['All Subjects', ...ASSESSABLE_SUBJECTS]

export default function AssessmentBank() {
  const { isTrial, isExpired, openPaywall } = useTrial()
  const gated = isTrial || isExpired
  const [assessments, setAssessments] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSubject, setFilterSubject] = useState('All Subjects')

  useEffect(() => {
    listAssessments()
      .then(setAssessments)
      .catch(e => setError(e.message))
  }, [])

  const filtered = (assessments ?? []).filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType !== 'all' && a.assessment_type !== filterType) return false
    if (filterSubject !== 'All Subjects' && !subjectMatchesFilter(a.subject, filterSubject)) return false
    return true
  })

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!window.confirm('Delete this assessment?')) return
    await deleteAssessment(id)
    setAssessments(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  if (selected) {
    const colors = TYPE_COLORS[selected.assessment_type] ?? TYPE_COLORS.quiz
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
          >
            <ArrowLeft size={14} /> Assessment Bank
          </button>
          <span className="text-ink-700">·</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {colors.label}
          </span>
          <span className="text-sm font-medium text-ink-200">{selected.title}</span>
          <div className="ml-auto flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => (gated ? openPaywall('gated-feature') : window.print())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              onClick={e => handleDelete(selected.id, e)}
              className="text-ink-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="card p-6">
          {selected.assessment_type === 'quiz' && (
            <QuizRenderer quiz_questions={selected.content} />
          )}
          {selected.assessment_type === 'rubric' && (
            <RubricRenderer rubric={selected.content} />
          )}
          {(selected.assessment_type === 'labeling' || selected.assessment_type === 'cut_paste') && (
            <WorksheetRenderer worksheet={{ formats: [selected.content] }} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors mb-3">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-ink-50">Assessment Bank</h1>
        <p className="mt-1 text-sm text-ink-500">Your saved quizzes, rubrics, and worksheet activities — searchable and ready to reuse.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 pl-8 pr-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-accent-500"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-300 outline-none focus:border-accent-500"
        >
          <option value="all">All Types</option>
          <option value="quiz">Quiz</option>
          <option value="rubric">Rubric</option>
          <option value="labeling">Labeling</option>
          <option value="cut_paste">Cut & Paste</option>
        </select>
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-300 outline-none focus:border-accent-500"
        >
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!assessments && !error && (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {assessments?.length === 0 && (
        <div className="card p-8 text-center">
          <Archive size={32} className="mx-auto mb-3 text-ink-600" />
          <p className="font-medium text-ink-300">No assessments saved yet</p>
          <p className="mt-1 text-sm text-ink-600">
            Generate a quiz, rubric, or worksheet (labeling / cut & paste) from any lesson, then click "Save to Assessment Bank."
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(gated ? filtered.slice(0, TRIAL_PREVIEW_COUNT) : filtered).map(a => {
            const colors = TYPE_COLORS[a.assessment_type] ?? TYPE_COLORS.quiz
            return (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className="card group flex flex-col gap-3 p-5 cursor-pointer hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
                    {colors.label}
                  </span>
                  <button
                    type="button"
                    onClick={e => handleDelete(a.id, e)}
                    className="text-ink-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="font-semibold text-ink-50 leading-snug">{a.title}</p>
                <p className="text-sm text-ink-500">
                  {a.subject ?? 'General'}
                  {a.grade_bands?.length > 0 && ` · Grade ${a.grade_bands.map(g => g === 0 ? 'K' : g).join('/')}`}
                </p>
                <p className="text-xs text-ink-600">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            )
          })}
        </div>
      )}

      {gated && filtered.length > TRIAL_PREVIEW_COUNT && (
        <UpgradeBanner label="your full Assessment Bank" />
      )}

      {assessments && filtered.length === 0 && assessments.length > 0 && (
        <p className="text-sm text-ink-500">No assessments match your filters.</p>
      )}
    </div>
  )
}
