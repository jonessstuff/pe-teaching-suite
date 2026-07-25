import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, Loader2, X, Plus, ArrowLeft, ExternalLink } from 'lucide-react'
import { gradeLabel } from '../types/lessonObject'
import { PE_HEALTH_SUBJECTS } from '../constants/modules'
import { generateLesson, generateUnit, generateFitnessTestPrep } from '../services/generationService'
import { createLesson, createUnit } from '../services/lessonsService'
import { listPeriods } from '../services/classPeriodsService'
import { listStudentsByPeriod } from '../services/studentsService'
import { getProfile } from '../services/profilesService'
import { listPresets, savePreset, deletePreset } from '../services/presetsService'
import { US_STATES } from '../constants/usStates'
import PlanBookRenderer from '../components/renderers/PlanBookRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'

const GRADE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function LessonGenerator() {
  const navigate = useNavigate()
  const { state: routeState } = useLocation()
  const fromUnit = routeState ?? {}

  const [subject, setSubject] = useState(fromUnit.subject ?? 'PE')
  const [gradeBands, setGradeBands] = useState([])
  const [unit, setUnit] = useState(fromUnit.unit ?? '')
  const [topic, setTopic] = useState('')
  const [targetStandard, setTargetStandard] = useState('')
  const [mode, setMode] = useState('lesson') // 'lesson' | 'unit' | 'fitness_test'
  const [fitnessTestName, setFitnessTestName] = useState('FitnessGram')
  const [fitnessComponents, setFitnessComponents] = useState([])
  const [unitName, setUnitName] = useState(fromUnit.unit ?? '')
  const [unitTheme, setUnitTheme] = useState('')
  const [unitDays, setUnitDays] = useState(3)
  const [equipment, setEquipment] = useState([''])
  const [classSize, setClassSize] = useState(28)
  const [duration, setDuration] = useState(45)
  const [state, setState] = useState('')
  const [useStations, setUseStations] = useState(false)
  const [numStations, setNumStations] = useState(3)
  const [includeELL, setIncludeELL] = useState(false)

  const [periods, setPeriods] = useState([])
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [periodStudents, setPeriodStudents] = useState([])

  const [presets, setPresets] = useState([])
  const [savingPreset, setSavingPreset] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetSaveStatus, setPresetSaveStatus] = useState('idle') // idle | saving | error

  const [status, setStatus] = useState('idle') // idle | generating | error | result
  const [errorMsg, setErrorMsg] = useState(null)
  const [generatedLesson, setGeneratedLesson] = useState(null)
  const [savedId, setSavedId] = useState(null)

  useEffect(() => {
    listPeriods().then(setPeriods).catch(() => {})
    getProfile().then((p) => { if (p?.state) setState(p.state) }).catch(() => {})
    listPresets().then(setPresets).catch(() => {})
  }, [])

  function handlePeriodSelect(periodId) {
    setSelectedPeriodId(periodId)
    setPeriodStudents([])
    if (!periodId) return
    const period = periods.find((p) => p.id === periodId)
    if (!period) return
    setSubject(period.subject)
    setGradeBands(period.grade_bands ?? [])
    setClassSize(period.class_size)
    setDuration(period.duration_minutes)
    listStudentsByPeriod(periodId).then(setPeriodStudents).catch(() => {})
  }

  function toggleGrade(grade) {
    const next = gradeBands.includes(grade)
      ? gradeBands.filter((g) => g !== grade)
      : [...gradeBands, grade].sort((a, b) => a - b)
    setGradeBands(next)
    if (mode === 'unit' && next.length >= 3 && unitDays === 3) setUnitDays(2)
  }

  function updateEquipment(index, value) {
    setEquipment((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function addEquipmentField() {
    setEquipment((prev) => [...prev, ''])
  }

  function removeEquipmentField(index) {
    setEquipment((prev) => prev.filter((_, i) => i !== index))
  }

  function currentSettings() {
    return {
      subject,
      gradeBands,
      state,
      classSize: Number(classSize),
      duration: Number(duration),
      equipment: equipment.filter(Boolean),
      useStations,
      numStations: Number(numStations),
    }
  }

  function applyPreset(presetId) {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return
    const s = preset.settings
    if (s.subject != null) setSubject(s.subject)
    if (s.gradeBands != null) setGradeBands(s.gradeBands)
    if (s.state != null) setState(s.state)
    if (s.classSize != null) setClassSize(s.classSize)
    if (s.duration != null) setDuration(s.duration)
    if (s.equipment != null) setEquipment(s.equipment.length ? s.equipment : [''])
    if (s.useStations != null) setUseStations(s.useStations)
    if (s.numStations != null) setNumStations(s.numStations)
  }

  async function handleSavePreset() {
    if (!presetName.trim()) return
    setPresetSaveStatus('saving')
    try {
      const saved = await savePreset(presetName.trim(), currentSettings())
      setPresets((prev) => [...prev, saved])
      setPresetSaveStatus('idle')
      setSavingPreset(false)
      setPresetName('')
    } catch {
      setPresetSaveStatus('error')
    }
  }

  async function handleDeletePreset(id) {
    try {
      await deletePreset(id)
      setPresets((prev) => prev.filter((p) => p.id !== id))
    } catch { /* fail silently; row stays until next load */ }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('generating')
    setErrorMsg(null)

    try {
      const studentAccommodations = periodStudents
        .filter((s) => s.accommodation_notes)
        .map((s) => ({
          name_or_initials: s.name_or_initials,
          accommodation_notes: s.accommodation_notes,
        }))

      if (mode === 'fitness_test') {
        const components = fitnessComponents.length ? fitnessComponents : ['cardiovascular']
        const lessonObjects = []
        for (const component of components) {
          const lo = await generateFitnessTestPrep({
            gradeBands,
            testName: fitnessTestName,
            component,
            state: state || undefined,
            classSize: Number(classSize),
            duration: Number(duration),
          })
          lessonObjects.push(lo)
        }
        const lessonObject = lessonObjects[0]
        const saved = await createLesson(lessonObject, { aiModel: 'claude-sonnet-4-6' })
        for (let i = 1; i < lessonObjects.length; i++) {
          await createLesson(lessonObjects[i], { aiModel: 'claude-sonnet-4-6' })
        }
        setGeneratedLesson(lessonObject)
        setSavedId(saved.id)
        setStatus('result')
      } else if (mode === 'unit') {
        const { days } = await generateUnit({
          gradeBands,
          unitName,
          theme: unitTheme,
          days: Number(unitDays),
          targetStandard: targetStandard.trim(),
          subject,
          state: state || undefined,
          stationsMode: useStations,
          stationCount: useStations ? Number(numStations) : undefined,
          equipment: equipment.map((e) => e.trim()).filter(Boolean),
          classSize: Number(classSize),
          durationMinutes: Number(duration),
          students: studentAccommodations,
          includeELL,
        })

        const createdUnit = await createUnit({ name: unitName, subject, gradeBands })

        let firstSaved = null
        for (const lessonObject of days) {
          const saved = await createLesson(lessonObject, {
            aiModel: 'claude-sonnet-4-6',
            unitId: createdUnit.id,
          })
          if (!firstSaved) firstSaved = saved
        }

        navigate('/lessons')
      } else {
        const lessonObject = await generateLesson({
          gradeBands,
          unit,
          topic,
          targetStandard: targetStandard.trim(),
          subject,
          state: state || undefined,
          stationsMode: useStations,
          stationCount: useStations ? Number(numStations) : undefined,
          equipment: equipment.map((e) => e.trim()).filter(Boolean),
          classSize: Number(classSize),
          durationMinutes: Number(duration),
          students: studentAccommodations,
          includeELL,
        })

        const saved = await createLesson(lessonObject, { aiModel: 'claude-sonnet-4-6' })
        setGeneratedLesson(lessonObject)
        setSavedId(saved.id)
        setStatus('result')
      }
    } catch (err) {
      setStatus('error')
      const msg = err?.message ?? ''
      const isTimeout = /timed?\s*out/i.test(msg)
      setErrorMsg(
        isTimeout && mode === 'unit'
          ? 'Unit generation timed out — try reducing the number of days or grade bands, then try again.'
          : isTimeout
          ? 'Generation timed out — please try again.'
          : msg || 'Something went wrong generating this lesson.'
      )
    }
  }

  function resetToForm() {
    setStatus('idle')
    setErrorMsg(null)
    setGeneratedLesson(null)
    setSavedId(null)
  }

  if (status === 'result' && generatedLesson) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <Link
              to="/pe-health"
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              PE &amp; Health
            </Link>
            <button
              type="button"
              onClick={resetToForm}
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

        <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your lesson archive.</p>

        <SecondaryToolsPanel
          savedId={savedId}
          lessonObject={generatedLesson}
          subject={subject}
        />

        <div className="mt-10">
          <PlanBookRenderer lesson={generatedLesson} />
        </div>
      </div>
    )
  }

  const isGenerating = status === 'generating'

  return (
    <div className="max-w-2xl">
      <p className="label-eyebrow mb-2">New lesson</p>
      <h1 className="text-2xl font-semibold mb-1">Generate a Lesson Object</h1>
      <p className="text-ink-500 mb-6">
        One generation builds the full lesson — standards, learning targets, success
        criteria, lesson flow, differentiation, vocabulary, and classroom management.
        Every export pulls from this.
      </p>

      {/* Presets bar */}
      <div className="mb-8 rounded-lg border border-ink-900 bg-ink-950/30 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="label-eyebrow">Saved presets</p>
          {!savingPreset && (
            <button
              type="button"
              onClick={() => setSavingPreset(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300"
            >
              <Plus size={12} />
              Save current settings
            </button>
          )}
        </div>

        {presets.length === 0 && !savingPreset && (
          <p className="text-xs text-ink-500">
            Save your class setup to re-apply it quickly next time.
          </p>
        )}

        {presets.length > 0 && !savingPreset && (
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <div key={p.id} className="flex items-stretch rounded-lg border border-ink-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className="bg-ink-900 pl-3 pr-2.5 py-1.5 text-sm font-medium text-ink-200 hover:bg-ink-800 hover:text-ink-50 transition-colors"
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePreset(p.id)}
                  className="flex w-7 items-center justify-center border-l border-ink-800 bg-ink-900 text-ink-500 hover:bg-ink-800 hover:text-ink-200 transition-colors"
                  aria-label={`Delete preset "${p.name}"`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {savingPreset && (
          <div className="flex items-center gap-2">
            <input
              className="input-field flex-1 min-w-0"
              placeholder="Name this preset…"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSavePreset() }
                if (e.key === 'Escape') { setSavingPreset(false); setPresetName('') }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSavePreset}
              disabled={!presetName.trim() || presetSaveStatus === 'saving'}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              {presetSaveStatus === 'saving'
                ? <Loader2 size={13} className="animate-spin" />
                : 'Save'
              }
            </button>
            <button
              type="button"
              onClick={() => { setSavingPreset(false); setPresetName('') }}
              className="shrink-0 text-sm text-ink-400 hover:text-ink-200"
            >
              Cancel
            </button>
          </div>
        )}

        {presetSaveStatus === 'error' && (
          <p className="text-xs text-red-400">Failed to save preset — please try again.</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Section 1: Class Setup ── */}
        <FormSection title="Class Setup" first>
          {periods.length > 0 && (
            <Field label="Class period (optional)" hint="Auto-fills subject, grade bands, class size, and duration.">
              <select
                className="input-field"
                value={selectedPeriodId}
                onChange={(e) => handlePeriodSelect(e.target.value)}
              >
                <option value="">Select a class period…</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}{p.room_label ? ` · ${p.room_label}` : ''} — {p.subject}, {p.duration_minutes} min
                  </option>
                ))}
              </select>
              {periodStudents.filter((s) => s.accommodation_notes).length > 0 && (
                <p className="mt-1.5 text-xs text-accent-400">
                  {periodStudents.filter((s) => s.accommodation_notes).length} student accommodation{periodStudents.filter((s) => s.accommodation_notes).length !== 1 ? 's' : ''} will be included in this lesson.
                </p>
              )}
            </Field>
          )}

          <Field label="Subject">
            <div className="flex flex-wrap gap-2">
              {PE_HEALTH_SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    subject === s
                      ? 'bg-accent-500 text-white'
                      : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Grade bands" hint="A single lesson can span multiple grades — standards and targets will be generated per grade.">
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
                    gradeBands.includes(g)
                      ? 'bg-accent-500 text-white'
                      : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                  }`}
                >
                  {gradeLabel(g)}
                </button>
              ))}
            </div>
          </Field>

          <Field label="State" hint="Standards will be aligned to this state. Defaults to your profile setting — override here per lesson.">
            <select
              className="input-field"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select a state…</option>
              {US_STATES.map((s) => (
                <option key={s.abbr} value={s.abbr}>{s.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class size">
              <input
                type="number"
                min={1}
                className="input-field"
                value={classSize}
                onChange={(e) => setClassSize(e.target.value)}
              />
            </Field>
            <Field label="Duration (minutes)">
              <input
                type="number"
                min={5}
                step={5}
                className="input-field"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 2: Lesson Details ── */}
        <FormSection title="Lesson Details">
          <Field label="What are you generating?">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode('lesson')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'lesson'
                    ? 'bg-accent-500 text-white'
                    : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                }`}
              >
                Single Lesson
              </button>
              <button
                type="button"
                onClick={() => setMode('unit')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'unit'
                    ? 'bg-accent-500 text-white'
                    : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                }`}
              >
                Unit (1-3 days)
              </button>
              <button
                type="button"
                onClick={() => setMode('fitness_test')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === 'fitness_test'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                }`}
              >
                Fitness Test Prep
              </button>
            </div>
          </Field>

          {mode === 'fitness_test' ? (
            <>
              <Field label="Fitness assessment" hint="Selects the specific protocols and standards used in generated lessons.">
                <div className="flex flex-wrap gap-2">
                  {['FitnessGram', 'Presidential', 'State-specific'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFitnessTestName(t)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        fitnessTestName === t
                          ? 'bg-emerald-500 text-white'
                          : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Components to prep" hint="A separate prep lesson is generated for each selected component. Leave all unselected to generate one cardiovascular lesson.">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'cardiovascular', label: 'Cardiovascular' },
                    { value: 'muscular', label: 'Muscular Strength & Endurance' },
                    { value: 'flexibility', label: 'Flexibility' },
                    { value: 'body_composition', label: 'Body Composition' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFitnessComponents((prev) =>
                        prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
                      )}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        fitnessComponents.includes(value)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          ) : mode === 'unit' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Unit name">
                  <input
                    className="input-field"
                    placeholder="Pickleball"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Number of days">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setUnitDays(n)}
                        className={`h-10 flex-1 rounded-lg text-sm font-semibold transition-colors ${
                          unitDays === n
                            ? 'bg-accent-500 text-white'
                            : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                        }`}
                      >
                        {n} {n === 1 ? 'day' : 'days'}
                      </button>
                    ))}
                  </div>
                  {unitDays === 3 && gradeBands.length >= 3 && (
                    <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                      <p className="text-xs text-ink-300">
                        Heads up — 3 days × 3+ grade bands is a large generation and may time out. Consider 2 days or 2 grade bands for best results.
                      </p>
                    </div>
                  )}
                </Field>
              </div>

              <Field
                label="Theme / focus notes (optional)"
                hint="Describe the overall progression you want — e.g. 'start with grip and serve, build to rally and scoring rules'."
              >
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="e.g. Introduce grip, serve, and basic rally on Day 1; build toward scoring and game play by the final day."
                  value={unitTheme}
                  onChange={(e) => setUnitTheme(e.target.value)}
                />
              </Field>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Unit">
                <input
                  className="input-field"
                  placeholder="Striking & Fielding"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </Field>
              <Field label="Lesson topic">
                <input
                  className="input-field"
                  placeholder="Kickball Day 1"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </Field>
            </div>
          )}

          <Field
            label="Target standard / objective (optional)"
            hint="e.g. 7.2.a — the lesson(s) will be built around this specific standard."
          >
            <input
              className="input-field"
              placeholder="7.2.a"
              value={targetStandard}
              onChange={(e) => setTargetStandard(e.target.value)}
            />
          </Field>
        </FormSection>

        {/* ── Section 3: Teaching Options ── */}
        <FormSection title="Teaching Options">
          <Field label="Equipment available" hint="Add what you have on hand — the generator will note alternatives if something's missing.">
            <div className="space-y-2">
              {equipment.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input-field"
                    placeholder="e.g. Kickballs (8)"
                    value={item}
                    onChange={(e) => updateEquipment(i, e.target.value)}
                  />
                  {equipment.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEquipmentField(i)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-700 text-ink-400 hover:text-ink-100 hover:bg-ink-600"
                      aria-label="Remove equipment field"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEquipmentField}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-400 hover:text-accent-300"
              >
                <Plus size={14} />
                Add equipment
              </button>
            </div>
          </Field>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={useStations}
                onChange={(e) => setUseStations(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-ink-200">Use rotating skill stations</span>
                <p className="mt-0.5 text-xs text-ink-400">
                  Structure this lesson around multiple stations students rotate through.
                </p>
              </div>
            </label>

            {useStations && (
              <div className="ml-7">
                <Field label="Number of stations">
                  <input
                    type="number"
                    min={2}
                    max={6}
                    className="input-field w-28"
                    value={numStations}
                    onChange={(e) => setNumStations(Math.min(6, Math.max(2, Number(e.target.value))))}
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={includeELL}
                onChange={(e) => setIncludeELL(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-ink-200">Include ELL accommodations</span>
                <p className="mt-0.5 text-xs text-ink-400">
                  Adds language objectives, tiered vocabulary, sentence frames, and visual supports for English Language Learners.
                </p>
              </div>
            </label>
          </div>
        </FormSection>

        {/* Submit */}
        <div className="border-t border-ink-900 pt-8 space-y-4">
          {errorMsg && (
            <div className="card border-red-500/30 p-4 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {mode === 'unit' ? 'Generating unit…' : mode === 'fitness_test' ? 'Generating prep lessons…' : 'Generating lesson…'}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {mode === 'unit' ? 'Generate unit' : mode === 'fitness_test' ? 'Generate fitness test prep' : 'Generate lesson'}
              </>
            )}
          </button>

          {isGenerating && (
            <p className="text-sm text-ink-400">
              {mode === 'unit'
                ? 'Hang tight — your unit is being crafted. Generating 3 progressive lessons usually takes 2–3 minutes.'
                : mode === 'fitness_test'
                ? 'Generating fitness test prep lessons — one per selected component. This usually takes 1–2 minutes per lesson.'
                : 'Hang tight — your lesson is being crafted. This usually takes 1–2 minutes.'}
            </p>
          )}
        </div>

      </form>
    </div>
  )
}

function FormSection({ title, first = false, children }) {
  return (
    <div className={first ? 'pb-8' : 'border-t border-ink-900 pt-8 pb-8'}>
      <p className="label-eyebrow mb-5">{title}</p>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}
