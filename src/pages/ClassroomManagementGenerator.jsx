import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Sparkles, Loader2, Printer, Save, Check, ArrowLeft, FolderOpen } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'
import { generateClassroomCard, createCard } from '../services/classroomManagementService'
import ClassroomCardRenderer from '../components/renderers/ClassroomCardRenderer'

// Card accent themes — deliberately distinct from the module's own indigo UI accent.
const THEMES = [
  { id: 'navy', name: 'Navy', hex: '#1e3a8a' },
  { id: 'teal', name: 'Teal', hex: '#0f766e' },
  { id: 'crimson', name: 'Crimson', hex: '#b91c1c' },
  { id: 'forest', name: 'Forest', hex: '#166534' },
  { id: 'plum', name: 'Plum', hex: '#6b21a8' },
  { id: 'slate', name: 'Slate', hex: '#334155' },
]

const GRADE_BANDS = [
  { id: 'K-2', label: 'K–2' },
  { id: '3-5', label: '3–5' },
  { id: '6-8', label: '6–8' },
  { id: '9-12', label: '9–12' },
]

export default function ClassroomManagementGenerator() {
  const { isTrial, isExpired } = useTrial()
  const gated = isTrial || isExpired

  const [teacherName, setTeacherName] = useState('')
  const [gradeBand, setGradeBand] = useState('6-8')
  const [classContext, setClassContext] = useState('')
  const [themeId, setThemeId] = useState('navy')
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCard(null)
    setSaveStatus('idle')
    try {
      const result = await generateClassroomCard({ gradeBand, classContext: classContext.trim() })
      setCard(result)
    } catch (err) {
      setError(err.message ?? 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      await createCard({
        name: `${teacherName.trim() || 'My Classroom'} — Grades ${gradeBand} Management Card`,
        cardData: { card, teacherName: teacherName.trim(), gradeBand, theme },
      })
      setSaveStatus('saved')
    } catch (err) {
      setError(err.message)
      setSaveStatus('idle')
    }
  }

  return (
    <div className="space-y-8">
      {/* Back to modules */}
      <Link to="/" className="no-print inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
        <ArrowLeft size={14} />
        All modules
      </Link>

      {/* Header */}
      <div className="no-print flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
            <ClipboardCheck size={22} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink-50">Classroom Management</h1>
            <p className="text-sm text-ink-400">Printable quick-reference cards for large-group specials classes</p>
          </div>
        </div>
        <Link
          to="/my-classroom-cards"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-ink-800 px-3 py-1.5 text-sm font-medium text-ink-300 hover:border-ink-600"
        >
          <FolderOpen size={15} /> My cards
        </Link>
      </div>

      {gated ? (
        // Trial users: Classroom Management is a paid-only module — no preview.
        <div className="no-print">
          <div className="card p-6">
            <p className="text-sm text-ink-300">
              Classroom Management is included with a PlansK12 subscription. It isn't part of the free trial.
            </p>
          </div>
          <UpgradeBanner label="the Classroom Management module" />
        </div>
      ) : (
        <>
          {/* Form */}
          <form onSubmit={handleGenerate} className="no-print card space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cm-name" className="mb-1.5 block text-sm font-medium text-ink-200">
                  Teacher name <span className="text-ink-500">(printed on the card)</span>
                </label>
                <input
                  id="cm-name"
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Ms. Garcia's Gym"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-200">Grade band</label>
                <div className="flex flex-wrap gap-2">
                  {GRADE_BANDS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradeBand(g.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        gradeBand === g.id ? 'border-indigo-400 bg-indigo-500/15 text-indigo-300' : 'border-ink-800 text-ink-400 hover:border-ink-600'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="cm-context" className="mb-1.5 block text-sm font-medium text-ink-200">
                Class / subject <span className="text-ink-500">(optional — tailors the signals & routines)</span>
              </label>
              <input
                id="cm-context"
                type="text"
                value={classContext}
                onChange={(e) => setClassContext(e.target.value)}
                placeholder="e.g. PE / gym, General music, Art room, STEM lab"
                className="input-field"
              />
            </div>

            {/* Color theme picker */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-200">Card color theme</label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      themeId === t.id ? 'border-ink-400 bg-ink-800 text-ink-50' : 'border-ink-800 text-ink-400 hover:border-ink-600'
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.hex }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate card</>}
            </button>
          </form>

          {/* Generated card */}
          {card && (
            <div className="space-y-5">
              <ClassroomCardRenderer card={card} teacherName={teacherName} gradeBand={gradeBand} accentHex={theme.hex} />

              <div className="no-print flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  <Printer size={16} /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus !== 'idle'}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink-700 px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-ink-500 disabled:opacity-60"
                >
                  {saveStatus === 'saved' ? <><Check size={16} /> Saved</> : saveStatus === 'saving' ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save to my cards</>}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
