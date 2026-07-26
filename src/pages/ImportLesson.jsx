import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileInput, Loader2 } from 'lucide-react'
import { generateImportedLesson } from '../services/generationService'
import { createLesson } from '../services/lessonsService'

// Core specials reformat into the PlanBook schema; the "More modules" group each
// reformat into their OWN module structure (server-side per-module dispatch).
const CORE_SUBJECTS = ['PE & Health', 'Adaptive PE', 'Art', 'Library & Media', 'Music', 'STEM']
const NEWER_SUBJECTS = [
  'Theater', 'Dance', 'World Languages', 'JROTC', 'Elementary Technology',
  'ESL/ELL Specialist', 'Gifted & Talented', 'Special Education',
]
const GRADES = [
  { label: 'K', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
  { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 },
  { label: '6', value: 6 }, { label: '7', value: 7 }, { label: '8', value: 8 },
  { label: '9', value: 9 }, { label: '10', value: 10 }, { label: '11', value: 11 },
  { label: '12', value: 12 },
]

// STEM lessons reformat differently per focus area (different standards frameworks),
// so we ask which one rather than guessing from the paste.
const STEM_FOCUS_AREAS = [
  { value: 'engineering', label: 'Engineering Design' },
  { value: 'coding', label: 'Coding & CS' },
  { value: 'science', label: 'Science Investigation' },
  { value: 'maker', label: 'Maker / Tinkering' },
]

export default function ImportLesson() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('PE & Health')
  const [gradeBand, setGradeBand] = useState(5)
  const [targetLanguage, setTargetLanguage] = useState('')
  const [stemFocusArea, setStemFocusArea] = useState('engineering')
  const [rawText, setRawText] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function handleImport(e) {
    e.preventDefault()
    if (!rawText.trim()) return
    if (subject === 'World Languages' && !targetLanguage.trim()) {
      setError('Enter the target language (e.g. Spanish) for this lesson.')
      return
    }
    setStatus('generating')
    setError(null)

    try {
      const lessonObject = await generateImportedLesson({ rawText, subject, gradeBand, targetLanguage: targetLanguage.trim(), stemFocusArea })
      const saved = await createLesson(lessonObject)
      navigate(`/lessons/${saved.id}`)
    } catch (err) {
      setError(err.message ?? 'Import failed — please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors mb-3">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
            <FileInput size={20} className="text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">Import &amp; Enhance a Lesson</h1>
            <p className="text-sm text-ink-500">
              Paste an existing lesson plan — AI will reformat and add missing elements.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleImport} className="space-y-6 max-w-2xl">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Subject</label>
          {[
            { heading: 'Core specials', items: CORE_SUBJECTS },
            { heading: 'More modules', items: NEWER_SUBJECTS },
          ].map(({ heading, items }) => (
            <div key={heading} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-xs uppercase tracking-wide text-ink-600">{heading}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      subject === s
                        ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                        : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* World Languages: target language (required — it can't be inferred before reformatting) */}
        {subject === 'World Languages' && (
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2" htmlFor="import-language">
              Target language
            </label>
            <input
              id="import-language"
              type="text"
              value={targetLanguage}
              onChange={e => setTargetLanguage(e.target.value)}
              placeholder="e.g. Spanish, French, Mandarin"
              className="w-full max-w-xs rounded-xl border border-ink-700 bg-white dark:bg-ink-800 px-4 py-2.5 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-rose-500"
            />
          </div>
        )}

        {/* STEM: focus area (different focus areas use different standards frameworks) */}
        {subject === 'STEM' && (
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">STEM focus area</label>
            <div className="flex flex-wrap gap-2">
              {STEM_FOCUS_AREAS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStemFocusArea(value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    stemFocusArea === value
                      ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                      : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grade */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">Grade</label>
          <div className="flex flex-wrap gap-2">
            {GRADES.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGradeBand(g.value)}
                className={`h-9 w-11 rounded-lg border text-sm font-semibold transition-colors ${
                  gradeBand === g.value
                    ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                    : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Raw text */}
        <div>
          <label className="block text-sm font-medium text-ink-300 mb-2">
            Paste your existing lesson plan
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={14}
            placeholder="Paste your lesson plan here — any format works. Notes, bullet points, Google Docs text, PDF paste, etc."
            className="w-full rounded-xl border border-ink-700 bg-white dark:bg-ink-800 px-4 py-3 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-rose-500 resize-y"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'generating' || !rawText.trim()}
          className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'generating' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Reformatting your lesson…
            </>
          ) : (
            <>
              <FileInput size={16} />
              Import &amp; enhance
            </>
          )}
        </button>

        {status === 'generating' && (
          <p className="text-sm text-ink-500">This usually takes 30–60 seconds…</p>
        )}
      </form>
    </div>
  )
}
