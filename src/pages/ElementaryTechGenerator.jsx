import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Monitor, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateElementaryTech } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import LessonPrintFix from '../components/LessonPrintFix'
import StationsToggle from '../components/StationsToggle'
import ElementaryTechRenderer from '../components/renderers/ElementaryTechRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
]

const CONTENT_AREAS = [
  { value: '', label: 'Auto-detect from topic' },
  { value: 'foundational_skills', label: 'Foundational Computer Skills' },
  { value: 'digital_citizenship', label: 'Digital Citizenship & Online Safety' },
  { value: 'productivity_creation', label: 'Productivity & Creation Tools' },
  { value: 'coding', label: 'Intro to Coding & Computational Thinking' },
]

export default function ElementaryTechGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [topic, setTopic] = useState('')
  const [gradeBand, setGradeBand] = useState('3-5')
  const [contentArea, setContentArea] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(40)
  const [teacherNotes, setTeacherNotes] = useState('')
  const [useStations, setUseStations] = useState(false)
  const [numStations, setNumStations] = useState(3)

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
      const input = { topic, gradeBand, contentArea, durationMinutes, teacherNotes, stationsMode: useStations, stationCount: useStations ? Number(numStations) : undefined }
      const generated = await generateElementaryTech(input)
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
          <Link to="/elementary-tech" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Elementary Technology
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
        <ElementaryTechRenderer lesson={result} />

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
        <Link to="/elementary-tech" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Elementary Technology
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-500/15">
            <Monitor size={18} className="text-saffron-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Elementary Technology / Computer Lab</h1>
            <p className="text-xs text-ink-500">
              Self-contained K–5 tech-class lessons · ISTE Standards for Students
            </p>
          </div>
        </div>
      </div>

      {/* Scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-saffron-500/30 bg-saffron-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-saffron-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Elementary weekly tech special</p>
          <p className="mt-0.5 text-ink-300">
            Foundational, playful, self-contained K–5 computer-lab lessons for a teacher who sees many classes on a rotating schedule. Digital citizenship is woven through every lesson. This is <span className="font-medium">not</span> CTE Information Technology — no career prep, certifications, or MS/HS coursework (those live in the CTE module). Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Topic, content area &amp; grade band</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="et-topic">Lesson topic</label>
            <input
              id="et-topic"
              type="text"
              placeholder="e.g. Mouse control practice, Being kind online, Making an All About Me slide, Sequencing with a screen-free robot, Loops & patterns in ScratchJr/Scratch, Find & fix the bug (debugging), Home-row typing warm-up"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="et-area">Content area</label>
            <select id="et-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
              {CONTENT_AREAS.map(({ value, label }) => <option key={value || 'auto'} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="et-band">Grade band</label>
              <select id="et-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="et-duration">Session length (minutes)</label>
              <input
                id="et-duration"
                type="number"
                min={20}
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
            Teacher notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="et-notes"
            placeholder="Any context to tailor the lesson — the devices/software your lab uses, a schoolwide theme, prior skills students have practiced, time of year, etc."
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

        <StationsToggle
          useStations={useStations}
          setUseStations={setUseStations}
          numStations={numStations}
          setNumStations={setNumStations}
          label="Use rotating stations"
          hint="Structure the core activity as rotating tech stations — e.g. keyboarding, unplugged coding, create-a-slide, digital-citizenship sort."
        />

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
              Generate tech lesson
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
