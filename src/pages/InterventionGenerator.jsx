import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert, History, Save, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { generateIntervention } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import { saveInterventionHistory, getInterventionHistory } from '../services/interventionHistoryService'
import InterventionRenderer from '../components/renderers/InterventionRenderer'
import { useTrial } from '../context/TrialContext'

const DOMAINS = [
  { value: '', label: 'Auto-detect from concern' },
  { value: 'Reading', label: 'Reading (IDA / Structured Literacy)' },
  { value: 'Math', label: 'Math (NCTM / CRA)' },
  { value: 'Behavior', label: 'Behavior (positive behavior support)' },
]
const GRADE_BANDS = [
  { value: '', label: 'Not specified' },
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

function fmtDate(d) {
  if (!d) return ''
  // d is 'YYYY-MM-DD'; render without timezone shifting.
  const [y, m, day] = String(d).split('-')
  if (!y || !m || !day) return d
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function InterventionGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result' | 'history'

  const [concern, setConcern] = useState('')
  const [domain, setDomain] = useState('')
  const [gradeBand, setGradeBand] = useState('')
  const [initials, setInitials] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [historySavedFor, setHistorySavedFor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Post-hoc "save to history" on the result view
  const [saveInitials, setSaveInitials] = useState('')
  const [saving, setSaving] = useState(false)

  // History view
  const [lookupInitials, setLookupInitials] = useState('')
  const [entries, setEntries] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSavedId(null)
    setHistorySavedFor(null)

    try {
      const generated = await generateIntervention({ concern, domain, gradeBand })
      setResult(generated)

      if (generated?.title) {
        const saved = await createLesson(generated, { aiModel: 'claude-sonnet-4-6' })
        setSavedId(saved.id)
      }

      // If initials were provided up front, log this attempt to history.
      const trimmed = initials.trim()
      if (trimmed && generated?.title) {
        try {
          await saveInterventionHistory({ initials: trimmed, intervention: generated })
          setHistorySavedFor(trimmed)
        } catch { /* non-fatal; teacher can save from the result view */ }
      }
      setSaveInitials(trimmed)

      setView('result')
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveToHistory() {
    const trimmed = saveInitials.trim()
    if (!trimmed || !result) return
    setSaving(true)
    try {
      await saveInterventionHistory({ initials: trimmed, intervention: result })
      setHistorySavedFor(trimmed)
    } catch (err) {
      setError(err.message ?? 'Could not save to history.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLookup(e) {
    e.preventDefault()
    setHistoryLoading(true)
    setHistoryError(null)
    setEntries(null)
    setExpandedId(null)
    try {
      const rows = await getInterventionHistory(lookupInitials)
      setEntries(rows)
    } catch (err) {
      setHistoryError(err.message ?? 'Could not load history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  function resetForm() {
    setView('form')
    setResult(null)
    setSavedId(null)
    setHistorySavedFor(null)
    setError(null)
  }

  // ── History view ────────────────────────────────────────────────────────────
  if (view === 'history') {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <button type="button" onClick={() => setView('form')} className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
            <ArrowLeft size={14} /> New intervention
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-500/15">
              <History size={18} className="text-stone-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink-50">Intervention history</h1>
              <p className="text-xs text-ink-500">See what&rsquo;s been tried for a student over time</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLookup} className="card p-6 space-y-3">
          <label className="block text-sm text-ink-300" htmlFor="iv-lookup">Student initials or code</label>
          <div className="flex gap-2">
            <input
              id="iv-lookup"
              type="text"
              placeholder="e.g. J.M. or S-14"
              value={lookupInitials}
              onChange={(e) => setLookupInitials(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" disabled={historyLoading || !lookupInitials.trim()} className="btn-primary px-5 disabled:opacity-50">
              {historyLoading ? <Loader2 size={16} className="animate-spin" /> : 'Look up'}
            </button>
          </div>
          <p className="text-xs text-ink-500">Initials or a code only — never a full name.</p>
        </form>

        {historyError && <p className="text-sm text-red-400">{historyError}</p>}

        {entries && entries.length === 0 && (
          <p className="text-sm text-ink-400">No saved entries for &ldquo;{lookupInitials.trim()}&rdquo; yet.</p>
        )}

        {entries && entries.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-ink-500">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'} for &ldquo;{lookupInitials.trim()}&rdquo;, newest first.</p>
            {entries.map((en) => (
              <div key={en.id} className="card p-5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-ink-300">{fmtDate(en.entry_date)}</span>
                  {en.domain && <span className="rounded px-2 py-0.5 text-xs font-semibold bg-stone-500/20 text-stone-300">{en.domain}</span>}
                  {en.tier && <span className="rounded px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400">{en.tier}</span>}
                </div>
                <p className="text-sm font-semibold text-ink-100">{en.title}</p>
                {en.targeted_skill && <p className="text-sm text-ink-400">Targeted: {en.targeted_skill}</p>}

                {/* Progress-check nudge tied to the saved progress-monitoring */}
                <div className="rounded-lg border border-stone-500/25 bg-stone-500/5 px-3 py-2 text-xs text-ink-300">
                  <span className="font-semibold text-stone-300">Check next: </span>
                  You tried this on {fmtDate(en.entry_date)}.
                  {en.recheck_frequency ? ` Re-check ${en.recheck_frequency}.` : ''}
                  {en.success_indicators ? ` It's working if: ${en.success_indicators}` : ''}
                  {en.what_to_watch ? ` Watch for: ${en.what_to_watch}` : ''}
                </div>

                {en.intervention_object && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === en.id ? null : en.id)}
                    className="flex items-center gap-1 text-xs text-ink-400 hover:text-stone-400 transition-colors"
                  >
                    {expandedId === en.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedId === en.id ? 'Hide full plan' : 'View full plan'}
                  </button>
                )}
                {expandedId === en.id && en.intervention_object && (
                  <div className="pt-2">
                    <InterventionRenderer lesson={en.intervention_object} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Result view ─────────────────────────────────────────────────────────────
  if (view === 'result' && result) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} /> All modules
          </Link>
          <button type="button" onClick={resetForm} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            New concern
          </button>
          <button type="button" onClick={() => setView('history')} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <History size={14} /> History
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

        {/* Save-to-history control */}
        <div className="mb-4 rounded-lg border border-stone-500/25 bg-stone-500/5 px-4 py-3 print:hidden">
          {historySavedFor ? (
            <p className="flex items-center gap-2 text-sm text-stone-200">
              <Check size={16} className="text-stone-400" /> Saved to intervention history for <b>{historySavedFor}</b>.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-300">Log this to a student&rsquo;s history:</span>
              <input
                type="text"
                placeholder="Initials or code"
                value={saveInitials}
                onChange={(e) => setSaveInitials(e.target.value)}
                className="input-field w-40 py-1.5"
              />
              <button type="button" onClick={handleSaveToHistory} disabled={saving || !saveInitials.trim()} className="btn-secondary gap-1.5 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          )}
        </div>

        <InterventionRenderer lesson={result} />
      </div>
    )
  }

  // ── Form view ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link to="/" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} /> All modules
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-500/15">
            <Layers size={18} className="text-stone-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-ink-50">Intervention Planning</h1>
            <p className="text-xs text-ink-500">MTSS/RTI tiered intervention ideas · Reading, Math &amp; Behavior</p>
          </div>
          <button type="button" onClick={() => { setLookupInitials(initials.trim()); setEntries(null); setView('history') }} className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-300 hover:border-stone-400/40 hover:text-ink-100 transition-colors">
            <History size={15} /> History
          </button>
        </div>
      </div>

      {/* Scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-stone-500/30 bg-stone-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-stone-400" />
        <div className="text-sm">
          <p className="font-medium text-stone-200">Instructional intervention ideas only</p>
          <p className="mt-0.5 text-stone-300/90">
            Generates a tiered intervention with progress-monitoring suggestions from a described concern. It does <span className="font-medium">not</span> replace universal screening, determine tier placement or special-education eligibility, or serve as a documented RTI/MTSS compliance record. Use alongside your team&rsquo;s data and judgment. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="iv-concern">Describe the specific concern</label>
            <textarea
              id="iv-concern"
              placeholder="e.g. Student scored moderate-risk on phonemic segmentation. / Struggles with regrouping in subtraction — succeeds with base-ten blocks but not on paper. / Leaves seat and calls out repeatedly during independent work."
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              required
              rows={4}
              className="input-field min-h-[110px]"
            />
            <p className="mt-1.5 text-xs text-ink-500">The more specific the concern (what you see, when, what helps), the more targeted the intervention.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="iv-domain">Domain</label>
              <select id="iv-domain" value={domain} onChange={(e) => setDomain(e.target.value)} className="input-field">
                {DOMAINS.map(({ value, label }) => <option key={value || 'auto'} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="iv-band">Grade band <span className="font-normal text-ink-500">(optional)</span></label>
              <select id="iv-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value || 'none'} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="iv-initials">
              Student initials or code <span className="font-normal text-ink-500">(optional — to log to history)</span>
            </label>
            <input
              id="iv-initials"
              type="text"
              placeholder="e.g. J.M. or S-14"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              className="input-field"
            />
            <p className="mt-1.5 text-xs text-ink-500">Use initials or a code only — never a full name. If provided, this intervention is saved to that student&rsquo;s history so you can track what&rsquo;s been tried over time.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50">
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Generating…</>
          ) : (
            <><Sparkles size={18} /> Generate intervention</>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">This usually takes 20–40 seconds · Do not close this tab</p>
        )}
      </form>
    </div>
  )
}
