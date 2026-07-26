import { useState } from 'react'
import { ALL_TEACHER_SUBJECTS } from '../constants/toolSubjects'
import { Link } from 'react-router-dom'
import { ArrowLeft, ScrollText, Loader2, Copy, Check, Printer } from 'lucide-react'
import { generateEoyNarrative } from '../services/generationService'
import { useTrial } from '../context/TrialContext'

const SUBJECTS = ALL_TEACHER_SUBJECTS
const GRADES = [
  { label: 'K', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
  { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 },
  { label: '6', value: 6 }, { label: '7', value: 7 }, { label: '8', value: 8 },
]

export default function EOYNarrativeGenerator() {
  const { requestExport } = useTrial()
  const [form, setForm] = useState({
    subject: 'PE & Health',
    gradeLevels: [],
    state: '',
    schoolYear: '2025–26',
    keyUnits: '',
    achievements: '',
    challenges: '',
    goals: '',
  })
  const [status, setStatus] = useState('idle')
  const [narrative, setNarrative] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  function toggleGrade(value) {
    setForm(f => ({
      ...f,
      gradeLevels: f.gradeLevels.includes(value)
        ? f.gradeLevels.filter(g => g !== value)
        : [...f.gradeLevels, value],
    }))
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setStatus('generating')
    setError(null)
    setNarrative(null)
    try {
      const result = await generateEoyNarrative(form)
      setNarrative(result.eoy_narrative)
      setStatus('done')
    } catch (err) {
      setError(err.message ?? 'Generation failed')
      setStatus('idle')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(narrative ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors mb-3">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
            <ScrollText size={20} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">End-of-Year Narrative</h1>
            <p className="text-sm text-ink-500">Professional summary for portfolio, evaluation, or district reporting</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">Subject</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, subject: s }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.subject === s ? 'border-sky-500 bg-sky-500/15 text-sky-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grades */}
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">Grades taught (select all)</label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map(g => (
                <button key={g.value} type="button" onClick={() => toggleGrade(g.value)}
                  className={`h-9 w-11 rounded-lg border text-sm font-semibold transition-colors ${form.gradeLevels.includes(g.value) ? 'border-sky-500 bg-sky-500/15 text-sky-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">State</label>
              <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                placeholder="e.g. California"
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">School year</label>
              <input value={form.schoolYear} onChange={e => setForm(f => ({ ...f, schoolYear: e.target.value }))}
                placeholder="2025–26"
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-sky-500" />
            </div>
          </div>

          {[
            { key: 'keyUnits', label: 'Key units covered this year', placeholder: 'e.g. Invasion games, Fitness testing, Dance/rhythm…' },
            { key: 'achievements', label: 'Notable student achievements', placeholder: 'Standout moments, growth you observed…' },
            { key: 'challenges', label: 'Challenges faced', placeholder: 'What was hard? How did you adapt?' },
            { key: 'goals', label: 'Professional goals for next year', placeholder: 'What do you want to focus on?' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">{label}</label>
              <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                rows={3} placeholder={placeholder}
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-sky-500 resize-y" />
            </div>
          ))}

          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-ink-100">{error}</p>}

          <button type="submit" disabled={status === 'generating'}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-400 disabled:opacity-50 transition-colors">
            {status === 'generating' ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><ScrollText size={16} /> Generate narrative</>}
          </button>
        </form>

        {/* Result */}
        <div>
          {narrative && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 print:hidden">
                <button type="button" onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy text</>}
                </button>
                <button type="button" onClick={async () => { if (await requestExport()) window.print() }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
                  <Printer size={14} /> Print
                </button>
              </div>
              <div className="rounded-xl border border-ink-700 p-6 bg-ink-100/30 print:border-gray-300 print:bg-white">
                <pre className="whitespace-pre-wrap text-sm text-ink-800 leading-relaxed font-sans print:text-gray-800">
                  {narrative}
                </pre>
              </div>
            </div>
          )}
          {!narrative && status !== 'generating' && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-ink-800 text-center">
              <div>
                <ScrollText size={32} className="mx-auto mb-2 text-ink-700" />
                <p className="text-sm text-ink-600">Your narrative will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
