import { useState, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Package, Loader2, Check, SkipForward, X } from 'lucide-react'
import { generateVisualResources, generateDifferentiatedLesson } from '../../services/generationService'
import { updateLesson } from '../../services/lessonsService'
import { domToBlocks, requestDocx } from '../../lib/docxExport'
import { useTrial } from '../../context/TrialContext'
import TeacherPacketDoc from './TeacherPacketDoc'

// One-click Complete Resource Bundle: auto-runs the secondary generators (materials +
// the two existing Differentiate variants) and bundles them with the full plan and a
// condensed teaching view into ONE Teacher Packet .docx. Per-step progress, and
// partial-failure tolerant — a piece that fails is skipped and the packet still
// ships with the rest. Paid feature (the .docx export is paid-gated), so we gate
// upfront rather than doing three generations and then paywalling.
const STEP_DEFS = [
  { key: 'materials', label: 'Building teaching materials' },
  { key: 'advanced', label: 'Extension (advanced) version' },
  { key: 'modified', label: 'Modified (below-grade) version' },
  { key: 'packet', label: 'Assembling the Teacher Packet' },
]

function StepIcon({ state }) {
  if (state === 'running') return <Loader2 size={15} className="animate-spin text-accent-500" />
  if (state === 'done') return <Check size={15} className="text-green-500" />
  if (state === 'skipped') return <SkipForward size={15} className="text-amber-500" />
  return <span className="inline-block h-[15px] w-[15px] rounded-full border border-ink-700" />
}

export default function MakeTomorrowReady({ savedId, lessonObject: lo }) {
  const { isPaid, openPaywall } = useTrial()
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [skippedNote, setSkippedNote] = useState([])
  const [packet, setPacket] = useState(null)
  const packetRef = useRef(null)

  function reset() { setDone(false); setError(null); setSteps([]); setSkippedNote([]); setPacket(null) }

  async function run() {
    if (!isPaid) { openPaywall('docx-export'); return }
    if (!savedId) { setError('Please save the lesson before building a packet.'); return }

    setRunning(true); setDone(false); setError(null); setSkippedNote([])
    const s = STEP_DEFS.map((d) => ({ ...d, state: 'pending' }))
    setSteps([...s])
    const mark = (i, state) => { s[i] = { ...s[i], state }; setSteps([...s]) }

    let materials = []
    const variants = {}
    const skipped = []
    let currentLo = lo

    // 1 — Teaching materials (Visual Teaching Resources). Empty is normal (not every
    // lesson references a buildable material) — that's a skip, not a failure.
    mark(0, 'running')
    try {
      const { visual_resources } = await generateVisualResources(savedId)
      materials = Array.isArray(visual_resources) ? visual_resources : []
      currentLo = { ...currentLo, visual_resources: materials }
      await updateLesson(savedId, { lessonObject: { visual_resources: materials } })
      mark(0, materials.length ? 'done' : 'skipped')
      if (!materials.length) skipped.push('teaching materials (none applicable)')
    } catch { mark(0, 'skipped'); skipped.push('teaching materials') }

    // 2 — Extension (advanced)
    mark(1, 'running')
    try {
      const r = await generateDifferentiatedLesson(savedId, 'advanced')
      variants.advanced = r?.differentiation?.advanced
      mark(1, variants.advanced ? 'done' : 'skipped')
      if (!variants.advanced) skipped.push('extension version')
    } catch { mark(1, 'skipped'); skipped.push('extension version') }

    // 3 — Modified (below grade)
    mark(2, 'running')
    try {
      const r = await generateDifferentiatedLesson(savedId, 'below_grade')
      variants.below_grade = r?.differentiation?.below_grade
      mark(2, variants.below_grade ? 'done' : 'skipped')
      if (!variants.below_grade) skipped.push('modified version')
    } catch { mark(2, 'skipped'); skipped.push('modified version') }

    // 4 — Assemble the packet (render hidden → serialize → download)
    mark(3, 'running')
    try {
      flushSync(() => setPacket({ lesson: currentLo, materials, variants, skipped }))
      const blocks = domToBlocks(packetRef.current)
      const base = (currentLo.title || 'lesson').replace(/\s+/g, '-').toLowerCase()
      await requestDocx({ filename: `${base}-teacher-packet`, title: `${currentLo.title || 'Lesson'} — Teacher Packet`, blocks })
      mark(3, 'done')
      setSkippedNote(skipped)
      setDone(true)
    } catch (err) {
      mark(3, 'skipped')
      if (err?.status === 403) openPaywall('docx-export')
      else setError(err?.message ?? 'Could not assemble the packet — please try again.')
    }
    setRunning(false)
  }

  return (
    <>
      <button onClick={run} disabled={running} className="btn-primary w-full sm:w-auto" title="Bundle the plan, a teaching view, materials, and modified/extension versions into one printable packet">
        {running ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
        Complete resource bundle
      </button>

      {(running || done || error) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Complete resource bundle progress">
          <div className="w-full max-w-sm rounded-xl2 border border-ink-800 bg-white p-6 shadow-lg dark:bg-ink-900">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-accent-500" />
              <h3 className="font-semibold text-ink-50">Complete Resource Bundle</h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              {steps.map((st, i) => (
                <li key={i} className={`flex items-center gap-2.5 text-sm ${st.state === 'skipped' ? 'text-ink-500' : 'text-ink-200'}`}>
                  <StepIcon state={st.state} />
                  {st.label}
                  {st.state === 'skipped' && <span className="text-xs text-amber-500">skipped</span>}
                </li>
              ))}
            </ul>

            {done && (
              <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                Packet downloaded.{skippedNote.length > 0 ? ` Left out: ${skippedNote.join(', ')}.` : ''}
              </div>
            )}
            {error && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

            {(done || error) && (
              <button onClick={reset} className="btn-secondary mt-4 w-full">
                <X size={14} /> Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden packet, rendered only for serialization. */}
      {packet && (
        <div className="hidden" aria-hidden="true">
          <TeacherPacketDoc innerRef={packetRef} {...packet} />
        </div>
      )}
    </>
  )
}
