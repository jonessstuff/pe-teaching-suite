import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, UtensilsCrossed, Landmark, Megaphone, HeartHandshake, Sparkles, Loader2, Plus, X, ArrowLeft, ExternalLink } from 'lucide-react'
import { generateCteLesson } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import { US_STATES } from '../constants/usStates'
import CtePlanRenderer from '../components/renderers/CtePlanRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'

const PATHWAYS = [
  {
    value: 'hospitality',
    label: 'Hospitality & Tourism',
    description: 'Lodging, foodservice, travel & guest service',
    icon: UtensilsCrossed,
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Personal finance, banking, accounting & investing',
    icon: Landmark,
  },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'The marketing mix, promotion, selling & branding',
    icon: Megaphone,
  },
  {
    value: 'human_services',
    label: 'Human Services / FCS',
    description: 'Family & Consumer Sciences, independent living & workplace readiness',
    icon: HeartHandshake,
  },
]

const LEVELS = [
  { value: 'introductory', label: 'Introductory', description: 'Foundational — first course in the pathway' },
  { value: 'concentrator', label: 'Concentrator', description: 'Deeper technical skill & credential prep' },
  { value: 'completer', label: 'Completer', description: 'Capstone, credential attainment & WBL' },
]

const TOPIC_PLACEHOLDERS = {
  hospitality: 'e.g. Guest service recovery, Front desk check-in procedure, Food safety & sanitation (ServSafe), Planning a destination tour',
  finance:     'e.g. Building a monthly budget, Comparing two credit-card offers, Simple vs. compound interest, Reading a pay stub',
  marketing:   'e.g. Identify a target market, Build the marketing mix for a product, Analyze a real ad campaign, DECA role-play prep',
  human_services: 'e.g. Reading a nutrition label, Building a personal budget, Age-appropriate child activities, Mock job interview & workplace readiness',
}

const MATERIAL_PLACEHOLDERS = {
  hospitality: [
    'e.g. Place-setting kits — 1 per pair',
    'e.g. Mock front-desk station',
    'e.g. Sanitation supplies & gloves',
    'e.g. Guest-scenario role-play cards',
    'e.g. Sample menus / property brochures',
    'e.g. ServSafe practice materials',
    'e.g. Aprons — 1 per student',
    'e.g. Tablet for reservation software',
  ],
  finance: [
    'e.g. Laptops with spreadsheet software — 1 per student',
    'e.g. Sample credit-card agreements (printed)',
    'e.g. Mock pay stubs — 1 per student',
    'e.g. Financial calculators',
    'e.g. Budget worksheet (printed)',
    'e.g. Sample bank statements',
    'e.g. FBLA event guidelines',
    'e.g. Projector for worked examples',
  ],
  marketing: [
    'e.g. Sample product packaging — 6 assorted',
    'e.g. Laptops with Canva — 1 per team',
    'e.g. Real ad examples (print or video)',
    'e.g. Poster paper & markers',
    'e.g. DECA role-play scenario cards',
    'e.g. Market-research survey template',
    'e.g. Brand logo cards for analysis',
    'e.g. Projector for campaign analysis',
  ],
  human_services: [
    'e.g. Nutrition labels / food models',
    'e.g. Measuring cups & basic foods-lab tools',
    'e.g. Budget worksheet (printed)',
    'e.g. Child-development activity supplies',
    'e.g. Mock interview question cards',
    'e.g. Sample consumer contracts / ads',
    'e.g. FCCLA STAR Event guidelines',
    'e.g. Laptops for research — 1 per pair',
  ],
}

export default function CteGenerator() {
  const [view, setView] = useState('form')

  // Pathway
  const [pathway, setPathway] = useState('hospitality')

  // Two-tier grade model (replaces the K–5 grade toggle for CTE)
  const [tier, setTier] = useState('ms')
  const [level, setLevel] = useState('introductory')

  // Form fields
  const [state, setState] = useState('VA')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(90)
  const [topic, setTopic] = useState('')
  const [targetCompetency, setTargetCompetency] = useState('')
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

  const placeholders = MATERIAL_PLACEHOLDERS[pathway] ?? MATERIAL_PLACEHOLDERS.hospitality

  const addMaterial = () => setMaterials((prev) => [...prev, ''])
  const removeMaterial = (i) => setMaterials((prev) => prev.filter((_, idx) => idx !== i))
  const setMaterial = (i, value) =>
    setMaterials((prev) => prev.map((m, idx) => (idx === i ? value : m)))

  function handlePathwayChange(value) {
    setPathway(value)
    setMaterials(['', ''])
    setTopic('')
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const lessonObject = await generateCteLesson({
        pathway,
        tier,
        level: tier === 'hs' ? level : '',
        topic: topic.trim(),
        materials: materials.filter(Boolean),
        classSize,
        durationMinutes: duration,
        targetCompetency: targetCompetency.trim(),
        state,
        sessionNumber: isMultiStage ? sessionNumber : 0,
        totalSessions: isMultiStage ? totalSessions : 0,
        includeELL,
      })

      const saved = await createLesson(lessonObject, { aiModel: 'claude-sonnet-4-6' })

      setGeneratedLesson(lessonObject)
      setSavedId(saved.id)
      setView('result')
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
              to="/cte"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              CTE
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
          <CtePlanRenderer lesson={generatedLesson} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/cte"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          CTE home
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20">
            <Briefcase size={18} className="text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">CTE Lesson Generator</h1>
            <p className="text-xs text-ink-500">
              Beta — Middle School &amp; High School · competency &amp; credential-aligned
            </p>
          </div>
        </div>
        <p className="text-sm text-ink-400 mt-3">
          Generate a complete Career &amp; Technical Education lesson across three pathways:
          Hospitality &amp; Tourism, Finance, or Marketing — with work-based learning and career
          pathway context built in.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">

        {/* Pathway selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">Pathway</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PATHWAYS.map(({ value, label, description, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePathwayChange(value)}
                className={`flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors ${
                  pathway === value
                    ? 'border-pink-400/50 bg-pink-500/15'
                    : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  pathway === value ? 'bg-pink-500/25' : 'bg-ink-800'
                }`}>
                  <Icon size={16} className={pathway === value ? 'text-pink-400' : 'text-ink-400'} />
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-tight ${
                    pathway === value ? 'text-ink-50' : 'text-ink-200'
                  }`}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500 leading-snug">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tier / level (replaces the K–5 grade toggle) */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Course tier &amp; level</h2>

          <div>
            <label className="mb-2 block text-sm text-ink-300">Tier</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTier('ms')}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  tier === 'ms'
                    ? 'border-pink-400/50 bg-pink-500/15'
                    : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                }`}
              >
                <p className={`text-sm font-semibold ${tier === 'ms' ? 'text-ink-50' : 'text-ink-200'}`}>
                  Middle School
                </p>
                <p className="mt-0.5 text-xs text-ink-500">Exploratory — career awareness &amp; rotation</p>
              </button>
              <button
                type="button"
                onClick={() => setTier('hs')}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  tier === 'hs'
                    ? 'border-pink-400/50 bg-pink-500/15'
                    : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                }`}
              >
                <p className={`text-sm font-semibold ${tier === 'hs' ? 'text-ink-50' : 'text-ink-200'}`}>
                  High School
                </p>
                <p className="mt-0.5 text-xs text-ink-500">Pathway — Intro → Concentrator → Completer</p>
              </button>
            </div>
          </div>

          {/* Conditional level selector — only for High School (Pathway) */}
          {tier === 'hs' && (
            <div>
              <label className="mb-2 block text-sm text-ink-300">Pathway level</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {LEVELS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLevel(value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      level === value
                        ? 'border-pink-400/50 bg-pink-500/15'
                        : 'border-ink-800 bg-ink-900 hover:border-ink-700'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${level === value ? 'text-ink-50' : 'text-ink-200'}`}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500 leading-snug">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Class setup */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Class setup</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-state">
              State
            </label>
            <select
              id="cte-state"
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
              <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-classsize">
                Class size
              </label>
              <input
                id="cte-classsize"
                type="number"
                min={1}
                max={60}
                value={classSize}
                onChange={(e) => setClassSize(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-duration">
                Duration (minutes)
              </label>
              <input
                id="cte-duration"
                type="number"
                min={30}
                max={180}
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
            <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-topic">
              Lesson topic / project name
            </label>
            <input
              id="cte-topic"
              type="text"
              placeholder={TOPIC_PLACEHOLDERS[pathway]}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-competency">
              Target competency / task{' '}
              <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="cte-competency"
              type="text"
              placeholder={
                pathway === 'hospitality'    ? 'e.g. Demonstrate proper handwashing (ServSafe)' :
                pathway === 'finance'        ? 'e.g. Calculate compound interest (Jump$tart)' :
                pathway === 'human_services' ? 'e.g. Plan a balanced meal (AAFCS Nutrition & Wellness)' :
                                               'e.g. Identify a target market (DECA PI)'
              }
              value={targetCompetency}
              onChange={(e) => setTargetCompetency(e.target.value)}
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
              className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-pink-500"
            />
            <span className="text-sm text-ink-300">
              This lesson is part of a multi-session project
            </span>
          </label>

          {isMultiStage && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-stage-num">
                  Stage number
                </label>
                <select
                  id="cte-stage-num"
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
                <label className="mb-1 block text-sm text-ink-300" htmlFor="cte-total-stages">
                  Total stages
                </label>
                <select
                  id="cte-total-stages"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  className="input-field"
                >
                  {[2, 3, 4, 5].filter((n) => n >= sessionNumber).map((n) => (
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
            Equipment &amp; materials available{' '}
            <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-2">
            List specific equipment, industry props, and technology — the AI will build the lesson around what you have.
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
              Add item
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
              Generate CTE lesson
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
