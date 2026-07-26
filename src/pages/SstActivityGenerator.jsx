import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Sparkles, Loader2, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { generateSstActivity } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import SstActivityRenderer from '../components/renderers/SstActivityRenderer'
import { useTrial } from '../context/TrialContext'

const ROLES = [
  { value: 'social_worker', label: 'School Social Worker' },
  { value: 'school_psych', label: 'School Psychologist' },
  { value: 'mflc', label: 'Military & Family Life Counselor (MFLC / CYB-MFLC)' },
  { value: 'behavior_specialist', label: 'Behavior Specialist / Interventionist' },
]

const SKILL_AREAS = [
  { value: 'emotional_regulation', label: 'Emotional regulation & coping skills' },
  { value: 'social_skills', label: 'Social skills & friendship' },
  { value: 'conflict', label: 'Conflict resolution & anger management' },
  { value: 'self_esteem', label: 'Self-esteem & confidence' },
  { value: 'stress_mindfulness', label: 'Stress management & mindfulness' },
  { value: 'executive_function', label: 'Executive function & organization' },
  { value: 'transitions', label: 'Change, transitions & resilience' },
]

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

const GROUP_SIZES = ['Small group (2–3)', 'Small group (4–6)', 'Small group (7–10)']

export default function SstActivityGenerator() {
  const { requestExport } = useTrial()
  const [view, setView] = useState('form') // 'form' | 'result'

  const [role, setRole] = useState('social_worker')
  const [skillArea, setSkillArea] = useState('emotional_regulation')
  const [gradeBand, setGradeBand] = useState('3-5')
  const [focus, setFocus] = useState('')
  const [groupSize, setGroupSize] = useState(GROUP_SIZES[1])
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
      const input = { role, skillArea, gradeBand, focus, groupSize, sessionLengthMinutes, teacherNotes }
      const generated = await generateSstActivity(input)
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
          <Link to="/student-support-activities" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            Student Support Team Activities
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

        <SstActivityRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to="/student-support-activities" className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          Student Support Team Activities
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum-500/15">
            <Users size={18} className="text-plum-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Student Support Team Activities</h1>
            <p className="text-xs text-ink-500">
              Ready-to-run small-group SEL / behavioral skill-building activities
            </p>
          </div>
        </div>
      </div>

      {/* Scope notice */}
      <div className="flex items-start gap-3 rounded-lg border border-plum-500/30 bg-plum-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-plum-400" />
        <div className="text-sm">
          <p className="font-medium text-ink-100">Group activity structure only</p>
          <p className="mt-0.5 text-ink-300">
            Fills a narrow gap — the ready-to-run <span className="font-medium">activity structure</span> your clinical training didn&rsquo;t cover. It does <span className="font-medium">not</span> provide individual counseling plans, assessment/eligibility content, FBAs/BIPs, crisis protocols, or diagnostic/clinical content, and never replaces your professional training. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-300" htmlFor="sst-role">Your role</label>
            <select id="sst-role" value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
              {ROLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <p className="mt-1 text-xs text-ink-500">The same core activity is generated; the standards layer and scope note are tailored to your role.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="sst-skill">Skill area</label>
            <select id="sst-skill" value={skillArea} onChange={(e) => setSkillArea(e.target.value)} className="input-field">
              {SKILL_AREAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="sst-focus">
              Specific skill / focus <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="sst-focus"
              type="text"
              placeholder="e.g. Identifying triggers, Using I-statements, Calm-down strategies, Joining a group, Handling losing a game"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="sst-band">Grade band</label>
              <select id="sst-band" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
                {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="sst-group">Group size</label>
              <select id="sst-group" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="input-field">
                {GROUP_SIZES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="sst-duration">Minutes</label>
              <input
                id="sst-duration"
                type="number"
                min={15}
                max={60}
                step={5}
                value={sessionLengthMinutes}
                onChange={(e) => setSessionLengthMinutes(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Facilitator notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="sst-notes"
            placeholder="Any context to tailor the activity — group makeup, setting, available materials, prior sessions, etc. (no names)"
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
              Generate group activity
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
