import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Sparkles, Loader2, Plus, X, ArrowLeft } from 'lucide-react'
import { generateArtLesson } from '../services/generationService'
import { createLesson, createUnit } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import ArtPlanRenderer from '../components/renderers/ArtPlanRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'

const GRADE_OPTIONS = [
  { value: 0, label: 'K' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
]

const MATERIAL_PLACEHOLDERS = [
  'e.g. 9×12 white drawing paper',
  'e.g. Tempera paint — red, yellow, blue',
  'e.g. Size 6 round brushes, 1 per student',
  'e.g. Oil pastels, class set',
  'e.g. Scissors and glue sticks',
  'e.g. Watercolor sets',
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
              ? 'bg-orange-500 text-white'
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
      const technique = s.whole_group_instruction
        ? s.whole_group_instruction.split('\n')[0].slice(0, 200)
        : 'not specified'
      const materials = (s.equipment_needed ?? []).slice(0, 3).join(', ') || 'not specified'
      const vocab =
        Array.isArray(s.new_vocabulary) && s.new_vocabulary.length
          ? s.new_vocabulary.join(', ')
          : 'none recorded'
      const whereLeft = s.independent_practice
        ? s.independent_practice.split('\n')[0].slice(0, 200)
        : 'not specified'
      return [
        `Stage ${i + 1} — "${s.title || `Stage ${i + 1}`}"`,
        `  Technique demonstrated: ${technique}`,
        `  Materials used: ${materials}`,
        `  New vocabulary introduced: ${vocab}`,
        `  Students left off at: ${whereLeft}`,
      ].join('\n')
    })
    .join('\n\n')
}

export default function ArtUnitBuilder() {
  const [view, setView] = useState('form')

  // Form fields
  const [gradeBands, setGradeBands] = useState([3])
  const [unitName, setUnitName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
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
      const resolvedUnitName = unitName.trim() || projectDescription.trim() || 'Art Project'
      const topic = projectDescription.trim() || unitName.trim()

      // Create the unit record first
      const createdUnit = await createUnit({
        name: resolvedUnitName,
        subject: 'Art',
        gradeBands,
      })

      for (let i = 0; i < sessionCount; i++) {
        setGeneratingSession(i + 1)

        const priorSummary = buildPriorSessionsSummary(collectedSessions.map((s) => s.session))

        const lessonObject = await generateArtLesson({
          gradeBands,
          topic,
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

  if (view === 'result' && savedSessions.length > 0) {
    return (
      <div>
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/art"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              Art
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              Build another
            </button>
            <Link
              to="/art/lessons"
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
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-400">
                  Stage {i + 1} of {savedSessions.length}
                </span>
                {session.title && (
                  <span className="text-sm text-ink-400 truncate">{session.title}</span>
                )}
              </div>
              <SecondaryToolsPanel
                savedId={savedId}
                lessonObject={session}
                subject="Art"
              />
              <div className="mt-8">
                <ArtPlanRenderer lesson={session} />
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
          to="/art"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Art home
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15">
            <Layers size={18} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Art Unit Builder</h1>
            <p className="text-xs text-ink-500">2–3 connected studio stages · NCAS-aligned</p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a multi-stage art project where each session builds directly on the last —
          from foundational technique through independent creation to finished work.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Project details */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Project details</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-name">
              Unit / project name
            </label>
            <input
              id="unit-name"
              type="text"
              placeholder="e.g. Watercolor Landscapes"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Leave blank and the AI will generate one from your project description.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="project-desc">
              Project description <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="project-desc"
              type="text"
              placeholder="e.g. Study warm/cool colors through layered watercolor washes; final piece is a landscape"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Describe the artistic concept, technique, or project arc across these stages.
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
                      ? 'bg-orange-500 text-white'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-500">Each stage = one art class period.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="unit-standard">
              Target standard <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="unit-standard"
              type="text"
              placeholder="e.g. VA:Cr1.1.3a or NCAS Creating"
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

        {/* Art supplies */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-200">
            Art supplies{' '}
            <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-2">
            List specific supplies available for this project across all stages.
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
              Add supply
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
              Generate {sessionCount}-stage art project
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
