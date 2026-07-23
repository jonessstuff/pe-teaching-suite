import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Sparkles, Loader2, Plus, X, Printer, ArrowLeft } from 'lucide-react'
import { generateLibraryLesson } from '../services/generationService'
import { createLesson, createUnit } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import LibraryPlanRenderer from '../components/renderers/LibraryPlanRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_OPTIONS = [
  { value: 0, label: 'K' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
]

const MATERIAL_PLACEHOLDERS = [
  'e.g. The Day the Crayons Quit by Drew Daywalt',
  'e.g. PebbleGo access (student devices)',
  'e.g. Dewey Decimal shelf markers',
  'e.g. iPad cart (28 devices)',
  'e.g. Genre sorting cards (class set)',
  'e.g. Citation practice handout',
]

function GradeToggle({ selected, onChange }) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((g) => g !== value))
    } else {
      onChange([...selected, value].sort((a, b) => a - b))
    }
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
              ? 'bg-blue-500 text-white'
              : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Builds a compact text block summarising already-generated sessions so the
// next prompt knows what read-alouds and vocabulary were already used.
function buildPriorSessionsSummary(sessions) {
  if (!sessions.length) return ''
  return sessions
    .map((s, i) => {
      const resourceLine = s.fitness_activities
        ? s.fitness_activities.split('\n')[0].slice(0, 200)
        : 'Resource not specified'
      const vocab =
        Array.isArray(s.new_vocabulary) && s.new_vocabulary.length
          ? s.new_vocabulary.join(', ')
          : 'none recorded'
      const skills =
        Array.isArray(s.skill_focus) && s.skill_focus.length
          ? s.skill_focus.join(', ')
          : 'not specified'
      const practice = s.independent_practice
        ? s.independent_practice.split('\n')[0].slice(0, 200)
        : 'not specified'
      return [
        `Session ${i + 1} — "${s.title || `Session ${i + 1}`}"`,
        `  Read-aloud/resource: ${resourceLine}`,
        `  New vocabulary introduced: ${vocab}`,
        `  Skills taught: ${skills}`,
        `  Practice activity: ${practice}`,
      ].join('\n')
    })
    .join('\n\n')
}

export default function LibraryUnitBuilder() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form')

  // Form fields
  const [gradeBands, setGradeBands] = useState([3])
  const [unitName, setUnitName] = useState('')
  const [theme, setTheme] = useState('')
  const [sessionCount, setSessionCount] = useState(2)
  const [state, setState] = useState('VA')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(40)
  const [targetStandard, setTargetStandard] = useState('')
  const [materials, setMaterials] = useState(['', ''])

  // Result
  const [generatedSessions, setGeneratedSessions] = useState([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [generatingSession, setGeneratingSession] = useState(0) // 1-based current session number, 0 = idle
  const [error, setError] = useState(null)

  const addMaterial = () => setMaterials((prev) => [...prev, ''])
  const removeMaterial = (i) => setMaterials((prev) => prev.filter((_, idx) => idx !== i))
  const setMaterial = (i, value) =>
    setMaterials((prev) => prev.map((m, idx) => (idx === i ? value : m)))

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
      const resolvedUnitName = unitName.trim() || theme.trim() || 'Library Unit'

      for (let i = 0; i < sessionCount; i++) {
        setGeneratingSession(i + 1)

        const priorSummary = buildPriorSessionsSummary(collectedSessions)

        const lessonObject = await generateLibraryLesson({
          gradeBands,
          topic: theme.trim() || unitName.trim(),
          materials: materials.filter(Boolean),
          classSize,
          durationMinutes: duration,
          targetStandard: targetStandard.trim(),
          state,
          // Unit context — tells the prompt which session this is and what came before
          unitName: resolvedUnitName,
          sessionNumber: i + 1,
          totalSessions: sessionCount,
          priorSessionsSummary: priorSummary,
        })

        collectedSessions.push(lessonObject)
      }

      // Save the unit and all sessions
      const createdUnit = await createUnit({
        name: collectedSessions[0]?.unit || resolvedUnitName,
        subject: 'Library/Media',
        gradeBands,
      })

      for (const session of collectedSessions) {
        await createLesson(session, {
          aiModel: 'claude-sonnet-4-6',
          unitId: createdUnit.id,
        })
      }

      setGeneratedSessions(collectedSessions)
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
    setGeneratedSessions([])
    setError(null)
  }

  if (view === 'result' && generatedSessions.length > 0) {
    return (
      <div>
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/library"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              Library
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              Build another
            </button>
            <Link
              to="/library/lessons"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              View all lessons
            </Link>
          </div>
          <button
            type="button"
            onClick={async () => { if (await requestExport()) window.print() }}
            className="btn-secondary gap-1.5"
          >
            <Printer size={16} />
            Print
          </button>
        </div>

        <p className="mb-8 text-xs text-ink-500 print:hidden">
          {generatedSessions.length} sessions saved to your lesson library.
        </p>

        <div className="space-y-12">
          {generatedSessions.map((session, i) => (
            <div key={i}>
              <div className="mb-4 flex items-center gap-3 print:hidden">
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400">
                  Session {i + 1} of {generatedSessions.length}
                </span>
                {session.title && (
                  <span className="text-sm text-ink-400 truncate">{session.title}</span>
                )}
              </div>
              <LibraryPlanRenderer lesson={session} />
              {i < generatedSessions.length - 1 && (
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
          to="/library"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Library home
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
            <Layers size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Library Unit Builder</h1>
            <p className="text-xs text-ink-500">2–3 connected library sessions · AASL-aligned</p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a multi-session library unit with progressive skill scaffolding — each session
          builds directly on the last.
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
              placeholder="e.g. Genre Study: Fiction vs. Nonfiction"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Leave blank and the AI will generate one from your theme.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-theme">
              Theme / topic notes <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="unit-theme"
              type="text"
              placeholder="e.g. Build from picture books to chapter books; end with independent shelf browsing"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Any additional context about what the unit should accomplish or emphasize.
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
                      ? 'bg-blue-500 text-white'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-500">Each session = one library class visit.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-standard">
              Target standard <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="unit-standard"
              type="text"
              placeholder="e.g. AASL I.A.1 or VSLA 3.2"
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

        {/* Materials */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-200">
            Materials & resources{' '}
            <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-2">
            List specific books, databases, or devices available across these sessions.
          </p>

          <div className="space-y-2">
            {materials.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={m}
                  onChange={(e) => setMaterial(i, e.target.value)}
                  placeholder={MATERIAL_PLACEHOLDERS[i % MATERIAL_PLACEHOLDERS.length]}
                  className="input-field flex-1"
                />
                {materials.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMaterial(i)}
                    className="text-ink-600 hover:text-ink-300 transition-colors"
                    aria-label="Remove"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {materials.length < 8 && (
            <button
              type="button"
              onClick={addMaterial}
              className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
            >
              <Plus size={16} />
              Add material
            </button>
          )}
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
              Generate {sessionCount}-session library unit
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
