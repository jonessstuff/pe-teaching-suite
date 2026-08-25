import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateSchoolCounselor } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import LessonPrintFix from '../components/LessonPrintFix'
import SchoolCounselorRenderer from '../components/renderers/SchoolCounselorRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const DOMAINS = [
  { value: '', label: 'Auto-detect from topic' },
  { value: 'academic', label: 'Academic Development' },
  { value: 'career', label: 'Career Development' },
  { value: 'social-emotional', label: 'Social/Emotional Development' },
]

export default function SchoolCounselorGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [topic, setTopic] = useState('')
  const [gradeBand, setGradeBand] = useState('3-5')
  const [domain, setDomain] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [teacherNotes, setTeacherNotes] = useState('')

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
      const input = { topic, gradeBand, domain, durationMinutes, teacherNotes }
      const generated = await generateSchoolCounselor(input)
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
          <Link to="/school-counselors" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            School Counselors
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
        <SchoolCounselorRenderer lesson={result} />

        {savedId && (
          <SecondaryToolsPanel savedId={savedId} lessonObject={result} subject={result?.subject} />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/school-counselors" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          School Counselors
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crimson-500/15">
            <Compass size={18} className="text-crimson-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">School Counselors</h1>
            <p className="text-xs text-ink-500">
              Classroom guidance curriculum · ASCA National Model &amp; Mindsets &amp; Behaviors
            </p>
          </div>
        </div>
      </div>

      {/* Scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-crimson-500/30 bg-crimson-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-crimson-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Classroom guidance lessons only</p>
          <p className="mt-0.5 text-ink-300">
            Generates Tier 1, whole-class School Counseling Core Curriculum lessons across the three ASCA domains. It does <span className="font-medium">not</span> generate individual/small-group counseling session plans or crisis-response protocols — those need clinical judgment and are outside this tool. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Topic, domain &amp; grade band</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="sc-topic">Lesson topic</label>
            <input
              id="sc-topic"
              type="text"
              placeholder="e.g. Growth mindset, Conflict resolution, Setting SMART goals, Exploring interests & strengths, Elementary-to-middle transition"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="sc-domain">ASCA domain</label>
            <select id="sc-domain" value={domain} onChange={(e) => setDomain(e.target.value)} className="input-field">
              {DOMAINS.map(({ value, label }) => <option key={value || 'auto'} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="sc-band">Grade band</label>
              <select id="sc-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="sc-duration">Lesson duration (minutes)</label>
              <input
                id="sc-duration"
                type="number"
                min={15}
                max={60}
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
            Counselor notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="sc-notes"
            placeholder="Any context to tailor the lesson — curriculum you use, time of year, a schoolwide theme, prior lessons in the sequence, etc."
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
              Generate guidance lesson
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
