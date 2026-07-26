import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Target, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert, Info } from 'lucide-react'
import { generateTestPrep } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import TestPrepRenderer from '../components/renderers/TestPrepRenderer'
import { useTrial } from '../context/TrialContext'

const PATHS = [
  { value: 'sat_act', label: 'SAT / ACT' },
  { value: 'state', label: 'State Assessment' },
]

const TESTS = [
  { value: 'sat', label: 'Digital SAT' },
  { value: 'act', label: 'Enhanced ACT' },
]

const SECTIONS = {
  sat: ['Reading & Writing', 'Math'],
  act: ['English', 'Math', 'Reading', 'Science (optional)'],
}

const EMPHASES = [
  { value: 'practice_set', label: 'Original practice set' },
  { value: 'strategies', label: 'Strategies & pacing' },
  { value: 'content_review', label: 'Content review mini-lesson' },
  { value: 'logistics', label: 'Test-day logistics & anxiety' },
]

const SESSION_FORMATS = [
  { value: 'one_on_one', label: 'One-on-one' },
  { value: 'small_group', label: 'Small group (3–5)' },
]

export default function TestPrepGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [path, setPath] = useState('sat_act')
  // SAT/ACT path
  const [test, setTest] = useState('sat')
  const [section, setSection] = useState('Reading & Writing')
  // State path
  const [stateTest, setStateTest] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [subjectArea, setSubjectArea] = useState('')
  // Shared
  const [emphasis, setEmphasis] = useState('practice_set')
  const [focus, setFocus] = useState('')
  const [sessionFormat, setSessionFormat] = useState('one_on_one')
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(45)
  const [teacherNotes, setTeacherNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isState = path === 'state'

  function chooseTest(t) {
    setTest(t)
    setSection(SECTIONS[t][0])
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input = isState
        ? { path, stateTest, gradeLevel, subjectArea, emphasis, focus, sessionFormat, sessionLengthMinutes, teacherNotes }
        : { path, test, section, emphasis, focus, sessionFormat, sessionLengthMinutes, teacherNotes }
      const generated = await generateTestPrep(input)
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
          <Link to="/test-prep" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Test Prep
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

        <TestPrepRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/test-prep" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Test Prep
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel-500/15">
            <Target size={18} className="text-steel-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Test Prep</h1>
            <p className="text-xs text-ink-500">
              Original SAT/ACT &amp; state-assessment practice · tutoring-style sessions (1:1 or small group)
            </p>
          </div>
        </div>
      </div>

      {/* Path toggle */}
      <div className="flex rounded-lg bg-ink-900 p-1 w-fit">
        {PATHS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPath(p.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              path === p.value ? 'bg-ink-700 text-ink-50 shadow-sm' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Copyright notice (SAT/ACT) */}
      {!isState && (
        <div className="flex items-start gap-3 rounded-lg border border-steel-500/30 bg-steel-500/10 px-4 py-3">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-steel-400" />
          <div className="text-sm">
            <p className="font-medium text-ink-100">Original practice only</p>
            <p className="mt-0.5 text-ink-300">
              Real SAT and ACT questions are copyrighted (College Board and ACT Inc.). This tool generates <span className="font-medium">100% original</span> practice modeled on the same skills, format, and difficulty — never reproduced official items. Test formats change; re-verify against College Board / ACT.org.
            </p>
          </div>
        </div>
      )}

      {/* Mandatory disclaimer (State) */}
      {isState && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="text-sm">
            <p className="font-medium text-ink-100">Verify against your state's official blueprint</p>
            <p className="mt-0.5 text-ink-300">
              This tool does <span className="font-medium">not</span> have official state test blueprints memorized. It generates original practice using general test-prep pedagogy and item-format familiarity. Always verify content against your state's official released blueprint / sample items — state tests have specific requirements that change year to year.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          {!isState ? (
            <>
              <h2 className="text-sm font-semibold text-ink-200">Test &amp; section</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-test">Test</label>
                  <select id="tp-test" value={test} onChange={(e) => chooseTest(e.target.value)} className="input-field">
                    {TESTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-section">Section</label>
                  <select id="tp-section" value={section} onChange={(e) => setSection(e.target.value)} className="input-field">
                    {SECTIONS[test].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-ink-200">State test details</h2>
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-statetest">State test name</label>
                <input
                  id="tp-statetest"
                  type="text"
                  placeholder="e.g. Virginia SOL, Texas STAAR, California CAASPP, Florida FAST"
                  value={stateTest}
                  onChange={(e) => setStateTest(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-grade">Grade level</label>
                  <input
                    id="tp-grade"
                    type="text"
                    placeholder="e.g. Grade 5"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-subject">Subject</label>
                  <input
                    id="tp-subject"
                    type="text"
                    placeholder="e.g. Reading, Math, Science"
                    value={subjectArea}
                    onChange={(e) => setSubjectArea(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-focus">
              Focus skill / topic <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="tp-focus"
              type="text"
              placeholder={isState
                ? 'e.g. Main idea & supporting details, Multi-step word problems, Text evidence'
                : (test === 'sat'
                  ? 'e.g. Linear equations, Command of Evidence, Words in context'
                  : 'e.g. Punctuation & usage, Rates & proportions, Data interpretation')}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-emphasis">Session emphasis</label>
              <select id="tp-emphasis" value={emphasis} onChange={(e) => setEmphasis(e.target.value)} className="input-field">
                {EMPHASES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-format">Format</label>
              <select id="tp-format" value={sessionFormat} onChange={(e) => setSessionFormat(e.target.value)} className="input-field">
                {SESSION_FORMATS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="tp-length">Length (min)</label>
              <input
                id="tp-length"
                type="number"
                min={20}
                max={120}
                step={5}
                value={sessionLengthMinutes}
                onChange={(e) => setSessionLengthMinutes(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="tp-notes"
            placeholder="Anything to tailor the session — the student's current level, target score, specific weaknesses, time until the test, item types the test uses, etc."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">
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
              Generate prep session
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
