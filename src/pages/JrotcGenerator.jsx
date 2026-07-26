import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { generateJrotc } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import JrotcRenderer from '../components/renderers/JrotcRenderer'
import { useTrial } from '../context/TrialContext'

const LET_LEVELS = [
  { value: 'LET 1', label: 'LET 1 · Foundations (~9th)' },
  { value: 'LET 2', label: 'LET 2 · Developing Leader (~10th)' },
  { value: 'LET 3', label: 'LET 3 · Advanced Leadership (~11th)' },
  { value: 'LET 4', label: 'LET 4 · Capstone (~12th)' },
]

const CONTENT_AREAS = [
  { value: 'leadership_fundamentals', label: 'Leadership fundamentals (LET 1–2)', blurb: 'Personal attributes, followership, team communication, ethical decisions, customs & courtesies.' },
  { value: 'advanced_leadership', label: 'Advanced leadership (LET 3–4)', blurb: 'Situational leadership, leading others, and mentoring underclass cadets.' },
  { value: 'citizenship_civics', label: 'Citizenship & civics', blurb: 'Rights & responsibilities of citizenship, community engagement, government structure.' },
  { value: 'wellness_life_skills', label: 'Wellness & life skills', blurb: 'Progressive (non-tactical) fitness, health, personal responsibility, financial-literacy basics.' },
  { value: 'service_learning', label: 'Service learning', blurb: "Planning a community service project — JROTC's required service-learning component." },
  { value: 'career_exploration', label: 'Career exploration', blurb: 'Civilian AND military pathways given equal weight — not a recruiting tool.' },
]

const BRANCHES = [
  { value: 'any', label: 'Any branch (generic)' },
  { value: 'Army', label: 'Army JROTC' },
  { value: 'Navy', label: 'Navy JROTC' },
  { value: 'Air Force', label: 'Air Force JROTC' },
  { value: 'Marine Corps', label: 'Marine Corps JROTC' },
]

export default function JrotcGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [topic, setTopic] = useState('')
  const [letLevel, setLetLevel] = useState('LET 1')
  const [contentArea, setContentArea] = useState('leadership_fundamentals')
  const [serviceBranch, setServiceBranch] = useState('any')
  const [durationMinutes, setDurationMinutes] = useState(50)
  const [notes, setNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const currentBlurb = CONTENT_AREAS.find((a) => a.value === contentArea)?.blurb

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true); setError(null); setSavedId(null)
    try {
      const input = { topic, letLevel, contentArea, serviceBranch, durationMinutes, notes }
      const generated = await generateJrotc(input)
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
    setView('form'); setResult(null); setSavedId(null); setError(null)
  }

  if (view === 'result' && result) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/jrotc" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} /> JROTC
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            Start over
          </button>
          {savedId && (
            <Link to={`/lessons/${savedId}`} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              View in archive <ExternalLink size={14} />
            </Link>
          )}
          <button type="button" onClick={async () => { if (await requestExport()) window.print() }} className="ml-auto btn-secondary">
            Print
          </button>
        </div>
        {savedId && <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your lesson archive.</p>}
        <JrotcRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/jrotc" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} /> JROTC
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-denim-500/15">
            <Award size={18} className="text-denim-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">JROTC</h1>
            <p className="text-xs text-ink-500">
              High-school citizenship &amp; leadership · LET curriculum (LET 1–4)
            </p>
          </div>
        </div>
      </div>

      {/* Scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-denim-500/30 bg-denim-500/10 px-4 py-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-denim-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Citizenship &amp; leadership curriculum</p>
          <p className="mt-0.5 text-ink-300">
            High-school JROTC leadership, character, civics, wellness &amp; life-skills lessons across the LET 1–4 progression. This is <span className="font-medium">not</span> military tactics, weapons, or combat training — any drill &amp; ceremony is precision teamwork &amp; tradition (like a marching band or color guard). Don&rsquo;t enter cadet names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="jr-area">Content area</label>
            <select id="jr-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
              {CONTENT_AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            {currentBlurb && <p className="mt-1.5 text-xs text-ink-500">{currentBlurb}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="jr-topic">Lesson topic</label>
            <input
              id="jr-topic"
              type="text"
              placeholder="e.g. Integrity & personal responsibility, Situational leadership, Planning a food-drive service project, Budgeting basics, Resume & interview skills"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="jr-let">LET level</label>
              <select id="jr-let" value={letLevel} onChange={(e) => setLetLevel(e.target.value)} className="input-field">
                {LET_LEVELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="jr-duration">Class period (minutes)</label>
              <input
                id="jr-duration"
                type="number"
                min={30}
                max={90}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="jr-branch">Service branch</label>
            <select id="jr-branch" value={serviceBranch} onChange={(e) => setServiceBranch(e.target.value)} className="input-field">
              {BRANCHES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-ink-500">Core LET standards are common across branches — leave on “Any” unless you want branch-specific naming.</p>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Instructor notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="jr-notes"
            placeholder="Any context — your unit, a mixed-LET class, a schoolwide theme, prior lessons in the sequence, cadets who joined after 9th grade, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[60px]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50">
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Generating…</>
          ) : (
            <><Sparkles size={18} /> Generate JROTC lesson</>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">This usually takes 30–60 seconds · Do not close this tab</p>
        )}
      </form>
    </div>
  )
}
