import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Sparkles, Loader2, Plus, X, ArrowLeft, ExternalLink } from 'lucide-react'
import { generateLibraryLesson } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import LessonPrintFix from '../components/LessonPrintFix'
import StationsToggle from '../components/StationsToggle'
import UdlEfToggle from '../components/UdlEfToggle'
import LibraryPlanRenderer from '../components/renderers/LibraryPlanRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'
import { useProfileDefaults, useGradeStateDefaults } from '../hooks/useProfileDefaults'
import { persistFirstRun } from '../services/onboardingService'
import FirstRunFields from '../components/FirstRunFields'
import { track, setPersonProps } from '../lib/analytics'

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

export default function LibraryGenerator() {
  const [view, setView] = useState('form')

  // Form fields
  const [gradeBands, setGradeBands] = useState([3])
  const [state, setState] = useState('VA')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(40)
  const [topic, setTopic] = useState('')
  const [targetStandard, setTargetStandard] = useState('')
  const [materials, setMaterials] = useState(['', ''])

  // Result
  const [generatedLesson, setGeneratedLesson] = useState(null)
  const [savedId, setSavedId] = useState(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [includeELL, setIncludeELL] = useState(false)
  const [includeUdlEf, setIncludeUdlEf] = useState(false)
  const [handsOn, setHandsOn] = useState(false)
  const [useStations, setUseStations] = useState(false)
  const [numStations, setNumStations] = useState(3)
  // Hands-on/kinesthetic toggle surfaces only for elementary (K–5) grades.
  const showHandsOn = gradeBands.some((g) => g <= 5)

  const { onboarded, ready: profileReady, refresh: refreshProfile } = useProfileDefaults()
  useGradeStateDefaults(setGradeBands, setState)
  // Pre-select the module she's already in — she's confirming + adding, not starting cold.
  const [firstRun, setFirstRun] = useState({ areas: ['library_media'], ctePathways: [], other: '' })

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

    try {
      const lessonObject = await generateLibraryLesson({
        gradeBands,
        topic: topic.trim(),
        materials: materials.filter(Boolean),
        classSize,
        durationMinutes: duration,
        targetStandard: targetStandard.trim(),
        state,
        includeELL,
        handsOn: showHandsOn && handsOn,
        stationsMode: useStations,
        stationCount: useStations ? Number(numStations) : undefined,
        includeUdlEf,
      })

      const saved = await createLesson(lessonObject, { aiModel: 'claude-sonnet-4-6' })

      setGeneratedLesson(lessonObject)
      setSavedId(saved.id)
      setView('result')

      if (profileReady && !onboarded) {
        try {
          await persistFirstRun({
            teachingAreas: firstRun.areas,
            ctePathways: firstRun.ctePathways,
            teachingOther: firstRun.other,
            gradeLevels: gradeBands.map(String),
            state,
          })
          const answered = firstRun.areas.length > 0
          track(answered ? 'onboarding_answered' : 'onboarding_skipped', {
            area_count: firstRun.areas.length,
            has_cte: firstRun.ctePathways.length > 0,
          })
          if (answered) setPersonProps({ teaching_areas: firstRun.areas, cte_pathways: firstRun.ctePathways })
          track('first_lesson_generated', { module: 'library' })
          refreshProfile()
        } catch { /* non-fatal */ }
      }
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setView('form')
    setGeneratedLesson(null)
    setSavedId(null)
    setError(null)
  }

  if (view === 'result' && generatedLesson) {
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
              Generate another
            </button>
            {savedId && (
              <Link
                to={`/lessons/${savedId}`}
                className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
              >
                View lesson detail
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>

        {savedId && (
          <p className="mb-4 text-xs text-ink-500 print:hidden">
            Saved to your lesson library.
          </p>
        )}

        {savedId && (
          <SecondaryToolsPanel
            savedId={savedId}
            lessonObject={generatedLesson}
            subject={generatedLesson?.subject}
          />
        )}

        <div className="mt-10">
          <LessonPrintFix lesson={generatedLesson} />
          <LibraryPlanRenderer lesson={generatedLesson} />
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15">
            <BookOpen size={18} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Library & Media Lesson Generator</h1>
            <p className="text-xs text-ink-500">
              Elementary K–5 · AASL-aligned
            </p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a complete elementary library lesson with a structured read-aloud, direct
          skill instruction, and hands-on practice activity.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {profileReady && !onboarded && <FirstRunFields value={firstRun} onChange={setFirstRun} />}
        {/* Class setup */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Class setup</h2>

          {/* Grade bands */}
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

          {/* State */}
          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="lib-state">
              State
            </label>
            <select
              id="lib-state"
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

          {/* Class size + duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="lib-classsize">
                Class size
              </label>
              <input
                id="lib-classsize"
                type="number"
                min={1}
                max={60}
                value={classSize}
                onChange={(e) => setClassSize(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="lib-duration">
                Duration (minutes)
              </label>
              <input
                id="lib-duration"
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

        {/* Lesson details */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Lesson details</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="lib-topic">
              Topic / lesson focus
            </label>
            <input
              id="lib-topic"
              type="text"
              placeholder="e.g. Using the library catalog to find books by subject"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">
              Examples: Genre study — fiction vs. nonfiction · Call number basics ·
              Digital citizenship and safe searching · Evaluating sources
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="lib-standard">
              Target standard{' '}
              <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="lib-standard"
              type="text"
              placeholder="e.g. AASL I.A.1 or VSLA 3.2"
              value={targetStandard}
              onChange={(e) => setTargetStandard(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Materials */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-200">
            Materials & resources{' '}
            <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-2">
            List specific books, databases, or devices — the AI will build the lesson around
            what you have.
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

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">ELL accommodations</h2>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={includeELL}
              onChange={(e) => setIncludeELL(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
            />
            <div>
              <span className="text-sm text-ink-300">Include ELL accommodations</span>
              <p className="mt-0.5 text-xs text-ink-500">
                Adds language objectives, tiered vocabulary, sentence frames, and visual supports for English Language Learners.
              </p>
            </div>
          </label>
        </div>

        {showHandsOn && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">Hands-on / kinesthetic</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={handsOn}
                onChange={(e) => setHandsOn(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
              />
              <div>
                <span className="text-sm text-ink-300">Hands-on / kinesthetic emphasis</span>
                <p className="mt-0.5 text-xs text-ink-500">
                  Favors manipulatives, movement &amp; tactile activities over worksheet/seatwork. Elementary (K–5) only.
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

        <UdlEfToggle value={includeUdlEf} onChange={setIncludeUdlEf} />
        <StationsToggle
          useStations={useStations}
          setUseStations={setUseStations}
          numStations={numStations}
          setNumStations={setNumStations}
          label="Use rotating stations"
          hint="Structure independent practice as rotating library-skill stations — e.g. catalog search, shelf browsing, source evaluation, book selection."
        />

        <button
          type="submit"
          disabled={loading || gradeBands.length === 0}
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
              Generate library lesson
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            This usually takes 1–2 minutes · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
