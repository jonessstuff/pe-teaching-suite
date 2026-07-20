import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Accessibility, Sparkles, Loader2, Plus, X, ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react'
import { generateAdaptivePE } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import AdaptivePERenderer from '../components/renderers/AdaptivePERenderer'
import { useTrial } from '../context/TrialContext'

const IEP_GOAL_CATEGORIES = [
  'Locomotor',
  'Object Control / Manipulation',
  'Balance / Stability',
  'Fitness',
  'Social / Behavioral',
  'Aquatics',
]

const GRADE_OPTIONS = [
  { value: 0, label: 'K' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
  { value: 11, label: '11' },
  { value: 12, label: '12' },
]

const EQUIPMENT_PLACEHOLDERS = [
  'e.g. Foam balls — 6',
  'e.g. Poly spots — 12',
  'e.g. Cones — 20',
  'e.g. Balance beam (floor level)',
  'e.g. Hula hoops — 8',
  'e.g. Velcro mitts — 4 pairs',
  'e.g. Resistance bands (light)',
  'e.g. Scooter boards — 4',
]

export default function AdaptivePEGenerator() {
  const { requestExport } = useTrial()
  const [mode, setMode] = useState('adapt') // 'adapt' | 'plan'
  const [view, setView] = useState('form')  // 'form' | 'result'

  // ── Mode 1 (adapt) form state ──
  const [iepGoalCategory, setIepGoalCategory] = useState(IEP_GOAL_CATEGORIES[0])
  const [iepGoalText, setIepGoalText] = useState('')
  const [currentActivity, setCurrentActivity] = useState('')
  const [gradeLevel, setGradeLevel] = useState(3)
  const [accommodationNeeds, setAccommodationNeeds] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [classSize, setClassSize] = useState(28)

  // ── Mode 2 (plan) form state ──
  const [planIepGoalCategory, setPlanIepGoalCategory] = useState(IEP_GOAL_CATEGORIES[0])
  const [iepGoalTexts, setIepGoalTexts] = useState('')
  const [planGradeLevel, setPlanGradeLevel] = useState(3)
  const [planGroupDescription, setPlanGroupDescription] = useState('')
  const [planAccommodationNeeds, setPlanAccommodationNeeds] = useState('')
  const [planTeacherNotes, setPlanTeacherNotes] = useState('')
  const [planClassSize, setPlanClassSize] = useState(8)
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [equipment, setEquipment] = useState(['', ''])

  // ── Shared result state ──
  const [includeELL, setIncludeELL] = useState(false)
  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addEquipment = () => setEquipment((prev) => [...prev, ''])
  const removeEquipment = (i) => setEquipment((prev) => prev.filter((_, idx) => idx !== i))
  const setEquipmentItem = (i, value) =>
    setEquipment((prev) => prev.map((m, idx) => (idx === i ? value : m)))

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input =
        mode === 'adapt'
          ? { mode, iepGoalCategory, iepGoalText, currentActivity, gradeLevel, accommodationNeeds, teacherNotes, classSize }
          : { mode: 'plan', iepGoalCategory: planIepGoalCategory, iepGoalTexts, gradeLevel: planGradeLevel, groupDescription: planGroupDescription, accommodationNeeds: planAccommodationNeeds, teacherNotes: planTeacherNotes, classSize: planClassSize, durationMinutes, equipmentAvailable: equipment.filter(Boolean), includeELL }

      const generated = await generateAdaptivePE(input)
      setResult(generated)

      if (mode === 'plan') {
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
        {/* Toolbar */}
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link
            to="/pe-health"
            className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
          >
            <ArrowLeft size={16} />
            PE & Health
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
          >
            Start over
          </button>
          {savedId && (
            <Link
              to={`/lessons/${savedId}`}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
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
          <p className="mb-4 text-xs text-ink-500 print:hidden">
            Saved to your lesson archive.
          </p>
        )}

        <AdaptivePERenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/pe-health"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          PE & Health
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15">
            <Accessibility size={18} className="text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Adaptive PE & IEP Planning</h1>
            <p className="text-xs text-ink-500">
              Inclusion support · APE lesson planning · IEP documentation
            </p>
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="text-sm">
          <p className="font-medium text-amber-300">Privacy notice</p>
          <p className="mt-0.5 text-amber-400">
            Do not enter student names or personally identifiable information. This tool generates planning support only and is not a substitute for official IEP documentation.
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg bg-ink-900 p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('adapt')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'adapt'
              ? 'bg-ink-700 text-ink-50 shadow-sm'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          Adapt a lesson
        </button>
        <button
          type="button"
          onClick={() => setMode('plan')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'plan'
              ? 'bg-ink-700 text-ink-50 shadow-sm'
              : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          Plan APE lesson
        </button>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">

        {mode === 'adapt' ? (
          /* ── Mode 1: Adapt a lesson ── */
          <>
            <div className="card p-6 space-y-5">
              <h2 className="text-sm font-semibold text-ink-200">Student & goal</h2>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="ape-goal-cat">
                  IEP goal category
                </label>
                <select
                  id="ape-goal-cat"
                  value={iepGoalCategory}
                  onChange={(e) => setIepGoalCategory(e.target.value)}
                  className="input-field"
                >
                  {IEP_GOAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="ape-goal-text">
                  Specific IEP goal
                </label>
                <textarea
                  id="ape-goal-text"
                  placeholder="e.g. Student will demonstrate a mature overhand throw pattern releasing the ball at or above shoulder height in 4 of 5 trials across 3 consecutive sessions."
                  value={iepGoalText}
                  onChange={(e) => setIepGoalText(e.target.value)}
                  rows={3}
                  required
                  className="input-field min-h-[80px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="ape-activity">
                  Current class activity or unit
                </label>
                <input
                  id="ape-activity"
                  type="text"
                  placeholder="e.g. Kickball, Track & Field relay, Badminton unit Day 2"
                  value={currentActivity}
                  onChange={(e) => setCurrentActivity(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="ape-accommodation">
                  Accommodation needs{' '}
                  <span className="text-ink-500">(optional — helps tailor suggestions)</span>
                </label>
                <textarea
                  id="ape-accommodation"
                  placeholder="e.g. leaves class early, fidget tools, preferential seating, extended time, modified equipment, visual supports"
                  value={accommodationNeeds}
                  onChange={(e) => setAccommodationNeeds(e.target.value)}
                  rows={2}
                  className="input-field min-h-[64px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="ape-teacher-notes">
                  Teacher notes{' '}
                  <span className="text-ink-500">(optional)</span>
                </label>
                <textarea
                  id="ape-teacher-notes"
                  placeholder="Any additional context to help generate appropriate modifications"
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  rows={2}
                  className="input-field min-h-[64px]"
                />
              </div>
            </div>

            <div className="card p-6 space-y-5">
              <h2 className="text-sm font-semibold text-ink-200">Class details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="ape-grade">
                    Grade level
                  </label>
                  <select
                    id="ape-grade"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(Number(e.target.value))}
                    className="input-field"
                  >
                    {GRADE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label === 'K' ? 'Kindergarten' : `Grade ${label}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="ape-classsize">
                    Class size
                  </label>
                  <input
                    id="ape-classsize"
                    type="number"
                    min={1}
                    max={60}
                    value={classSize}
                    onChange={(e) => setClassSize(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── Mode 2: Plan APE lesson ── */
          <>
            <div className="card p-6 space-y-5">
              <h2 className="text-sm font-semibold text-ink-200">IEP goals &amp; accommodations</h2>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-group-desc">
                  Group description{' '}
                  <span className="text-ink-500">(optional)</span>
                </label>
                <textarea
                  id="plan-group-desc"
                  placeholder="e.g. small group, 4 students, grades 3-5, mixed abilities — do not include student names"
                  value={planGroupDescription}
                  onChange={(e) => setPlanGroupDescription(e.target.value)}
                  rows={2}
                  className="input-field min-h-[64px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-goal-cat">
                  Primary IEP goal category
                </label>
                <select
                  id="plan-goal-cat"
                  value={planIepGoalCategory}
                  onChange={(e) => setPlanIepGoalCategory(e.target.value)}
                  className="input-field"
                >
                  {IEP_GOAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-goals">
                  Specific IEP goals{' '}
                  <span className="text-ink-500">(one per line)</span>
                </label>
                <textarea
                  id="plan-goals"
                  placeholder={`e.g.\nStudent will hop on one foot for 5 consecutive hops in 4 of 5 trials.\nStudent will walk forward on a balance beam (2-inch wide, floor level) without stepping off in 3 of 4 attempts.`}
                  value={iepGoalTexts}
                  onChange={(e) => setIepGoalTexts(e.target.value)}
                  rows={4}
                  required
                  className="input-field min-h-[100px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-accommodation">
                  Accommodation needs{' '}
                  <span className="text-ink-500">(optional — helps tailor the lesson)</span>
                </label>
                <textarea
                  id="plan-accommodation"
                  placeholder="e.g. 4 students, ambulatory, two use AAC devices, sensory sensitivities to loud noise, need visual boundary cues, extended processing time"
                  value={planAccommodationNeeds}
                  onChange={(e) => setPlanAccommodationNeeds(e.target.value)}
                  rows={3}
                  className="input-field min-h-[80px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-teacher-notes">
                  Teacher notes{' '}
                  <span className="text-ink-500">(optional)</span>
                </label>
                <textarea
                  id="plan-teacher-notes"
                  placeholder="Any additional context to help generate appropriate modifications"
                  value={planTeacherNotes}
                  onChange={(e) => setPlanTeacherNotes(e.target.value)}
                  rows={2}
                  className="input-field min-h-[64px]"
                />
              </div>
            </div>

            <div className="card p-6 space-y-5">
              <h2 className="text-sm font-semibold text-ink-200">Session details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-grade">
                    Grade level
                  </label>
                  <select
                    id="plan-grade"
                    value={planGradeLevel}
                    onChange={(e) => setPlanGradeLevel(Number(e.target.value))}
                    className="input-field"
                  >
                    {GRADE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label === 'K' ? 'Kindergarten' : `Grade ${label}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-classsize">
                    Group size
                  </label>
                  <input
                    id="plan-classsize"
                    type="number"
                    min={1}
                    max={30}
                    value={planClassSize}
                    onChange={(e) => setPlanClassSize(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="plan-duration">
                    Session duration (minutes)
                  </label>
                  <input
                    id="plan-duration"
                    type="number"
                    min={15}
                    max={90}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="text-sm font-semibold text-ink-200">
                Equipment & space available{' '}
                <span className="font-normal text-ink-500">(optional)</span>
              </h2>
              <p className="text-xs text-ink-500 -mt-2">
                List specific equipment and quantities — the AI will build the lesson around what you have.
              </p>
              <div className="space-y-2">
                {equipment.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => setEquipmentItem(i, e.target.value)}
                      placeholder={EQUIPMENT_PLACEHOLDERS[i % EQUIPMENT_PLACEHOLDERS.length]}
                      className="input-field flex-1"
                    />
                    {equipment.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEquipment(i)}
                        className="text-ink-600 hover:text-ink-300 transition-colors"
                        aria-label="Remove"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {equipment.length < 8 && (
                <button
                  type="button"
                  onClick={addEquipment}
                  className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
                >
                  <Plus size={16} />
                  Add equipment
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
          </>
        )}

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
              {mode === 'adapt' ? 'Generate accommodation plan' : 'Generate APE lesson plan'}
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
