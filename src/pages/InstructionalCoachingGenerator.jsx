import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Handshake, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { generateInstructionalCoaching } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import InstructionalCoachingRenderer from '../components/renderers/InstructionalCoachingRenderer'
import { useTrial } from '../context/TrialContext'

const CONTENT_AREAS = [
  { value: 'conversation_frameworks', label: 'Coaching conversation frameworks', blurb: 'Non-evaluative dialogue protocols for pre-observation, debrief, and goal-setting conversations.' },
  { value: 'observation_tools', label: 'Coaching observation tools', blurb: 'Collaborative, teacher-driven observation tools that gather objective data — not evaluation.' },
  { value: 'goal_data_protocols', label: 'Goal-setting & data-use protocols', blurb: 'Teacher-owned goal-setting and confidential, partnership-based data use.' },
]

const CONVERSATION_TYPES = [
  { value: 'all', label: 'All three (a full cycle)' },
  { value: 'pre_observation', label: 'Pre-observation conversation' },
  { value: 'debrief', label: 'Observation debrief' },
  { value: 'goal_setting', label: 'Goal-setting conversation' },
]

export default function InstructionalCoachingGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [contentArea, setContentArea] = useState('conversation_frameworks')
  const [topic, setTopic] = useState('')
  const [conversationType, setConversationType] = useState('all')
  const [notes, setNotes] = useState('')

  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const showConversationType = contentArea === 'conversation_frameworks'
  const currentBlurb = CONTENT_AREAS.find((a) => a.value === contentArea)?.blurb

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true); setError(null); setSavedId(null)
    try {
      const input = {
        contentArea,
        topic,
        conversationType: showConversationType ? conversationType : '',
        notes,
      }
      const generated = await generateInstructionalCoaching(input)
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
        <InstructionalCoachingRenderer lesson={result} />
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mocha-500/15">
            <Handshake size={18} className="text-mocha-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Instructional Coaching</h1>
            <p className="text-xs text-ink-500">
              Partnership-based coaching · Jim Knight&rsquo;s Impact Cycle &amp; Learning Forward
            </p>
          </div>
        </div>
      </div>

      {/* Non-evaluative scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-mocha-500/30 bg-mocha-500/10 px-4 py-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-mocha-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Coaching is not evaluation</p>
          <p className="mt-0.5 text-ink-300">
            Non-evaluative, teacher-driven coaching frameworks, observation tools, and protocols built on Jim Knight&rsquo;s partnership approach. This is <span className="font-medium">not</span> a teacher evaluation, performance review, or supervisory instrument — everything stays a confidential partnership between coach and teacher.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ic-area">What are you building?</label>
            <select id="ic-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
              {CONTENT_AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            {currentBlurb && <p className="mt-1.5 text-xs text-ink-500">{currentBlurb}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ic-topic">Instructional focus / goal</label>
            <input
              id="ic-topic"
              type="text"
              placeholder="e.g. Increasing student talk time, Checks for understanding, Small-group math instruction, Building classroom routines"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="input-field"
            />
          </div>

          {showConversationType && (
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ic-conv">Conversation type</label>
              <select id="ic-conv" value={conversationType} onChange={(e) => setConversationType(e.target.value)} className="input-field">
                {CONVERSATION_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ic-notes">
              Notes <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <textarea
              id="ic-notes"
              placeholder="Any context — the teacher's experience level, where you are in the coaching cycle, a schoolwide focus, etc. (no teacher names)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input-field min-h-[60px]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-ink-100">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50">
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Generating…</>
          ) : (
            <><Sparkles size={18} /> Generate coaching resource</>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-ink-500">This usually takes 20–40 seconds · Do not close this tab</p>
        )}
      </form>
    </div>
  )
}
