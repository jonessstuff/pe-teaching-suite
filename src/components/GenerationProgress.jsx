import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

// Staged messaging for the generation wait.
//
// Generation is a SINGLE, non-streaming model call, so there is no real
// backend progress signal to read. These stages are therefore time-based —
// honest expectation-setting about the typical phases of a 1–2 minute wait,
// not a true progress bar. Past the platform's ~150s window we switch to a
// "taking longer" message so that if it does time out (surfaced separately as
// a clear, retryable error) the wait never feels like a silent freeze.
const STAGES = [
  { at: 0, msg: 'Warming up…' },
  { at: 6, msg: 'Designing your {label}…' },
  { at: 30, msg: 'Building the activities and structure…' },
  { at: 68, msg: 'Adding standards, differentiation & safety…' },
  { at: 108, msg: 'Almost there — finalizing the document…' },
  {
    at: 150,
    msg: 'This is a dense topic and taking longer than usual. Hang on — if it can’t finish, you’ll get a clear message and can retry.',
  },
]

export default function GenerationProgress({ loading, label = 'lesson', className = '' }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!loading) {
      setElapsed(0)
      return
    }
    const start = Date.now()
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(id)
  }, [loading])

  if (!loading) return null

  const stage = [...STAGES].reverse().find((s) => elapsed >= s.at) ?? STAGES[0]
  const msg = stage.msg.replace('{label}', label)
  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')

  return (
    <div className={`flex flex-col items-center gap-1 text-center ${className}`}>
      <p className="flex items-center justify-center gap-2 text-sm text-ink-300" role="status" aria-live="polite">
        <Loader2 size={14} className="animate-spin flex-shrink-0" />
        {msg}
      </p>
      <p className="text-xs text-ink-600">
        {mins}:{secs} elapsed · usually 1–2 minutes · don’t close this tab
      </p>
    </div>
  )
}
