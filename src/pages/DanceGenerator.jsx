import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wind, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateDance } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import DanceRenderer from '../components/renderers/DanceRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const PROCESSES = [
  { value: 'creating', label: 'Creating' },
  { value: 'performing', label: 'Performing, Presenting & Producing' },
  { value: 'responding', label: 'Responding' },
  { value: 'connecting', label: 'Connecting' },
]

const HS_TIERS = [
  { value: 'proficient', label: 'Proficient' },
  { value: 'accomplished', label: 'Accomplished' },
  { value: 'advanced', label: 'Advanced' },
]

const FOCUS_PLACEHOLDERS = {
  creating: 'e.g. Exploring levels & pathways, Making a movement phrase, Improvising with the element of energy',
  performing: 'e.g. Locomotor combination, Rehearsing a short phrase, Musicality & timing, Performing for peers',
  responding: 'e.g. Describing a dance with dance vocabulary, Two-stars-and-a-wish feedback, Interpreting mood in movement',
  connecting: 'e.g. A dance from my own culture, How folk dances tell a community’s story, Movement inspired by a feeling',
}

export default function DanceGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [gradeBand, setGradeBand] = useState('3-5')
  const [artisticProcess, setArtisticProcess] = useState('creating')
  const [hsTier, setHsTier] = useState('proficient')
  const [focus, setFocus] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [teacherNotes, setTeacherNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isHs = gradeBand === '9-12'

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input = { gradeBand, artisticProcess, hsTier, focus, durationMinutes, teacherNotes }
      const generated = await generateDance(input)
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

        <DanceRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          All modules
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-500/15">
            <Wind size={18} className="text-olive-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Dance</h1>
            <p className="text-xs text-ink-500">
              NCCAS Dance lessons · the four Artistic Processes · Creating, Performing, Responding &amp; Connecting (K–12)
            </p>
          </div>
        </div>
      </div>

      {/* Body-safety notice */}
      <div className="flex items-start gap-3 rounded-lg border border-olive-500/30 bg-olive-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-olive-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Dance safely</p>
          <p className="mt-0.5 text-ink-300">
            Every lesson includes an age-appropriate body-safety note — always warm up, use safe alignment and technique, keep clear spacing, hydrate, and never dance through sharp pain.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Process, grade band &amp; focus</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="da-process">Artistic Process</label>
            <select id="da-process" value={artisticProcess} onChange={(e) => setArtisticProcess(e.target.value)} className="input-field">
              {PROCESSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="da-band">Grade band</label>
              <select id="da-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {isHs ? (
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="da-tier">HS tier</label>
                <select id="da-tier" value={hsTier} onChange={(e) => setHsTier(e.target.value)} className="input-field">
                  {HS_TIERS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm text-ink-300" htmlFor="da-duration">Length (min)</label>
                <input
                  id="da-duration"
                  type="number"
                  min={20}
                  max={90}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {isHs && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="da-duration-hs">Length (minutes)</label>
              <input
                id="da-duration-hs"
                type="number"
                min={20}
                max={90}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="da-focus">
              Focus / topic <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="da-focus"
              type="text"
              placeholder={FOCUS_PLACEHOLDERS[artisticProcess] ?? FOCUS_PLACEHOLDERS.creating}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Teacher notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="da-notes"
            placeholder="Any context to tailor the lesson — space (classroom vs. gym vs. studio), music available, a dance style or genre focus, students with mobility needs, a performance you're building toward, etc."
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
              Generate lesson
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
