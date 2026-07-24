import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Blocks, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateEarlyChildhood } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import EarlyChildhoodRenderer from '../components/renderers/EarlyChildhoodRenderer'
import { useTrial } from '../context/TrialContext'

const AGE_GROUPS = [
  { value: 'toddler', label: 'Toddlers (about 2s)' },
  { value: 'preschool3', label: 'Preschool (3s)' },
  { value: 'prek4', label: 'Pre-K (4s)' },
  { value: 'tk5', label: 'Transitional K (older 5s)' },
]

const PROGRAM_TYPES = [
  { value: 'general', label: 'General / State Pre-K' },
  { value: 'head-start', label: 'Head Start' },
]

export default function EarlyChildhoodGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [studyTheme, setStudyTheme] = useState('')
  const [ageGroup, setAgeGroup] = useState('prek4')
  const [programType, setProgramType] = useState('general')
  const [teacherNotes, setTeacherNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input = { studyTheme, ageGroup, programType, teacherNotes }
      const generated = await generateEarlyChildhood(input)
      setResult(generated)

      if (generated?.title) {
        const saved = await createLesson(generated, { aiModel: 'claude-sonnet-4-6' })
        setSavedId(saved.id)
      }

      setView('result')
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setView('form')
    setResult(null)
    setSavedId(null)
    setError(null)
  }

  if (view === 'result' && result) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            All modules
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            Start over
          </button>
          {savedId && (
            <Link to={`/lessons/${savedId}`} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              View in archive
              <ExternalLink size={14} />
            </Link>
          )}
          <button
            type="button"
            onClick={async () => { if (await requestExport()) window.print() }}
            className="ml-auto btn-secondary"
          >
            Print
          </button>
        </div>

        {savedId && (
          <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your lesson archive.</p>
        )}

        <EarlyChildhoodRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          All modules
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-grass-500/15">
            <Blocks size={18} className="text-grass-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Early Childhood / Pre-K</h1>
            <p className="text-xs text-ink-500">
              Play-based learning centers &amp; guided play · NAEYC DAP
            </p>
          </div>
        </div>
      </div>

      {/* DAP framing notice */}
      <div className="flex items-start gap-3 rounded-lg border border-grass-500/30 bg-grass-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-grass-400" />
        <div className="text-sm">
          <p className="font-medium text-grass-200">Play-based, not a lesson with objectives</p>
          <p className="mt-0.5 text-grass-300/90">
            Built on NAEYC&rsquo;s Developmentally Appropriate Practice (DAP) — learning centers, invitations, and guided play for the whole child. Aligns to NAEYC Professional Standards and the Head Start ELOF; always verify your state&rsquo;s own Pre-K standards. Don&rsquo;t enter children&rsquo;s names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Study, age group &amp; program</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ec-theme">Study / theme</label>
            <input
              id="ec-theme"
              type="text"
              placeholder="e.g. Fall & leaves, Our families, Water & pouring, Community helpers, Bugs & crawly things"
              value={studyTheme}
              onChange={(e) => setStudyTheme(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ec-age">Age group</label>
              <select id="ec-age" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="input-field">
                {AGE_GROUPS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ec-program">Program type</label>
              <select id="ec-program" value={programType} onChange={(e) => setProgramType(e.target.value)} className="input-field">
                {PROGRAM_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-ink-500">
            Head Start emphasizes alignment to the federal Early Learning Outcomes Framework (ELOF).
          </p>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Teacher notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="ec-notes"
            placeholder="Any context to tailor the plan — materials you have, children's current interests, home languages in your room, indoor/outdoor space, a schoolwide theme, etc."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate play-based plan
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            This usually takes 30–60 seconds · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
