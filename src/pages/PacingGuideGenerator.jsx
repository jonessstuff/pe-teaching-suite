import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarRange, Loader2 } from 'lucide-react'
import { generatePacingGuide } from '../services/generationService'
import { createGuide } from '../services/pacingGuideService'
import PacingGuideRenderer from '../components/renderers/PacingGuideRenderer'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'

const SUBJECTS = ['PE & Health', 'Adaptive PE', 'Art', 'Library & Media', 'Music', 'STEM']
const GRADES = [
  { label: 'K', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 },
  { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 },
  { label: '6', value: 6 }, { label: '7', value: 7 }, { label: '8', value: 8 },
]
const DAYS_PER_WEEK = [1, 2, 3, 4, 5]

export default function PacingGuideGenerator() {
  const navigate = useNavigate()
  const { isTrial, isExpired, openPaywall } = useTrial()
  const gated = isTrial || isExpired
  const [form, setForm] = useState({
    subject: 'PE & Health',
    grade: 5,
    state: '',
    schoolYearStart: '',
    schoolYearEnd: '',
    daysPerWeek: 3,
    breaks: '',
    topics: '',
    name: '',
  })
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState('')
  const [quarters, setQuarters] = useState([])
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')

  async function handleGenerate(e) {
    e.preventDefault()
    setStatus('generating')
    setError(null)
    setQuarters([])

    // Trial users get a preview only — generate just the first quarter
    // (the rest of the year is a paid feature).
    const quartersToGenerate = gated ? 1 : 4
    const generated = []
    try {
      for (let qi = 0; qi < quartersToGenerate; qi++) {
        setProgress(`Generating Quarter ${qi + 1} of ${quartersToGenerate}…`)
        const result = await generatePacingGuide({
          ...form,
          quarterIndex: qi,
          totalQuarters: 4,
          previousQuarters: generated,
        })
        generated.push(result.quarter)
        setQuarters([...generated])
      }
      setStatus('done')
      setProgress('')
    } catch (err) {
      setError(err.message ?? 'Generation failed')
      setStatus('idle')
      setProgress('')
    }
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      const guideData = {
        quarters,
        meta: {
          subject: form.subject,
          grade: form.grade,
          state: form.state,
          schoolYearStart: form.schoolYearStart,
          schoolYearEnd: form.schoolYearEnd,
          daysPerWeek: form.daysPerWeek,
          breaks: form.breaks,
          topics: form.topics,
        },
      }
      const saved = await createGuide({
        name: form.name || `${form.subject} — Grade ${form.grade === 0 ? 'K' : form.grade} Pacing Guide`,
        guideData,
      })
      setSaveStatus('saved')
      setTimeout(() => navigate('/my-pacing-guides'), 1000)
    } catch (err) {
      setError(err.message)
      setSaveStatus('idle')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors mb-3">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15">
            <CalendarRange size={20} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">Pacing Guide Generator</h1>
            <p className="text-sm text-ink-500">Full-year scope &amp; sequence, one quarter at a time</p>
          </div>
        </div>
      </div>

      {status !== 'done' && (
        <form onSubmit={handleGenerate} className="space-y-5 max-w-2xl">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">Subject</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, subject: s }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${form.subject === s ? 'border-teal-500 bg-teal-500/15 text-teal-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">Grade</label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map(g => (
                <button key={g.value} type="button" onClick={() => setForm(f => ({ ...f, grade: g.value }))}
                  className={`h-9 w-11 rounded-lg border text-sm font-semibold transition-colors ${form.grade === g.value ? 'border-teal-500 bg-teal-500/15 text-teal-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
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
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">Days per week</label>
              <div className="flex gap-1.5">
                {DAYS_PER_WEEK.map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, daysPerWeek: d }))}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${form.daysPerWeek === d ? 'border-teal-500 bg-teal-500/15 text-teal-400' : 'border-ink-700 text-ink-500 hover:border-ink-500'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">Year start</label>
              <input type="date" value={form.schoolYearStart} onChange={e => setForm(f => ({ ...f, schoolYearStart: e.target.value }))}
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">Year end</label>
              <input type="date" value={form.schoolYearEnd} onChange={e => setForm(f => ({ ...f, schoolYearEnd: e.target.value }))}
                className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-teal-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1.5">Known breaks / holidays</label>
            <textarea value={form.breaks} onChange={e => setForm(f => ({ ...f, breaks: e.target.value }))} rows={2}
              placeholder="Thanksgiving week, Winter break Dec 23–Jan 3, Spring break March 24–28…"
              className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-teal-500 resize-y" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1.5">Topics / units to include (optional)</label>
            <textarea value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))} rows={3}
              placeholder="e.g. Invasion games, Net/wall games, Dance, Fitness testing, Outdoor ed…"
              className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-teal-500 resize-y" />
          </div>

          {/* Preview progress */}
          {quarters.length > 0 && status === 'generating' && (
            <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
              <p className="text-sm font-medium text-teal-400 mb-2">{progress}</p>
              <p className="text-xs text-ink-500">{quarters.length} of 4 quarters complete — results appear below as they finish</p>
            </div>
          )}

          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={status === 'generating'}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 font-semibold text-white hover:bg-teal-400 disabled:opacity-50 transition-colors">
              {status === 'generating' ? <><Loader2 size={16} className="animate-spin" /> {progress || 'Generating…'}</> : <><CalendarRange size={16} /> Generate pacing guide</>}
            </button>
            {status === 'generating' && (
              <p className="text-xs text-ink-500">Each quarter takes ~30 seconds · Do not close this tab</p>
            )}
          </div>
        </form>
      )}

      {/* Results */}
      {quarters.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-ink-50">
              {form.subject} Pacing Guide — Grade {form.grade === 0 ? 'K' : form.grade}
            </h2>
            {status === 'done' && (
              <div className="ml-auto flex items-center gap-2">
                <div>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Binder name (optional)"
                    className="rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-1.5 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-teal-500 w-56" />
                </div>
                <button type="button" onClick={handleSave} disabled={saveStatus === 'saving'}
                  className="rounded-xl bg-teal-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-50 transition-colors">
                  {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
                </button>
                <button type="button" onClick={() => (gated ? openPaywall('gated-feature') : window.print())}
                  className="rounded-lg border border-ink-700 px-4 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
                  Print
                </button>
              </div>
            )}
          </div>
          <PacingGuideRenderer guide={{ quarters, meta: form }} />
          {gated && <UpgradeBanner label="the full-year pacing guide" />}
        </div>
      )}
    </div>
  )
}
