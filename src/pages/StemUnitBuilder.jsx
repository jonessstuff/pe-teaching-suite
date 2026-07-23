import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Sparkles, Loader2, Plus, X, ArrowLeft } from 'lucide-react'
import { generateStemLesson } from '../services/generationService'
import { createLesson, createUnit } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import StemPlanRenderer from '../components/renderers/StemPlanRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'

const GRADE_OPTIONS = [
  { value: 0, label: 'K' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
]

const FOCUS_AREAS = [
  { value: 'engineering', label: 'Engineering Design Challenge' },
  { value: 'coding',      label: 'Coding & Computational Thinking' },
  { value: 'science',     label: 'Science Investigation' },
  { value: 'maker',       label: 'Maker & Tinkering' },
]

const MATERIAL_PLACEHOLDERS = [
  'e.g. Popsicle sticks — 20 per group',
  'e.g. Masking tape — 1 roll per group',
  'e.g. Chromebook — 1 per student',
  'e.g. Index cards, 10 per group',
  'e.g. Rubber bands and paper clips',
  'e.g. Cardboard scraps and scissors',
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
              ? 'bg-cyan-500 text-white'
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
      const vocab =
        Array.isArray(s.new_vocabulary) && s.new_vocabulary.length
          ? s.new_vocabulary.join(', ')
          : 'none recorded'
      const accomplished = s.independent_practice
        ? s.independent_practice.split('\n')[0].slice(0, 200)
        : 'not specified'
      const tools =
        Array.isArray(s.tools_and_platforms) && s.tools_and_platforms.length
          ? s.tools_and_platforms.slice(0, 2).join(', ')
          : 'not specified'
      return [
        `Stage ${i + 1} — "${s.title || `Stage ${i + 1}`}"`,
        `  Accomplished: ${accomplished}`,
        `  Tools / platforms used: ${tools}`,
        `  New vocabulary introduced: ${vocab}`,
      ].join('\n')
    })
    .join('\n\n')
}

export default function StemUnitBuilder() {
  const [view, setView] = useState('form')

  // Form fields
  const [gradeBands, setGradeBands] = useState([3])
  const [focusArea, setFocusArea] = useState('engineering')
  const [unitName, setUnitName] = useState('')
  const [topic, setTopic] = useState('')
  const [sessionCount, setSessionCount] = useState(2)
  const [state, setState] = useState('VA')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(45)
  const [targetStandard, setTargetStandard] = useState('')
  const [materials, setMaterials] = useState(['', ''])

  // Result — array of { session: lessonObject, savedId: string }
  const [savedSessions, setSavedSessions] = useState([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [generatingSession, setGeneratingSession] = useState(0)
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
      const resolvedUnitName = unitName.trim() || topic.trim() || 'STEM Project'

      const createdUnit = await createUnit({
        name: resolvedUnitName,
        subject: 'STEM',
        gradeBands,
      })

      for (let i = 0; i < sessionCount; i++) {
        setGeneratingSession(i + 1)

        const priorSummary = buildPriorSessionsSummary(collectedSessions.map((s) => s.session))

        const lessonObject = await generateStemLesson({
          focusArea,
          gradeBands,
          topic: topic.trim() || unitName.trim(),
          materials: materials.filter(Boolean),
          classSize,
          durationMinutes: duration,
          targetStandard: targetStandard.trim(),
          state,
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

  const focusLabel = FOCUS_AREAS.find((f) => f.value === focusArea)?.label ?? 'STEM'

  if (view === 'result' && savedSessions.length > 0) {
    return (
      <div>
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/stem"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              STEM
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              Build another
            </button>
            <Link
              to="/stem/lessons"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              View all lessons
            </Link>
          </div>
        </div>

        <p className="mb-8 text-xs text-ink-500 print:hidden">
          {savedSessions.length} stages saved to your lesson library.
        </p>

        <div className="space-y-12">
          {savedSessions.map(({ session, savedId }, i) => (
            <div key={i}>
              <div className="mb-4 flex items-center gap-3 print:hidden">
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-400">
                  Stage {i + 1} of {savedSessions.length}
                </span>
                {session.title && (
                  <span className="text-sm text-ink-400 truncate">{session.title}</span>
                )}
              </div>
              <SecondaryToolsPanel
                savedId={savedId}
                lessonObject={session}
                subject="STEM"
              />
              <div className="mt-8">
                <StemPlanRenderer lesson={session} />
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
          to="/stem"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          STEM home
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15">
            <Layers size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">STEM Unit Builder</h1>
            <p className="text-xs text-ink-500">2–3 connected stages · NGSS / CSTA-aligned</p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a multi-stage STEM project with progressive scaffolding — each session builds
          directly on the last, from introduction through building, testing, and reflection.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Project details */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Project details</h2>

          <div>
            <label className="mb-2 block text-sm text-ink-300">Focus area</label>
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_AREAS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFocusArea(value)}
                  className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    focusArea === value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-name">
              Unit / project name
            </label>
            <input
              id="unit-name"
              type="text"
              placeholder="e.g. Bridge the Gap: Engineering a Paper Bridge"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Leave blank and the AI will generate one from your topic.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-topic">
              Topic / project description <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="unit-topic"
              type="text"
              placeholder="e.g. Design and build a bridge from index cards that holds the most pennies"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Describe the challenge, investigation, or project to develop across these stages.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-ink-300">Number of stages</label>
            <div className="flex gap-2">
              {[2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSessionCount(n)}
                  className={`h-9 px-5 rounded-lg text-sm font-semibold transition-colors ${
                    sessionCount === n
                      ? 'bg-cyan-500 text-white'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-500">Each stage = one STEM class period.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-standard">
              Target standard <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="unit-standard"
              type="text"
              placeholder="e.g. 3-5-ETS1-1 or 1B-AP-11"
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
            Materials &amp; technology{' '}
            <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-2">
            List specific supplies, devices, or platforms available across these stages.
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
                ? `Generating stage ${generatingSession} of ${sessionCount}…`
                : 'Preparing…'}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate {sessionCount}-stage {focusLabel.toLowerCase()} unit
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
