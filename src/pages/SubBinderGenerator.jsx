import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { BookMarked, Sparkles, Loader2, Printer, ArrowLeft, Save, FolderOpen } from 'lucide-react'
import {
  generateLesson,
  generateLibraryLesson,
  generateArtLesson,
  generateMusicLesson,
  generateStemLesson,
} from '../services/generationService'
import { createBinder } from '../services/subBinderService'
import { US_STATES } from '../constants/usStates'
import SubBinderRenderer from '../components/renderers/SubBinderRenderer'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'

// ── Constants ──────────────────────────────────────────────────────────────

const SUBJECTS = ['PE & Health', 'Library & Media', 'Art', 'Music', 'STEM', 'Adaptive PE']

const WEEK_OPTIONS = [1, 2, 3, 4, 6, 8]

const STEM_FOCUS_AREAS = [
  { value: 'engineering', label: 'Engineering Design' },
  { value: 'coding', label: 'Coding & CS' },
  { value: 'science', label: 'Science Investigation' },
  { value: 'maker', label: 'Maker / Tinkering' },
]

const K5_GRADES = [
  { value: 0, label: 'K' }, { value: 1, label: '1' }, { value: 2, label: '2' },
  { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' },
]

const K12_GRADES = [
  { value: 0, label: 'K' }, { value: 1, label: '1' }, { value: 2, label: '2' },
  { value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' },
  { value: 6, label: '6' }, { value: 7, label: '7' }, { value: 8, label: '8' },
  { value: 9, label: '9' }, { value: 10, label: '10' }, { value: 11, label: '11' },
  { value: 12, label: '12' },
]

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// URL slug → subject name (used when home page cards link with ?subject=)
const SUBJECT_FROM_SLUG = {
  'pe-health': 'PE & Health',
  'library': 'Library & Media',
  'art': 'Art',
  'music': 'Music',
  'stem': 'STEM',
  'adaptive-pe': 'Adaptive PE',
}

// Subject → back-home path for the result toolbar
const SUBJECT_HOME_PATH = {
  'PE & Health': '/pe-health',
  'Library & Media': '/library',
  'Art': '/art',
  'Music': '/music',
  'STEM': '/stem',
  'Adaptive PE': '/pe-health',
}

function isK12Subject(subj) {
  return subj === 'PE & Health' || subj === 'Adaptive PE'
}

// ── Grade toggle ───────────────────────────────────────────────────────────

function GradeToggle({ options, selected, onChange, accent }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
            selected === value
              ? `${accent} text-white`
              : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Prior-context builder ──────────────────────────────────────────────────

function buildPriorContext(allDays) {
  // Limit to last 10 days to avoid bloating the prompt for long absences
  const recent = allDays.slice(-10)
  const offset = allDays.length - recent.length
  return recent.map((lesson, i) => {
    const absIdx = offset + i
    const dayName = DAY_NAMES[absIdx % 5]
    const weekNum = Math.floor(absIdx / 5) + 1
    const snippet = (
      (lesson.warm_up ?? '') + ' ' + (lesson.fitness_activities ?? '')
    ).trim().slice(0, 120)
    return `Wk${weekNum} ${dayName}: "${lesson.title || `Lesson ${absIdx + 1}`}" — ${snippet}`
  }).join('\n')
}

// ── Generator dispatch ─────────────────────────────────────────────────────

async function callDayGenerator(subject, stemFocusArea, payload) {
  switch (subject) {
    case 'Library & Media':
      return generateLibraryLesson(payload)
    case 'Art':
      return generateArtLesson(payload)
    case 'Music':
      return generateMusicLesson(payload)
    case 'STEM':
      return generateStemLesson({ focusArea: stemFocusArea, ...payload })
    default:
      // PE & Health and Adaptive PE both use the general lesson generator
      return generateLesson({ subject, ...payload })
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SubBinderGenerator() {
  const { isTrial, isExpired, openPaywall } = useTrial()
  // Trial/expired users: generate only the first day as a preview, then paywall.
  // (Independent of the 5-export cap; replaces the old 4-week generation window.)
  const gated = isTrial || isExpired
  const weekOptions = WEEK_OPTIONS

  const [searchParams] = useSearchParams()
  const urlSlug = searchParams.get('subject')
  const preselected = SUBJECT_FROM_SLUG[urlSlug] ?? 'PE & Health'

  // Form state
  const [subject, setSubject] = useState(preselected)
  const [stemFocusArea, setStemFocusArea] = useState('engineering')
  const [gradeBands, setGradeBands] = useState(null)
  const [weekCount, setWeekCount] = useState(2)
  const [topics, setTopics] = useState('')
  const [classSize, setClassSize] = useState(25)
  const [duration, setDuration] = useState(45)
  const [state, setState] = useState('VA')
  const [routines, setRoutines] = useState('')
  const [emergencyNotes, setEmergencyNotes] = useState('')

  // Generation state
  const [view, setView] = useState('form') // 'form' | 'result'
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ week: 0, day: 0, totalWeeks: 0 })
  const [error, setError] = useState(null)
  const [binder, setBinder] = useState([])

  // Snapshot of form values captured at generation time (for renderer header)
  const [binderMeta, setBinderMeta] = useState(null)
  const [binderName, setBinderName] = useState('')
  const [savedBinderId, setSavedBinderId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved | error

  function handleSubjectChange(newSubject) {
    const wasK12 = isK12Subject(subject)
    const nowK12 = isK12Subject(newSubject)
    setSubject(newSubject)
    if (wasK12 !== nowK12) setGradeBands(null)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (gradeBands === null) {
      setError('Select a grade.')
      return
    }

    setLoading(true)
    setError(null)

    const allDays = []
    const weeks = []
    // Free trial / expired: cap generation to a single day (Week 1, Monday),
    // then the upgrade paywall covers the rest.
    const dayCap = gated ? 1 : weekCount * 5

    try {
      for (let week = 0; week < weekCount; week++) {
        const weekDays = []
        for (let day = 0; day < 5; day++) {
          if (allDays.length >= dayCap) break
          const weekNum = week + 1
          const dayName = DAY_NAMES[day]
          setProgress({ week: weekNum, day: day + 1, totalWeeks: weekCount })

          const priorContext = buildPriorContext(allDays)

          // Build topic text: inject the teacher's content plan + positional context +
          // prior lessons so the AI understands where in the sequence this day falls.
          const topicLines = [
            `Long-term substitute coverage — ${weekCount} week${weekCount !== 1 ? 's' : ''} total.`,
            '',
            'Topics and sequence for this absence:',
            topics.trim() || '(Teacher will provide topics — generate age-appropriate content for this subject.)',
            '',
            `Current position: Week ${weekNum} of ${weekCount}, ${dayName} (day ${week * 5 + day + 1} of ${weekCount * 5} total).`,
          ]

          if (priorContext) {
            topicLines.push('', 'Lessons already taught — do not repeat content already covered; build on it instead:', priorContext)
          }
          if (routines.trim()) {
            topicLines.push('', 'Key class routines and expectations for the substitute:', routines.trim())
          }
          if (emergencyNotes.trim()) {
            topicLines.push('', 'Important notes:', emergencyNotes.trim())
          }

          const lesson = await callDayGenerator(subject, stemFocusArea, {
            gradeBands: [gradeBands],
            topic: topicLines.join('\n'),
            classSize,
            durationMinutes: duration,
            state,
          })

          allDays.push(lesson)
          weekDays.push(lesson)
        }
        if (weekDays.length > 0) weeks.push(weekDays)
        if (allDays.length >= dayCap) break
      }

      // weekCount reflects what was actually generated (1 for the gated 1-day preview).
      setBinderMeta({ subject, weekCount: weeks.length, classSize, duration, state, routines, emergencyNotes })
      setBinder(weeks)
      setView('result')
    } catch (err) {
      setError(err?.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
      setProgress({ week: 0, day: 0, totalWeeks: 0 })
    }
  }

  function resetForm() {
    setView('form')
    setBinder([])
    setBinderMeta(null)
    setError(null)
    setSavedBinderId(null)
    setSaveStatus('idle')
    setBinderName('')
  }

  async function handleSaveBinder() {
    setSaveStatus('saving')
    try {
      const saved = await createBinder({
        name: binderName || `${binderMeta.subject} Sub Binder — ${binderMeta.weekCount} week${binderMeta.weekCount !== 1 ? 's' : ''}`,
        subject: binderMeta.subject,
        binderData: { weeks: binder, meta: binderMeta },
      })
      setSavedBinderId(saved.id)
      setSaveStatus('saved')
    } catch (err) {
      setError(err.message)
      setSaveStatus('idle')
    }
  }

  // ── Result view ──────────────────────────────────────────────────────────

  if (view === 'result' && binder.length > 0 && binderMeta) {
    return (
      <div>
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-4">
            <Link
              to={SUBJECT_HOME_PATH[subject] ?? '/'}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <ArrowLeft size={16} />
              {binderMeta.subject}
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              ← Start over
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!savedBinderId ? (
              <>
                <input value={binderName} onChange={e => setBinderName(e.target.value)}
                  placeholder="Binder name (optional)"
                  className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-amber-500 w-48" />
                <button type="button" onClick={handleSaveBinder} disabled={saveStatus === 'saving'} className="btn-secondary gap-1.5">
                  {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saveStatus === 'saving' ? 'Saving…' : 'Save binder'}
                </button>
              </>
            ) : (
              <Link to="/my-binders" className="btn-secondary gap-1.5">
                <FolderOpen size={16} /> View in My Binders
              </Link>
            )}
            <button
              type="button"
              onClick={() => (gated ? openPaywall('gated-feature') : window.print())}
              className="btn-secondary gap-1.5"
            >
              <Printer size={16} />
              Print binder
            </button>
          </div>
        </div>

        <SubBinderRenderer
          binder={binder}
          {...binderMeta}
          onUpdateDay={gated ? undefined : (wi, di, updated) =>
            setBinder((prev) =>
              prev.map((wk, w) => w !== wi ? wk : wk.map((d, dd) => dd !== di ? d : updated))
            )
          }
        />

        {gated && (
          <div className="print:hidden mt-8">
            <UpgradeBanner label="the full substitute binder" />
          </div>
        )}
      </div>
    )
  }

  // ── Form view ────────────────────────────────────────────────────────────

  const gradeOptions = isK12Subject(subject) ? K12_GRADES : K5_GRADES
  const totalDays = weekCount * 5

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/"
          className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
        >
          <ArrowLeft size={14} />
          All modules
        </Link>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
              <BookMarked size={18} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink-50">Long-Term Sub Binder</h1>
              <p className="text-xs text-ink-500">
                Week-by-week lesson plans for extended absences · All subjects
              </p>
            </div>
          </div>
          <Link to="/my-binders" className="btn-secondary gap-1.5 text-sm">
            <FolderOpen size={14} /> My Binders
          </Link>
        </div>
        <p className="mt-3 text-sm text-ink-400">
          Fill in your class details and topics to cover. PlansK12 generates a complete daily
          plan for every week, ready to hand to your substitute.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">

        {/* ── Subject & focus area ─────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Subject</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="subject">
              Your subject
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="input-field"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {subject === 'STEM' && (
            <div>
              <label className="mb-2 block text-sm text-ink-300">STEM focus area</label>
              <div className="flex flex-wrap gap-2">
                {STEM_FOCUS_AREAS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStemFocusArea(value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      stemFocusArea === value
                        ? 'bg-cyan-500 text-white'
                        : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Absence duration ─────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Absence duration</h2>

          <div>
            <label className="mb-2 block text-sm text-ink-300">How many weeks will you be out?</label>
            <div className="flex flex-wrap gap-2">
              {weekOptions.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeekCount(w)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    weekCount === w
                      ? 'bg-amber-500 text-white'
                      : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {w} {w === 1 ? 'week' : 'weeks'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              Generates {totalDays} daily lesson plans ({weekCount} weeks × 5 days).
            </p>
            {gated && (
              <p className="mt-1.5 text-xs text-amber-500">
                Free trial generates the first day only. Upgrade to generate all {totalDays} lessons for your absence.
              </p>
            )}
          </div>
        </div>

        {/* ── What to teach ────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">What to teach</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="topics">
              Topics and sequence
            </label>
            <textarea
              id="topics"
              rows={5}
              className="input-field resize-y"
              placeholder={
                'List what the sub should cover, in order. Be as specific or general as you like.\n\n' +
                'Example:\nWeek 1–2: Soccer — passing, trapping, dribbling\nWeek 3–4: Flag football — flag pulls, routes\nWeek 5: Review and fun stations'
              }
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-500">
              The AI will sequence lessons progressively across your absence.
            </p>
          </div>
        </div>

        {/* ── Class setup ──────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Class setup</h2>

          <div>
            <label className="mb-2 block text-sm text-ink-300">Grade</label>
            <GradeToggle
              options={gradeOptions}
              selected={gradeBands}
              onChange={setGradeBands}
              accent="bg-amber-500"
            />
            {gradeBands === null && (
              <p className="mt-1 text-xs text-red-400">Select a grade.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="classsize">
                Class size
              </label>
              <input
                id="classsize"
                type="number"
                min={1}
                max={60}
                value={classSize}
                onChange={(e) => setClassSize(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="duration">
                Class length (min)
              </label>
              <input
                id="duration"
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

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="state">
              State <span className="text-ink-500">(for standards alignment)</span>
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="input-field"
            >
              {US_STATES.map(({ abbr, name }) => (
                <option key={abbr} value={abbr}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Sub instructions ─────────────────────────────────────────────── */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Sub instructions</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="routines">
              Key routines &amp; expectations
            </label>
            <textarea
              id="routines"
              rows={4}
              className="input-field resize-y"
              placeholder={
                'What does the sub need to know about how your class runs?\n\n' +
                'Example: Students line up by class list order. Bathroom breaks are taken as a class at the 20-min mark. Noise level is always indoor voice. No running until we reach the gym.'
              }
              value={routines}
              onChange={(e) => setRoutines(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="emergency">
              Emergency / important notes{' '}
              <span className="text-ink-500">(optional)</span>
            </label>
            <textarea
              id="emergency"
              rows={3}
              className="input-field resize-y"
              placeholder="Allergies, IEP accommodations, behavior plans, attendance quirks, or anything urgent."
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || gradeBands === null}
          className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {progress.week > 0
                ? `Generating Week ${progress.week} of ${progress.totalWeeks} — ${DAY_NAMES[progress.day - 1]}…`
                : 'Preparing…'}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {gated
                ? 'Generate 1-day preview'
                : `Generate ${weekCount}-week sub binder (${totalDays} lessons)`}
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">
            Each week takes 1–3 minutes · Do not close this tab
          </p>
        )}
      </form>
    </div>
  )
}
