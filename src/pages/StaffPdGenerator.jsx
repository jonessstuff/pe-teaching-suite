import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Presentation, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateStaffPd } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import StaffPdRenderer from '../components/renderers/StaffPdRenderer'
import { useTrial } from '../context/TrialContext'

const CONTENT_AREAS = [
  { value: 'staff_pd', label: 'Staff PD session', blurb: 'A structured PD session (objective → activity → application → closure), sized to the time slot.' },
  { value: 'mentoring', label: 'New teacher mentoring', blurb: 'A sequenced induction / mentoring progression for a first-year teacher.' },
  { value: 'walkthrough', label: 'Walkthrough look-fors', blurb: 'A quick-reference guide for informal, non-evaluative classroom visits.' },
  { value: 'plc', label: 'PLC / data team protocol', blurb: 'A structured agenda for a team analyzing student data together.' },
  { value: 'communication', label: 'Building communication', blurb: 'Staff- and family-facing announcement templates for a whole-school message.' },
]
const DURATIONS = [
  { value: '30-minute staff meeting slot', label: '30-minute slot' },
  { value: '45 minutes', label: '45 minutes' },
  { value: '60 minutes', label: '60 minutes' },
  { value: 'half-day (about 3 hours)', label: 'Half day' },
  { value: 'full PD day', label: 'Full PD day' },
]
const AUDIENCES = [
  { value: 'Staff', label: 'Staff' },
  { value: 'Families / parents', label: 'Families / parents' },
  { value: 'Both staff and families', label: 'Both' },
]

export default function StaffPdGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [contentArea, setContentArea] = useState('staff_pd')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState('45 minutes')
  const [audience, setAudience] = useState('Both staff and families')
  const [notes, setNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const showDuration = contentArea === 'staff_pd' || contentArea === 'plc'
  const showAudience = contentArea === 'communication'
  const currentBlurb = CONTENT_AREAS.find((a) => a.value === contentArea)?.blurb

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true); setError(null); setSavedId(null)
    try {
      const input = {
        contentArea,
        topic,
        duration: showDuration ? duration : '',
        audience: showAudience ? audience : '',
        notes,
      }
      const generated = await generateStaffPd(input)
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
    setView('form'); setResult(null); setSavedId(null); setError(null)
  }

  if (view === 'result' && result) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} /> All modules
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            Start over
          </button>
          {savedId && (
            <Link to={`/lessons/${savedId}`} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              View in archive <ExternalLink size={14} />
            </Link>
          )}
          <button type="button" onClick={async () => { if (await requestExport()) window.print() }} className="ml-auto btn-secondary">
            Print
          </button>
        </div>
        {savedId && <p className="mb-4 text-xs text-ink-500 print:hidden">Saved to your archive.</p>}
        <StaffPdRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} /> All modules
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15">
            <Presentation size={18} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Staff PD &amp; Meeting Planning</h1>
            <p className="text-xs text-ink-500">
              Professional learning for adults · Learning Forward-aligned
            </p>
          </div>
        </div>
      </div>

      {/* Scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-gold-400" />
        <div className="text-sm">
          <p className="font-medium text-gold-200">Practical planning support for building leaders</p>
          <p className="mt-0.5 text-gold-300/90">
            Job-embedded, collaborative professional-learning plans for teachers and staff. This is <span className="font-medium">not</span> a School Improvement Plan, a compliance/accountability document, or a teacher-evaluation instrument — walkthrough look-fors are informal &amp; formative.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="pd-area">What are you planning?</label>
            <select id="pd-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
              {CONTENT_AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            {currentBlurb && <p className="mt-1.5 text-xs text-ink-500">{currentBlurb}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="pd-topic">Topic / focus</label>
            <input
              id="pd-topic"
              type="text"
              placeholder="e.g. Formative assessment routines, Restorative circles, Analyzing winter benchmark data, New arrival-dismissal procedure"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="input-field"
            />
          </div>

          {(showDuration || showAudience) && (
            <div className="grid grid-cols-2 gap-4">
              {showDuration && (
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="pd-duration">Time allotted</label>
                  <select id="pd-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="input-field">
                    {DURATIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              )}
              {showAudience && (
                <div>
                  <label className="mb-1 block text-sm text-ink-300" htmlFor="pd-audience">Audience</label>
                  <select id="pd-audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="input-field">
                    {AUDIENCES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="pd-notes">
              Notes <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <textarea
              id="pd-notes"
              placeholder="Any context — your staff, a schoolwide initiative, prior sessions in the series, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input-field min-h-[60px]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50">
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Generating…</>
          ) : (
            <><Sparkles size={18} /> Generate plan</>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">This usually takes 20–40 seconds · Do not close this tab</p>
        )}
      </form>
    </div>
  )
}
