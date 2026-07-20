import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Sparkles, Loader2, ArrowLeft } from 'lucide-react'
import { generateMusicLesson } from '../services/generationService'
import { createLesson, createUnit } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import MusicPlanRenderer from '../components/renderers/MusicPlanRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'

const GRADE_OPTIONS = [
  { value: 0, label: 'K' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
]

function GradeToggle({ selected, onChange }) {
  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((g) => g !== value)
        : [...selected, value].sort((a, b) => a - b)
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {GRADE_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => toggle(value)}
          className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
            selected.includes(value)
              ? 'bg-purple-500 text-white'
              : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function buildPriorSessionsSummary(sessions) {
  if (!sessions.length) return ''
  return sessions
    .map((s, i) => {
      const concept =
        Array.isArray(s.skill_focus) && s.skill_focus.length
          ? s.skill_focus.join(', ')
          : 'not specified'
      const listeningPiece = s.fitness_activities
        ? s.fitness_activities.split('\n')[0].slice(0, 200)
        : 'not specified'
      const vocab =
        Array.isArray(s.new_vocabulary) && s.new_vocabulary.length
          ? s.new_vocabulary.join(', ')
          : 'none recorded'
      const activity = s.independent_practice
        ? s.independent_practice.split('\n')[0].slice(0, 200)
        : 'not specified'
      return [
        `Session ${i + 1} — "${s.title || `Session ${i + 1}`}"`,
        `  Musical concept taught: ${concept}`,
        `  Listening example used: ${listeningPiece}`,
        `  New vocabulary introduced: ${vocab}`,
        `  Active music making activity: ${activity}`,
      ].join('\n')
    })
    .join('\n\n')
}

export default function MusicUnitBuilder() {
  const [view, setView] = useState('form')

  // Form fields
  const [gradeBands, setGradeBands] = useState([3])
  const [unitName, setUnitName] = useState('')
  const [concept, setConcept] = useState('')
  const [sessionCount, setSessionCount] = useState(2)
  const [state, setState] = useState('VA')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(45)
  const [targetStandard, setTargetStandard] = useState('')

  // Result — array of { session: lessonObject, savedId: string }
  const [savedSessions, setSavedSessions] = useState([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [generatingSession, setGeneratingSession] = useState(0)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    if (gradeBands.length === 0) {
      setError('Select at least one grade.')
      return
    }
    setLoading(true)
    setError(null)

    const collectedSessions = []

    try {
      const resolvedUnitName = unitName.trim() || concept.trim() || 'Music Unit'

      const createdUnit = await createUnit({
        name: resolvedUnitName,
        subject: 'Music',
        gradeBands,
      })

      for (let i = 0; i < sessionCount; i++) {
        setGeneratingSession(i + 1)

        const priorSummary = buildPriorSessionsSummary(collectedSessions.map((s) => s.session))

        const lessonObject = await generateMusicLesson({
          gradeBands,
          topic: concept.trim() || unitName.trim(),
          instruments: [],
          classSize,
          durationMinutes: duration,
          targetStandard: targetStandard.trim(),
          state,
          unitName: resolvedUnitName,
          sessionNumber: i + 1,
          totalSessions: sessionCount,
          priorSessionsSummary: priorSummary,
        })

        const savedRow = await createLesson(lessonObject, {
          aiModel: 'claude-sonnet-4-6',
          unitId: createdUnit.id,
        })

        collectedSessions.push({ session: lessonObject, savedId: savedRow.id })
      }

      setSavedSessions(collectedSessions)
      setView('result')
    } catch (err) {
      const msg = err?.message ?? ''
      const isTimeout = /timed?\s*out|timeout/i.test(msg)
      setError(
        isTimeout
          ? 'Generation timed out. Try reducing the number of grade bands, then try again.'
          : msg || 'Generation failed. Please try again.'
      )
    } finally {
      setLoading(false)
      setGeneratingSession(0)
    }
  }

  function resetForm() {
    setView('form')
    setSavedSessions([])
    setError(null)
  }

  if (view === 'result' && savedSessions.length > 0) {
    return (
      <div>
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/music"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              Music
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              Build another
            </button>
            <Link
              to="/music/lessons"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              View all lessons
            </Link>
          </div>
        </div>

        <p className="mb-8 text-xs text-ink-500 print:hidden">
          {savedSessions.length} sessions saved to your lesson library.
        </p>

        <div className="space-y-12">
          {savedSessions.map(({ session, savedId }, i) => (
            <div key={i}>
              <div className="mb-4 flex items-center gap-3 print:hidden">
                <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-400">
                  Session {i + 1} of {savedSessions.length}
                </span>
                {session.title && (
                  <span className="text-sm text-ink-400 truncate">{session.title}</span>
                )}
              </div>
              <SecondaryToolsPanel
                savedId={savedId}
                lessonObject={session}
                subject="Music"
              />
              <div className="mt-8">
                <MusicPlanRenderer lesson={session} />
              </div>
              {i < savedSessions.length - 1 && (
                <hr className="mt-12 border-ink-800 print:border-ink-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/music"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Music home
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15">
            <Layers size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Music Unit Builder</h1>
            <p className="text-xs text-ink-500">Beta — 2–3 connected music sessions · NCAS-aligned</p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a multi-session music unit with progressive concept scaffolding — each session
          deepens the same musical idea, using different repertoire and activities to build mastery.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Unit details */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Unit details</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-name">
              Unit name
            </label>
            <input
              id="unit-name"
              type="text"
              placeholder="e.g. Rhythm Unit: Beat and Subdivision"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Leave blank and the AI will generate one from your concept.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-concept">
              Musical concept / theme <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="unit-concept"
              type="text"
              placeholder="e.g. Steady beat vs. rhythm — progress from echo clapping to quarter/eighth note patterns"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Describe the musical concept to build across these sessions and any progression direction.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-ink-300">Number of sessions</label>
            <div className="flex gap-2">
              {[2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSessionCount(n)}
                  className={`h-9 px-5 rounded-lg text-sm font-semibold transition-colors ${
                    sessionCount === n
                      ? 'bg-purple-500 text-white'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-500">Each session = one music class period.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-standard">
              Target standard <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="unit-standard"
              type="text"
              placeholder="e.g. MU:Pr4.2.3a or NCAS Performing"
              value={targetStandard}
              onChange={(e) => setTargetStandard(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Class setup */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Class setup</h2>

          <div>
            <label className="mb-2 block text-sm text-ink-300">
              Grade band(s)
              <span className="ml-1 text-ink-500">(select all that apply)</span>
            </label>
            <GradeToggle selected={gradeBands} onChange={setGradeBands} />
            {gradeBands.length === 0 && (
              <p className="mt-1 text-xs text-red-400">Select at least one grade.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-state">
              State
            </label>
            <select
              id="unit-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="input-field"
            >
              {US_STATES.map(({ abbr, name }) => (
                <option key={abbr} value={abbr}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-classsize">
                Class size
              </label>
              <input
                id="unit-classsize"
                type="number"
                min={1}
                max={60}
                value={classSize}
                onChange={(e) => setClassSize(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-duration">
                Duration (minutes)
              </label>
              <input
                id="unit-duration"
                type="number"
                min={20}
                max={90}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || gradeBands.length === 0}
          className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {generatingSession > 0
                ? `Generating session ${generatingSession} of ${sessionCount}…`
                : 'Preparing…'}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate {sessionCount}-session music unit
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            Each session can take 1–2 minutes · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
