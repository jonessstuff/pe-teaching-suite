import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Languages, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateEslSpecialist } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import LessonPrintFix from '../components/LessonPrintFix'
import EslSpecialistRenderer from '../components/renderers/EslSpecialistRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const PROFICIENCY_LEVELS = [
  { value: 'entering', label: 'Level 1 · Entering' },
  { value: 'emerging', label: 'Level 2 · Emerging' },
  { value: 'developing', label: 'Level 3 · Developing' },
  { value: 'expanding', label: 'Level 4 · Expanding' },
  { value: 'bridging', label: 'Level 5 · Bridging' },
  { value: 'reaching', label: 'Level 6 · Reaching' },
]

const CONTENT_AREAS = [
  { value: '', label: 'Auto-detect from topic' },
  { value: 'English Language Arts', label: 'English Language Arts' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Social & Instructional Language', label: 'Social & Instructional Language' },
]

export default function EslSpecialistGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [topic, setTopic] = useState('')
  const [gradeBand, setGradeBand] = useState('3-5')
  const [proficiencyLevel, setProficiencyLevel] = useState('developing')
  const [contentArea, setContentArea] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [homeLanguages, setHomeLanguages] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [handsOn, setHandsOn] = useState(false)
  // Hands-on/kinesthetic toggle surfaces only for elementary (K–2 / 3–5) bands.
  const showHandsOn = gradeBand === 'k-2' || gradeBand === '3-5'

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input = { topic, gradeBand, proficiencyLevel, contentArea, durationMinutes, homeLanguages, teacherNotes, handsOn: showHandsOn && handsOn }
      const generated = await generateEslSpecialist(input)
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
          <Link to="/esl-specialist" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            ESL/ELL Specialist
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

        <LessonPrintFix lesson={result} />
        <EslSpecialistRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/esl-specialist" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          ESL/ELL Specialist
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/15">
            <Languages size={18} className="text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">ESL/ELL Specialist</h1>
            <p className="text-xs text-ink-500">
              Language development · WIDA proficiency levels · SIOP content + language objectives
            </p>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-fuchsia-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Language development is the curriculum</p>
          <p className="mt-0.5 text-ink-300">
            For dedicated ESL/ELL teachers. Lessons pair a content objective with a separate language objective (SIOP), scaffolded to a specific WIDA proficiency level and covering all four language domains. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Topic, grade &amp; proficiency</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="esl-topic">Content topic</label>
            <input
              id="esl-topic"
              type="text"
              placeholder="e.g. Life cycle of a butterfly, Comparing two characters, Push and pull forces, Branches of government"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="esl-band">Grade band</label>
              <select id="esl-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-300" htmlFor="esl-level">WIDA proficiency level</label>
              <select id="esl-level" value={proficiencyLevel} onChange={(e) => setProficiencyLevel(e.target.value)} className="input-field">
                {PROFICIENCY_LEVELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <p className="-mt-2 text-xs text-ink-500">
            Proficiency level is the primary axis — a 6th grader at Entering needs very different scaffolding than one at Bridging on the same topic.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="esl-content">Content area</label>
              <select id="esl-content" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
                {CONTENT_AREAS.map(({ value, label }) => <option key={value || 'auto'} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="esl-duration">Session duration (minutes)</label>
              <input
                id="esl-duration"
                type="number"
                min={20}
                max={90}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Student home language(s) <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-1">Enables targeted native-language cognate connections in the vocabulary.</p>
          <input
            id="esl-home-lang"
            type="text"
            placeholder="e.g. Spanish; or Spanish and Vietnamese"
            value={homeLanguages}
            onChange={(e) => setHomeLanguages(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Teacher notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="esl-notes"
            placeholder="Any context to tailor the lesson — newcomer group, co-teaching with a content teacher, available materials, etc."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        {showHandsOn && (
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink-200">Hands-on / kinesthetic</h2>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={handsOn}
                onChange={(e) => setHandsOn(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-fuchsia-500"
              />
              <div>
                <span className="text-sm text-ink-300">Hands-on / kinesthetic emphasis</span>
                <p className="mt-0.5 text-xs text-ink-500">
                  Favors TPR, movement, realia &amp; manipulatives over worksheet/seatwork. Elementary (K–2 / 3–5) only.
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
              Generate ELD lesson
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
