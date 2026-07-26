import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ear, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateDhh } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import DhhRenderer from '../components/renderers/DhhRenderer'
import { useTrial } from '../context/TrialContext'

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const AREAS = [
  { value: 'communication', label: 'Communication' },
  { value: 'self_advocacy', label: 'Self-Determination & Advocacy' },
  { value: 'social_emotional', label: 'Social-Emotional Skills' },
  { value: 'technology_audiology', label: 'Technology & Audiology awareness' },
  { value: 'career_transition', label: 'Career Education & Transition (secondary)' },
]

const APPROACHES = [
  { value: 'both', label: 'Adaptable to either (not specified)' },
  { value: 'bilingual_bicultural', label: 'Bilingual-Bicultural (ASL/English)' },
  { value: 'listening_spoken_language', label: 'Listening & Spoken Language' },
]

const FOCUS_PLACEHOLDERS = {
  communication: 'e.g. Conversational repair strategies, Following a group discussion, Expressive vocabulary, Incidental-learning access',
  self_advocacy: 'e.g. Requesting an FM/DM system, Explaining hearing tech to peers, Asking for repetition or captions, Group-setting advocacy',
  social_emotional: 'e.g. Entering a peer conversation, D/HH identity & belonging, Managing listening/communication fatigue, Handling being misunderstood',
  technology_audiology: 'e.g. Daily hearing-aid/CI check, Troubleshooting an FM system, Battery & care routine, Knowing when to ask for help',
  career_transition: 'e.g. Disclosing access needs to an employer, Workplace accommodation requests, Communication access at work, Interview readiness',
}

export default function DhhGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [gradeBand, setGradeBand] = useState('3-5')
  const [contentArea, setContentArea] = useState('communication')
  const [communicationApproach, setCommunicationApproach] = useState('both')
  const [focus, setFocus] = useState('')
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(30)
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
      const input = { gradeBand, contentArea, communicationApproach, focus, sessionLengthMinutes, teacherNotes }
      const generated = await generateDhh(input)
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
          <Link to="/dhh" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Teacher of the Deaf & Hard of Hearing
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

        <DhhRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/dhh" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Teacher of the Deaf & Hard of Hearing
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-magenta-500/15">
            <Ear size={18} className="text-magenta-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Teacher of the Deaf &amp; Hard of Hearing</h1>
            <p className="text-xs text-ink-500">
              ECC-DHH activity ideas · CEC/CED-aligned · communication, self-advocacy, social-emotional, technology &amp; transition
            </p>
          </div>
        </div>
      </div>

      {/* Boundary notice (always) */}
      <div className="flex items-start gap-3 rounded-lg border border-magenta-500/30 bg-magenta-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-magenta-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Activity ideas, not an assessment tool</p>
          <p className="mt-0.5 text-ink-300">
            This is a specialized licensed credential. This tool supports activity planning only — it does <span className="font-medium">not</span> diagnose, evaluate, determine eligibility, or replace professional judgment. Treat every output as activity ideas to adapt to your caseload and students&rsquo; IEP goals. Bilingual-bicultural (ASL/English) and Listening &amp; Spoken Language are both equally valid approaches — pick your program&rsquo;s below, or leave it adaptable. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">ECC-DHH area, band &amp; approach</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="dhh-band">Grade band</label>
              <select id="dhh-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="dhh-area">ECC-DHH area</label>
              <select id="dhh-area" value={contentArea} onChange={(e) => setContentArea(e.target.value)} className="input-field">
                {AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="dhh-approach">Communication approach</label>
            <select id="dhh-approach" value={communicationApproach} onChange={(e) => setCommunicationApproach(e.target.value)} className="input-field">
              {APPROACHES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <p className="mt-1 text-xs text-ink-500">Both approaches are treated as equally valid. Leave adaptable if your caseload spans both.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="dhh-focus">
              Specific target / focus <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="dhh-focus"
              type="text"
              placeholder={FOCUS_PLACEHOLDERS[contentArea] ?? FOCUS_PLACEHOLDERS.communication}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="dhh-duration">Session length (minutes)</label>
            <input
              id="dhh-duration"
              type="number"
              min={15}
              max={90}
              step={5}
              value={sessionLengthMinutes}
              onChange={(e) => setSessionLengthMinutes(Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Teacher notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="dhh-notes"
            placeholder="Any context to tailor the activities — hearing technology used (HA/CI/FM), degree of hearing level, mainstream vs. self-contained setting, interpreter access, interests, prior targets, etc. (no names)"
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
              Generate activity ideas
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
