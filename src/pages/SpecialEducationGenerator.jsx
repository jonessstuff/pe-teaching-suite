import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { generateSpecialEducation } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import SpecialEducationRenderer from '../components/renderers/SpecialEducationRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const FUNCTIONAL_AREAS = [
  'Functional math (budgeting, shopping, time)',
  'Functional literacy (signs, forms, schedules)',
  'Vocational / job-readiness',
  'Community navigation',
  'Self-advocacy',
  'Independent living',
]

const MODES = [
  { value: 'multitier', label: 'Multi-tier lesson', blurb: 'One self-contained lesson written at several access tiers at once.' },
  { value: 'functional', label: 'Functional / life skills', blurb: 'Secondary Life Skills / Functional Academics where independence is the curriculum.' },
  { value: 'coteaching', label: 'Push-in / co-teaching', blurb: 'Plug-in accommodations for a gen-ed lesson, organized by co-teaching model.' },
]

export default function SpecialEducationGenerator() {
  const { requestExport } = useTrial()
  const [mode, setMode] = useState('multitier')
  const [view, setView] = useState('form') // 'form' | 'result'

  // shared
  const [gradeBand, setGradeBand] = useState('3-5')
  const [teacherNotes, setTeacherNotes] = useState('')

  // multitier
  const [topic, setTopic] = useState('')
  const [contentArea, setContentArea] = useState('')

  // functional
  const [skillArea, setSkillArea] = useState(FUNCTIONAL_AREAS[0])
  const [focus, setFocus] = useState('')

  // coteaching
  const [genEdTopic, setGenEdTopic] = useState('')

  const [handsOn, setHandsOn] = useState(false)
  // Hands-on/kinesthetic toggle: multitier & co-teaching modes at elementary
  // (K–2 / 3–5) only. The functional mode is secondary and out of scope.
  const showHandsOn = (mode === 'multitier' || mode === 'coteaching') && (gradeBand === 'k-2' || gradeBand === '3-5')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleModeChange(next) {
    setMode(next)
    // Nudge the default band toward secondary for the functional mode, since
    // that content area is for MS/HS specialty classes.
    if (next === 'functional' && (gradeBand === 'k-2' || gradeBand === '3-5')) setGradeBand('9-12')
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input =
        mode === 'functional'
          ? { mode, gradeBand, skillArea, focus, teacherNotes }
          : mode === 'coteaching'
            ? { mode, gradeBand, genEdTopic, contentArea, teacherNotes, handsOn: showHandsOn && handsOn }
            : { mode, gradeBand, topic, contentArea, teacherNotes, handsOn: showHandsOn && handsOn }

      const generated = await generateSpecialEducation(input)
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

        <SpecialEducationRenderer lesson={result} />
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
            <HeartHandshake size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Special Education</h1>
            <p className="text-xs text-ink-500">
              Resource &amp; self-contained · multi-tier differentiation · functional skills · co-teaching
            </p>
          </div>
        </div>
      </div>

      {/* Instructional-only disclaimer */}
      <div className="flex items-start gap-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-violet-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Instructional ideas, not IEPs</p>
          <p className="mt-0.5 text-ink-300">
            This module supports instructional planning only. It does not write IEP goals, diagnose or classify disabilities, or determine legal compliance. Treat every output as ideas to adapt to your specific students and their existing IEPs. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-ink-900 p-1 w-fit">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => handleModeChange(m.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === m.value ? 'bg-ink-700 text-ink-50 shadow-sm' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="-mt-4 text-xs text-ink-500">{MODES.find((m) => m.value === mode)?.blurb}</p>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          {mode === 'multitier' && (
            <>
              <h2 className="text-sm font-semibold text-ink-200">Topic &amp; grade band</h2>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="se-topic">Topic</label>
                <input
                  id="se-topic"
                  type="text"
                  placeholder="e.g. Telling time, Measurement, Main idea, Adding within 20"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="se-content">
                    Content area <span className="text-ink-500">(optional)</span>
                  </label>
                  <input
                    id="se-content"
                    type="text"
                    placeholder="e.g. Math, ELA, Science"
                    value={contentArea}
                    onChange={(e) => setContentArea(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="se-band">Grade band</label>
                  <select id="se-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                    {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {mode === 'functional' && (
            <>
              <h2 className="text-sm font-semibold text-ink-200">Functional skill &amp; grade band</h2>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="se-skill">Skill area</label>
                <select id="se-skill" value={skillArea} onChange={(e) => setSkillArea(e.target.value)} className="input-field">
                  {FUNCTIONAL_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="se-focus">
                    Specific focus <span className="text-ink-500">(optional)</span>
                  </label>
                  <input
                    id="se-focus"
                    type="text"
                    placeholder="e.g. Making change, Reading a bus schedule, A job application"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="se-band-f">Grade band</label>
                  <select id="se-band-f" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                    {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-ink-500">
                Designed for MS/HS Life Skills &amp; Functional Academics — materials and tone are kept age-appropriate for teen / young-adult students.
              </p>
            </>
          )}

          {mode === 'coteaching' && (
            <>
              <h2 className="text-sm font-semibold text-ink-200">Gen-ed topic &amp; grade band</h2>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="se-gened">General-education topic</label>
                <input
                  id="se-gened"
                  type="text"
                  placeholder="e.g. Photosynthesis, The Bill of Rights, Two-step equations, Persuasive essay"
                  value={genEdTopic}
                  onChange={(e) => setGenEdTopic(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="se-content-c">
                    Content area <span className="text-ink-500">(optional)</span>
                  </label>
                  <input
                    id="se-content-c"
                    type="text"
                    placeholder="e.g. Science, Social Studies, Math, ELA"
                    value={contentArea}
                    onChange={(e) => setContentArea(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="se-band-c">Grade band</label>
                  <select id="se-band-c" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                    {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="se-notes">
              Teacher notes <span className="text-ink-500">(optional)</span>
            </label>
            <textarea
              id="se-notes"
              placeholder="Any context to tailor the ideas — range of needs in the room, available supports/AAC, prior skills, etc. (no student names)"
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              rows={2}
              className="input-field min-h-[64px]"
            />
          </div>
        </div>

        {showHandsOn && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">Hands-on / kinesthetic</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={handsOn}
                onChange={(e) => setHandsOn(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-violet-500"
              />
              <div>
                <span className="text-sm text-ink-300">Hands-on / kinesthetic emphasis</span>
                <p className="mt-0.5 text-xs text-ink-500">
                  Favors manipulatives, movement &amp; tactile access over worksheet/seatwork. Elementary (K–2 / 3–5) only.
                </p>
              </div>
            </label>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">
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
              {mode === 'multitier' ? 'Generate multi-tier lesson' : mode === 'functional' ? 'Generate life-skills lesson' : 'Generate co-teaching support'}
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
