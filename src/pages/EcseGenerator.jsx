import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Baby, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateEcse } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import EcseRenderer from '../components/renderers/EcseRenderer'
import { useTrial } from '../context/TrialContext'

const AGE_BANDS = [
  { value: 'birth3', label: 'Birth–3 (Early Intervention · IFSP)' },
  { value: 'preschool', label: 'Ages 3–5 (Preschool Special Ed · IEP)' },
]

const FOCUS_AREAS = [
  { value: '', label: 'Infer from the skill' },
  { value: 'social_emotional', label: 'Social-Emotional & Relationships' },
  { value: 'communication_language', label: 'Communication & Language' },
  { value: 'motor', label: 'Motor (Fine & Gross)' },
  { value: 'adaptive_self_help', label: 'Adaptive / Self-Help' },
  { value: 'cognitive_preacademic', label: 'Cognitive & Pre-Academic' },
  { value: 'play_social', label: 'Play & Peer Interaction' },
]

export default function EcseGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [focusSkill, setFocusSkill] = useState('')
  const [ageBand, setAgeBand] = useState('preschool')
  const [focusArea, setFocusArea] = useState('')
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
      const input = { focusSkill, ageBand, focusArea, teacherNotes }
      const generated = await generateEcse(input)
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
          <Link to="/ecse" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Early Childhood Special Education
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

        <EcseRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/ecse" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Early Childhood Special Education
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-500/15">
            <Baby size={18} className="text-sage-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Early Childhood Special Education</h1>
            <p className="text-xs text-ink-500">
              Play-based, embedded instruction (birth–5) · DEC Recommended Practices
            </p>
          </div>
        </div>
      </div>

      {/* Framing notice */}
      <div className="flex items-start gap-3 rounded-lg border border-sage-500/30 bg-sage-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-sage-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Instructional ideas to embed — not IEP/IFSP goals</p>
          <p className="mt-0.5 text-ink-300">
            Play-based, embedded-in-routines support for a young child with a disability or delay, at the intersection of early childhood and special education. Anchored in DEC Recommended Practices, NAEYC DAP &amp; CEC. These are ideas to adapt to the child&rsquo;s existing IFSP/IEP and their family&rsquo;s priorities — never IEP/IFSP goals, a diagnosis, or an eligibility determination. Don&rsquo;t enter the child&rsquo;s name.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Target skill, age band &amp; focus</h2>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="ecse-skill">Target skill / study / routine focus</label>
            <input
              id="ecse-skill"
              type="text"
              placeholder="e.g. Requesting with a picture/AAC at snack, Taking turns in block play, Pulling to stand, Self-feeding with a spoon, Following a visual schedule at transitions"
              value={focusSkill}
              onChange={(e) => setFocusSkill(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ecse-age">Age band</label>
              <select id="ecse-age" value={ageBand} onChange={(e) => setAgeBand(e.target.value)} className="input-field">
                {AGE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="ecse-area">Developmental focus area</label>
              <select id="ecse-area" value={focusArea} onChange={(e) => setFocusArea(e.target.value)} className="input-field">
                {FOCUS_AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-ink-500">
            Birth–3 embeds learning in home/community routines and coaches caregivers (IFSP); ages 3–5 embed it in inclusive classroom play &amp; routines (IEP).
          </p>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Teacher notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="ecse-notes"
            placeholder="Any context to tailor the plan — the child's strengths & interests, the supports/AAC they use, family priorities & home language, the routines you have, positioning/sensory needs, etc. (no names)"
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
              Generate embedded plan
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
