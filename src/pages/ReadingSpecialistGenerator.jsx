import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateReadingSpecialist, generateTutoringSession } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import ReadingSpecialistRenderer from '../components/renderers/ReadingSpecialistRenderer'
import TutoringSessionRenderer from '../components/renderers/TutoringSessionRenderer'
import { useTrial } from '../context/TrialContext'

const SKILL_AREAS = [
  'Phonological & Phonemic Awareness',
  'Phonics & Word Recognition (Decoding)',
  'Reading Fluency',
  'Vocabulary',
  'Reading Comprehension',
  'Written Expression',
]

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12 (older struggling readers)' },
]

const GROUP_SIZES = ['1:1', 'Small group (3–5)', 'Small group (6–8)', 'Whole class']

const SESSION_MODES = [
  { value: 'whole_class', label: 'Whole Class' },
  { value: 'tutoring', label: 'Tutoring / Small Group' },
]

const TUTORING_TYPES = [
  { value: 'private', label: 'Private / After-School', blurb: 'Paid 1:1 or small-group work outside school hours — includes a parent-facing summary.' },
  { value: 'in_class', label: 'In-Class Pull-Aside', blurb: 'Same-day pull-aside to reinforce what the class just covered — fast, grab-and-go, no prep.' },
]

export default function ReadingSpecialistGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [sessionMode, setSessionMode] = useState('whole_class') // 'whole_class' | 'tutoring'
  const [tutoringType, setTutoringType] = useState('private')    // 'private' | 'in_class'

  const [skillArea, setSkillArea] = useState(SKILL_AREAS[0])
  const [gradeBand, setGradeBand] = useState('k-2')
  const [focus, setFocus] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [groupSize, setGroupSize] = useState(GROUP_SIZES[1])
  const [studentPattern, setStudentPattern] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [sessionLabel, setSessionLabel] = useState('Session 1') // private tutoring continuity
  const [classContext, setClassContext] = useState('')          // in-class: what the class just covered

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function chooseSessionMode(m) {
    setSessionMode(m)
    if (m === 'tutoring') {
      setGroupSize('1:1')
      setDurationMinutes(tutoringType === 'in_class' ? 15 : 30)
    } else {
      setGroupSize(GROUP_SIZES[1])
      setDurationMinutes(30)
    }
  }

  function chooseTutoringType(t) {
    setTutoringType(t)
    setDurationMinutes(t === 'in_class' ? 15 : 30)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const generated =
        sessionMode === 'tutoring'
          ? await generateTutoringSession({
              subject: 'reading',
              tutoringType,
              gradeBand,
              focus,
              topicArea: skillArea,
              classContext,
              sessionLabel,
              groupSize,
              durationMinutes,
              notes: teacherNotes,
            })
          : await generateReadingSpecialist({ skillArea, gradeBand, focus, durationMinutes, groupSize, studentPattern, teacherNotes })

      setResult(generated)

      if (generated?.title) {
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
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            All modules
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            Start over
          </button>
          {savedId && (
            <Link to={`/lessons/${savedId}`} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
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
          <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your lesson archive.</p>
        )}

        {result.mode === 'tutoring'
          ? <TutoringSessionRenderer lesson={result} />
          : <ReadingSpecialistRenderer lesson={result} />}
      </div>
    )
  }

  const isTutoring = sessionMode === 'tutoring'

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          All modules
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
            <BookOpen size={18} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Reading Specialists</h1>
            <p className="text-xs text-ink-500">
              Structured Literacy · explicit, systematic interventions · IDA-aligned
            </p>
          </div>
        </div>
      </div>

      {/* Instructional-support (not diagnosis) disclaimer */}
      <div className="flex items-start gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-sky-400" />
        <div className="text-sm">
          <p className="font-medium text-sky-300">Instructional planning support</p>
          <p className="mt-0.5 text-sky-400/90">
            This tool supports instructional planning, not diagnosis. Reading difficulties consistent with dyslexia or other learning disabilities should be referred through your school&rsquo;s formal evaluation process. Do not enter student names or identifying information.
          </p>
        </div>
      </div>

      {/* Session-mode toggle */}
      <div className="space-y-3">
        <div className="flex rounded-lg bg-ink-900 p-1 w-fit">
          {SESSION_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => chooseSessionMode(m.value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                sessionMode === m.value ? 'bg-ink-700 text-ink-50 shadow-sm' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {isTutoring && (
          <div className="flex flex-wrap gap-2">
            {TUTORING_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => chooseTutoringType(t.value)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  tutoringType === t.value
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-200'
                    : 'border-ink-700 bg-ink-900 text-ink-300 hover:border-ink-600'
                }`}
              >
                <span className="block font-medium">{t.label}</span>
                <span className="block text-xs text-ink-500">{t.blurb}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Skill focus</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm text-ink-300" htmlFor="rs-skill">Skill area</label>
              <select id="rs-skill" value={skillArea} onChange={(e) => setSkillArea(e.target.value)} className="input-field">
                {SKILL_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="rs-band">Grade band</label>
              <select id="rs-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="rs-group">Group size</label>
              <select id="rs-group" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="input-field">
                {GROUP_SIZES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="rs-focus">
              Specific focus / target <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="rs-focus"
              type="text"
              placeholder="e.g. Blending CVC words, Closed vs. open syllables, R-controlled vowels, Prefixes un-/re-, Main idea in expository text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="rs-duration">Session duration (minutes)</label>
            <input
              id="rs-duration"
              type="number"
              min={10}
              max={90}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        {/* Tutoring-specific options */}
        {isTutoring && tutoringType === 'private' && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">Session continuity</h2>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="rs-session-label">Session label</label>
              <input
                id="rs-session-label"
                type="text"
                placeholder="Session 1"
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                className="input-field"
              />
              <p className="mt-1 text-xs text-ink-500">Light framing for a recurring weekly arrangement. The output includes a parent-facing summary.</p>
            </div>
          </div>
        )}

        {isTutoring && tutoringType === 'in_class' && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">What did the class just cover?</h2>
            <p className="text-xs text-ink-500 -mt-1">The pull-aside reinforces this exact content — not a separate skill path.</p>
            <textarea
              id="rs-class-context"
              placeholder="e.g. The class just did a whole-group lesson on blending short-a CVC words with letter tiles"
              value={classContext}
              onChange={(e) => setClassContext(e.target.value)}
              rows={2}
              className="input-field min-h-[64px]"
            />
          </div>
        )}

        {/* Student pattern — whole-class only */}
        {!isTutoring && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">
              Student reading pattern <span className="font-normal text-ink-500">(optional)</span>
            </h2>
            <p className="text-xs text-ink-500 -mt-1">
              Describe an observed reading pattern (no names) and the plan will note whether it&rsquo;s consistent with common dyslexia indicators — as a prompt to pursue formal evaluation, never a diagnosis.
            </p>
            <textarea
              id="rs-pattern"
              placeholder="e.g. Reads slowly and effortfully, guesses at unfamiliar words from the first letter, strong oral vocabulary but spelling doesn't match what's been taught, struggles with nonsense words"
              value={studentPattern}
              onChange={(e) => setStudentPattern(e.target.value)}
              rows={3}
              className="input-field min-h-[80px]"
            />
          </div>
        )}

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Specialist notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="rs-notes"
            placeholder="Any context to tailor the lesson — curriculum in use, prior skills mastered, available decodables or materials, etc."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
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
              {isTutoring
                ? (tutoringType === 'private' ? 'Generate tutoring session' : 'Generate pull-aside plan')
                : 'Generate Structured Literacy lesson'}
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
