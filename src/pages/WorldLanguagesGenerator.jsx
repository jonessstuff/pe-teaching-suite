import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateWorldLanguages } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import LessonPrintFix from '../components/LessonPrintFix'
import WorldLanguagesRenderer from '../components/renderers/WorldLanguagesRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const LEVELS = [
  { value: 'novice', label: 'Novice' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export default function WorldLanguagesGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [targetLanguage, setTargetLanguage] = useState('')
  const [gradeBand, setGradeBand] = useState('9-12')
  const [proficiencyLevel, setProficiencyLevel] = useState('novice')
  const [theme, setTheme] = useState('')
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(50)
  const [teacherNotes, setTeacherNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!targetLanguage.trim()) {
      setError('Please enter a target language.')
      return
    }
    setLoading(true)
    setError(null)
    setSavedId(null)

    try {
      const input = { targetLanguage: targetLanguage.trim(), gradeBand, proficiencyLevel, theme, sessionLengthMinutes, teacherNotes }
      const generated = await generateWorldLanguages(input)
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
          <Link to="/world-languages" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            World Languages
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
        <WorldLanguagesRenderer lesson={result} />

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
        <Link to="/world-languages" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          World Languages
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-jade-500/15">
            <Globe size={18} className="text-jade-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">World Languages</h1>
            <p className="text-xs text-ink-500">
              ACTFL 5 Cs lessons for any language · Novice–Advanced · Interpersonal, Interpretive &amp; Presentational modes
            </p>
          </div>
        </div>
      </div>

      {/* Accuracy notice (always) */}
      <div className="flex items-start gap-3 rounded-lg border border-jade-500/30 bg-jade-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-jade-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Verify target-language content</p>
          <p className="mt-0.5 text-ink-300">
            Lessons are framed in English with short example vocabulary/phrases. Always have the teacher or a native-speaker resource <span className="font-medium">verify any target-language content</span> for spelling, grammar, register &amp; cultural fit before use — especially for less commonly taught languages.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Language &amp; level</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-language">Target language</label>
            <input
              id="wl-language"
              type="text"
              placeholder="e.g. Spanish, French, Mandarin Chinese, Latin, American Sign Language"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="input-field"
            />
            <p className="mt-1 text-xs text-ink-500">Any language — modern, classical, heritage, or ASL.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-band">Grade band</label>
              <select id="wl-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-level">Proficiency</label>
              <select id="wl-level" value={proficiencyLevel} onChange={(e) => setProficiencyLevel(e.target.value)} className="input-field">
                {LEVELS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-length">Length (min)</label>
              <input
                id="wl-length"
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

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="wl-theme">
              Theme / topic <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="wl-theme"
              type="text"
              placeholder="e.g. Greetings & introductions, Food & ordering, Daily routine, Travel, Family"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Teacher notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="wl-notes"
            placeholder="Anything to tailor the lesson — heritage speakers in the class, available authentic resources, a unit it fits into, prior vocabulary, etc."
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
