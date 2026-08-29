import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, RotateCcw, X } from 'lucide-react'

const PHASES = [
  ['warm_up', 'Warm-Up'],
  ['fitness_activities', 'Fitness'],
  ['whole_group_instruction', 'Instruction & Skill'],
  ['independent_practice', 'Activity & Practice'],
  ['closure', 'Closure'],
]

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  return `${String(mins).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function TeachMode({ lesson, onClose }) {
  const phases = useMemo(() => PHASES
    .filter(([field]) => String(lesson?.[field] ?? '').trim())
    .map(([field, label]) => ({ field, label, content: lesson[field] })), [lesson])
  const [index, setIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    const keydown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(phases.length - 1, value + 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [onClose, phases.length])

  const phase = phases[index]
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-ink-950 text-ink-50" role="dialog" aria-modal="true" aria-label="Teach now">
      <header className="sticky top-0 z-10 border-b border-ink-800 bg-ink-950/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-400"><Maximize2 size={13} /> Teach now</p>
            <h1 className="truncate text-lg font-semibold sm:text-xl">{lesson?.title || 'Lesson'}</h1>
          </div>
          <button onClick={onClose} className="btn-secondary shrink-0"><X size={18} /> <span className="hidden sm:inline">Exit</span></button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-8 lg:grid-cols-[1fr_300px]">
        <section className="min-h-[55vh] rounded-2xl border border-ink-800 bg-ink-900 p-6 sm:p-10">
          {phase ? <>
            <p className="text-sm font-semibold text-accent-400">Step {index + 1} of {phases.length}</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-5xl">{phase.label}</h2>
            <div className="mt-7 whitespace-pre-wrap text-lg leading-relaxed text-ink-200 sm:text-2xl sm:leading-relaxed">{phase.content}</div>
          </> : <p className="text-xl text-ink-300">This lesson does not have timed teaching phases yet.</p>}
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-ink-800 pt-5">
            <button className="btn-secondary" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ChevronLeft size={18} /> Previous</button>
            <button className="btn-primary" disabled={index >= phases.length - 1} onClick={() => setIndex((value) => Math.min(phases.length - 1, value + 1))}>Next <ChevronRight size={18} /></button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-accent-500/30 bg-accent-500/10 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-accent-300">Class timer</p>
            <p className="my-3 font-mono text-5xl font-bold tabular-nums">{formatTime(seconds)}</p>
            <div className="flex justify-center gap-2">
              <button className="btn-primary" onClick={() => setRunning((value) => !value)}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pause' : 'Start'}</button>
              <button className="btn-secondary" onClick={() => { setRunning(false); setSeconds(0) }}><RotateCcw size={18} /></button>
            </div>
          </div>
          {(lesson?.equipment_needed ?? []).length > 0 && <div className="rounded-2xl border border-ink-800 bg-ink-900 p-5"><h3 className="font-semibold">Equipment</h3><p className="mt-2 text-sm leading-relaxed text-ink-300">{lesson.equipment_needed.join(' · ')}</p></div>}
          {(lesson?.safety_notes ?? []).length > 0 && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5"><h3 className="font-semibold text-amber-300">Safety</h3><ul className="mt-2 space-y-1 text-sm text-ink-200">{lesson.safety_notes.map((note, i) => <li key={i}>• {note}</li>)}</ul></div>}
        </aside>
      </main>
    </div>
  )
}
