import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wrench, Sparkles, Loader2, ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { generateMakerProject } from '../services/generationService'
import { createLesson } from '../services/lessonsService'
import MakerProjectRenderer from '../components/renderers/MakerProjectRenderer'
import { useTrial } from '../context/TrialContext'

// Makerspace is a shared category reachable from two modules. `origin` only
// changes the back-navigation — the generator, prompt, and output are identical
// from either entry point (one source, two doors).
const ORIGINS = {
  stem: { home: '/stem', label: 'STEM' },
  library: { home: '/library', label: 'Library & Media' },
}

const TOOLS = [
  { value: '3d_printer', label: '3D printer' },
  { value: 'laser_cutter', label: 'Laser cutter / engraver' },
  { value: 'vinyl_cutter', label: 'Vinyl cutter' },
  { value: 'robotics', label: 'Robotics kit (Dash / Sphero / similar)' },
  { value: 'hand_tools', label: 'Basic hand tools' },
  { value: 'electronics', label: 'Coding / electronics kit (micro:bit, Arduino…)' },
  { value: 'classic_build', label: 'Classic build — no powered equipment' },
]

const PROJECT_TYPES = [
  { value: 'equipment', label: 'Equipment-based project' },
  { value: 'cross_curricular', label: 'Cross-curricular project' },
  { value: 'classic', label: 'Classic hands-on build' },
]

const GRADE_BANDS = [
  { value: 'k-2', label: 'K–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-12', label: '9–12' },
]

export default function MakerProjectGenerator({ origin = 'stem' }) {
  const { requestExport } = useTrial()
  const back = ORIGINS[origin] ?? ORIGINS.stem
  const [view, setView] = useState('form') // 'form' | 'result'

  const [tool, setTool] = useState('3d_printer')
  const [gradeBand, setGradeBand] = useState('3-5')
  const [projectType, setProjectType] = useState('equipment')
  const [crossCurricular, setCrossCurricular] = useState('')
  const [focus, setFocus] = useState('')
  const [groupContext, setGroupContext] = useState('')
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
      const input = { tool, gradeBand, projectType, crossCurricular, focus, groupContext, teacherNotes }
      const generated = await generateMakerProject(input)
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
          <Link to={back.home} className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
            <ArrowLeft size={16} />
            {back.label}
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

        <MakerProjectRenderer lesson={result} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link to={back.home} className="mb-3 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
          <ArrowLeft size={14} />
          {back.label}
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/15">
            <Wrench size={18} className="text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-50">Makerspace / Maker Projects</h1>
            <p className="text-xs text-ink-500">
              Tool-specific builds · safety &amp; station logistics · cross-curricular making
            </p>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-500/30 bg-slate-500/10 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-slate-300" />
        <div className="text-sm">
          <p className="font-medium text-slate-200">Hands-on, safety-forward maker planning</p>
          <p className="mt-0.5 text-slate-400">
            Projects use the engineering design process and loosely anchor to ISTE competencies. Makerspace programming varies widely by school — verify equipment, budget, and safety against your own lab&rsquo;s policies. Don&rsquo;t enter student names.
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink-200">Tool &amp; project</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="mk-tool">Tool / equipment</label>
              <select id="mk-tool" value={tool} onChange={(e) => setTool(e.target.value)} className="input-field">
                {TOOLS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-300" htmlFor="mk-type">Project type</label>
              <select id="mk-type" value={projectType} onChange={(e) => setProjectType(e.target.value)} className="input-field">
                {PROJECT_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="mk-grade">Grade band</label>
            <select id="mk-grade" value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} className="input-field">
              {GRADE_BANDS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="mk-focus">
              Specific project idea / focus <span className="text-ink-500">(optional)</span>
            </label>
            <input
              id="mk-focus"
              type="text"
              placeholder="e.g. Design a phone stand, Build a marble run, Program a maze-solving robot, Laser-cut a nameplate"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-300" htmlFor="mk-cross">
              Cross-curricular tie{' '}
              <span className="text-ink-500">{projectType === 'cross_curricular' ? '(what subject/topic to tie to)' : '(optional)'}</span>
            </label>
            <input
              id="mk-cross"
              type="text"
              placeholder="e.g. Science: circulatory system; Social studies: local landmarks; ELA: retell a story"
              value={crossCurricular}
              onChange={(e) => setCrossCurricular(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Group / station context <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <p className="text-xs text-ink-500 -mt-1">
            Helps tailor station rotation and safety management for a shared lab.
          </p>
          <textarea
            id="mk-group"
            placeholder="e.g. 28 students, one 3D printer and two laptops, 45-minute rotations; or a whole class sharing 6 robotics kits"
            value={groupContext}
            onChange={(e) => setGroupContext(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-ink-200">
            Facilitator notes <span className="font-normal text-ink-500">(optional)</span>
          </h2>
          <textarea
            id="mk-notes"
            placeholder="Any context to tailor the project — available materials, time constraints, prior builds, etc."
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            rows={2}
            className="input-field min-h-[64px]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
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
              Generate maker project
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
