import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, Wrench, Code2, Microscope, Hammer, Sparkles, Loader2, Plus, X, ArrowLeft, ExternalLink } from 'lucide-react'
import { generateStemLesson } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import LessonPrintFix from '../components/LessonPrintFix'
import StationsToggle from '../components/StationsToggle'
import UdlEfToggle from '../components/UdlEfToggle'
import StemPlanRenderer from '../components/renderers/StemPlanRenderer'
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

const FOCUS_AREAS = [
  {
    value: 'engineering',
    label: 'Engineering Design',
    description: 'Define a problem, design, build, and test',
    icon: Wrench,
  },
  {
    value: 'coding',
    label: 'Coding & CT',
    description: 'Algorithms, programming, and computational thinking',
    icon: Code2,
  },
  {
    value: 'science',
    label: 'Science Investigation',
    description: 'Observe, hypothesize, investigate, conclude',
    icon: Microscope,
  },
  {
    value: 'maker',
    label: 'Maker & Tinkering',
    description: 'Open-ended creation and invention',
    icon: Hammer,
  },
]

const TOPIC_PLACEHOLDERS = {
  engineering: 'e.g. Design a bridge that holds a textbook, Egg drop challenge, Build a wind-powered car',
  coding:      'e.g. Scratch animation using loops, Debug a broken algorithm, Code a simple quiz in Code.org',
  science:     'e.g. Sink or float investigation, How does light travel?, Simple machines around us',
  maker:       'e.g. Build a musical instrument from recycled materials, Cardboard automata, Paper circuit greeting card',
}

const MATERIAL_PLACEHOLDERS = {
  engineering: [
    'e.g. Popsicle sticks — 20 per group',
    'e.g. Masking tape — 1 roll per group',
    'e.g. Index cards — 10 per student',
    'e.g. Rubber bands — assorted sizes',
    'e.g. Paper clips — 1 bag per group',
    'e.g. Aluminum foil — 12-inch sheets, 3 per group',
    'e.g. Straws — 10 per group',
    'e.g. Scissors — 1 pair per student',
  ],
  coding: [
    'e.g. Chromebook or iPad — 1 per student',
    'e.g. Scratch accounts pre-created (scratch.mit.edu)',
    'e.g. Code.org section set up with class roster',
    'e.g. Headphones — 1 per student',
    'e.g. Unplugged activity cards (printed)',
    'e.g. Projector or class display screen',
    'e.g. Algorithm sorting cards (laminated)',
    'e.g. Whiteboard markers for debugging board',
  ],
  science: [
    'e.g. Magnifying glasses — 1 per student',
    'e.g. Measuring cups — 1 set per group',
    'e.g. Observation notebooks — 1 per student',
    'e.g. Plastic containers — 2 per group',
    'e.g. Various classroom objects for testing',
    'e.g. Rulers — 1 per student',
    'e.g. Pencils for recording data',
    'e.g. Recording sheets (printed, 1 per student)',
  ],
  maker: [
    'e.g. Cardboard scraps — assorted sizes',
    'e.g. Hot glue guns — 4 (teacher-supervised)',
    'e.g. Copper tape — 1 roll',
    'e.g. LED lights — 5 per group',
    'e.g. Wire — 18-gauge, 2 feet per student',
    'e.g. Fabric scraps and yarn',
    'e.g. Recycled materials (bottles, tubes, lids)',
    'e.g. Binder clips and rubber bands',
  ],
}

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

export default function StemGenerator() {
  const [view, setView] = useState('form')

  // Focus area
  const [focusArea, setFocusArea] = useState('engineering')

  // Form fields
  const [gradeBands, setGradeBands] = useState([3])
  const [state, setState] = useState('VA')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(45)
  const [topic, setTopic] = useState('')
  const [targetStandard, setTargetStandard] = useState('')
  const [materials, setMaterials] = useState(['', ''])

  // Multi-stage project
  const [isMultiStage, setIsMultiStage] = useState(false)
  const [sessionNumber, setSessionNumber] = useState(1)
  const [totalSessions, setTotalSessions] = useState(2)

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
  const [firstRun, setFirstRun] = useState({ areas: ['stem'], ctePathways: [], other: '' })

  const placeholders = MATERIAL_PLACEHOLDERS[focusArea] ?? MATERIAL_PLACEHOLDERS.engineering

  const addMaterial = () => setMaterials((prev) => [...prev, ''])
  const removeMaterial = (i) => setMaterials((prev) => prev.filter((_, idx) => idx !== i))
  const setMaterial = (i, value) =>
    setMaterials((prev) => prev.map((m, idx) => (idx === i ? value : m)))

  function handleFocusChange(value) {
    setFocusArea(value)
    setMaterials(['', ''])
    setTopic('')
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (gradeBands.length === 0) {
      setError('Select at least one grade.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const lessonObject = await generateStemLesson({
        focusArea,
        gradeBands,
        topic: topic.trim(),
        materials: materials.filter(Boolean),
        classSize,
        durationMinutes: duration,
        targetStandard: targetStandard.trim(),
        state,
        sessionNumber: isMultiStage ? sessionNumber : 0,
        totalSessions: isMultiStage ? totalSessions : 0,
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
          track('first_lesson_generated', { module: 'stem' })
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
            Saved to your lesson archive.
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
          <StemPlanRenderer lesson={generatedLesson} />
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
            <FlaskConical size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">STEM Lesson Generator</h1>
            <p className="text-xs text-ink-500">
              Elementary K–5 · NGSS · CSTA · ISTE-aligned
            </p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a complete K–5 STEM lesson across four focus areas: engineering design,
          coding, science investigation, or maker & tinkering.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {profileReady && !onboarded && <FirstRunFields value={firstRun} onChange={setFirstRun} />}

        {/* Focus area selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">Focus area</h2>
          <div className="grid grid-cols-2 gap-3">
            {FOCUS_AREAS.map(({ value, label, description, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleFocusChange(value)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  focusArea === value
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  focusArea === value ? 'bg-cyan-500/20' : 'bg-ink-800'
                }`}>
                  <Icon size={16} className={focusArea === value ? 'text-cyan-400' : 'text-ink-400'} />
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-tight ${
                    focusArea === value ? 'text-ink-300' : 'text-ink-200'
                  }`}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500 leading-snug">{description}</p>
                </div>
              </button>
            ))}
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
            <label className="mb-1 block text-sm text-ink-300" htmlFor="stem-state">
              State
            </label>
            <select
              id="stem-state"
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
              <label className="mb-1 block text-sm text-ink-300" htmlFor="stem-classsize">
                Class size
              </label>
              <input
                id="stem-classsize"
                type="number"
                min={1}
                max={60}
                value={classSize}
                onChange={(e) => setClassSize(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="stem-duration">
                Duration (minutes)
              </label>
              <input
                id="stem-duration"
                type="number"
                min={20}
                max={120}
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
            <label className="mb-1 block text-sm text-ink-300" htmlFor="stem-topic">
              Lesson topic / project name
            </label>
            <input
              id="stem-topic"
              type="text"
              placeholder={TOPIC_PLACEHOLDERS[focusArea]}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="stem-standard">
              Target standard{' '}
              <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="stem-standard"
              type="text"
              placeholder={
                focusArea === 'coding'   ? 'e.g. 1B-AP-10 or ISTE 5.5b' :
                focusArea === 'maker'    ? 'e.g. ISTE 4.4a or 1A-AP-11' :
                                           'e.g. 3-5-ETS1-1 or K-PS2-1'
              }
              value={targetStandard}
              onChange={(e) => setTargetStandard(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Multi-session project */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-200">Multi-session project</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isMultiStage}
              onChange={(e) => setIsMultiStage(e.target.checked)}
              className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-cyan-500"
            />
            <span className="text-sm text-ink-300">
              This lesson is part of a multi-session project
            </span>
          </label>

          {isMultiStage && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="stem-stage-num">
                  Stage number
                </label>
                <select
                  id="stem-stage-num"
                  value={sessionNumber}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    setSessionNumber(n)
                    if (n >= totalSessions) setTotalSessions(n + 1)
                  }}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>Stage {n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="stem-total-stages">
                  Total stages
                </label>
                <select
                  id="stem-total-stages"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  className="input-field"
                >
                  {[2, 3, 4, 5].filter((n) => n > sessionNumber || n >= sessionNumber).map((n) => (
                    <option key={n} value={n}>{n} stages</option>
                  ))}
                </select>
              </div>
              <p className="col-span-2 text-xs text-ink-500 -mt-2">
                The lesson will be titled &ldquo;{topic.trim() || 'Project Name'} — Stage {sessionNumber} of {totalSessions}&rdquo; and will include continuity instructions.
              </p>
            </div>
          )}
        </div>

        {/* Materials */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink-200">
            {focusArea === 'coding' ? 'Technology & materials available' : 'Materials available'}{' '}
            <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-2">
            {focusArea === 'coding'
              ? 'List specific devices, platforms, and any physical materials — the AI will build the lesson around what you have.'
              : 'List specific materials and quantities — the AI will build the lesson around what you have.'}
          </p>

          <div className="space-y-2">
            {materials.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={m}
                  onChange={(e) => setMaterial(i, e.target.value)}
                  placeholder={placeholders[i % placeholders.length]}
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
              Add {focusArea === 'coding' ? 'item' : 'material'}
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
                  Favors building, manipulatives &amp; movement over worksheet/seatwork. Elementary (K–5) only.
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
          hint="Structure the investigation as rotating stations — e.g. testing, prototyping, data-collection, design-challenge."
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
              Generate STEM lesson
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            This usually takes 1–3 minutes · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
