import { useEffect, useMemo, useState } from 'react'
import { Brain, Check, CircleStop, Leaf, Play, RefreshCw, Sparkles } from 'lucide-react'
import { trackToolUsage } from '../../services/productUsageService'

const DAILY_IDEAS = [
  { title: 'Choose tomorrow’s first step', text: 'Write down the one task you will begin with tomorrow. Let the rest wait until then.' },
  { title: 'Take a quiet transition walk', text: 'Walk for five minutes without checking your phone. Let the school day end before the evening begins.' },
  { title: 'Notice one thing that worked', text: 'Name one moment that went better than expected today—even if it was small.' },
  { title: 'Release the teacher shoulders', text: 'Unclench your jaw, lower your shoulders, and soften your hands each time you pass through a doorway.' },
  { title: 'Create an end-of-day boundary', text: 'Choose a stopping time for schoolwork tonight and protect one small part of the evening for yourself.' },
  { title: 'Clear one small surface', text: 'Reset only one desk corner, counter, or bag. A tiny visible finish can help the day feel complete.' },
  { title: 'Use your senses to arrive home', text: 'Pause and notice five things you see, four you feel, three you hear, two you smell, and one you taste.' },
]

const STRETCHES = [
  { name: 'Shoulder rolls', direction: 'Slowly roll both shoulders back 5 times, then forward 5 times.' },
  { name: 'Wrist reset', direction: 'Extend one arm and gently draw the fingers back. Switch sides after 15 seconds.' },
  { name: 'Standing side reach', direction: 'Reach one arm overhead and lean gently to the opposite side. Switch after 15 seconds.' },
]

function localDateValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export default function DailyStressReset() {
  const today = localDateValue()
  const dayNumber = Math.floor(new Date(`${today}T12:00:00`).getTime() / 86_400_000)
  const dailyIdea = DAILY_IDEAS[dayNumber % DAILY_IDEAS.length]
  const storageKey = `plansk12_stress_reset_${today}`
  const [ideaDone, setIdeaDone] = useState(() => {
    try { return window.localStorage.getItem(storageKey) === 'done' } catch { return false }
  })
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [breathing, setBreathing] = useState(false)

  useEffect(() => {
    if (!breathing) return undefined
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setBreathing(false)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [breathing])

  const breathPhase = useMemo(() => {
    if (!breathing) return secondsLeft === 0 ? 'Complete' : 'Ready when you are'
    const elapsedInCycle = (60 - secondsLeft) % 10
    return elapsedInCycle < 4 ? 'Breathe in gently' : 'Breathe out slowly'
  }, [breathing, secondsLeft])
  const inhaling = breathing && (60 - secondsLeft) % 10 < 4

  function startBreathing() {
    setSecondsLeft(60)
    setBreathing(true)
    void trackToolUsage('teacher-stress-reset', 'breathing_started', { moduleLabel: 'Teacher Health & Wellness' })
  }

  function stopBreathing() {
    setBreathing(false)
    setSecondsLeft(60)
  }

  function toggleIdea() {
    const next = !ideaDone
    setIdeaDone(next)
    try {
      if (next) window.localStorage.setItem(storageKey, 'done')
      else window.localStorage.removeItem(storageKey)
    } catch {
      // The reset remains usable when browser storage is unavailable.
    }
    if (next) void trackToolUsage('teacher-stress-reset', 'daily_idea_completed', { moduleLabel: 'Teacher Health & Wellness' })
  }

  return <section className="card overflow-hidden">
    <div className="border-b border-ink-800 bg-gradient-to-r from-violet-500/10 via-sky-500/5 to-transparent p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400"><Brain size={22} /></span>
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-400">A few minutes just for you</p><h2 className="mt-1 text-xl font-bold">Daily Stress Reset</h2><p className="mt-1 text-sm text-ink-500">Choose one small reset at the end of the school day. You do not have to complete everything.</p></div>
      </div>
    </div>

    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4">
        <div className="flex items-center gap-2 text-teal-400"><Sparkles size={17} /><p className="text-xs font-bold uppercase tracking-wide">Today’s simple idea</p></div>
        <h3 className="mt-3 font-bold text-ink-100">{dailyIdea.title}</h3>
        <p className="mt-2 text-sm leading-6 text-ink-500">{dailyIdea.text}</p>
        <button type="button" onClick={toggleIdea} className={`mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${ideaDone ? 'bg-emerald-500/15 text-emerald-400' : 'bg-ink-800 text-ink-300 hover:text-ink-100'}`}>
          {ideaDone ? <Check size={16} /> : <Leaf size={16} />}{ideaDone ? 'Done for today' : 'Mark as done'}
        </button>
      </article>

      <article className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-400">One-minute breathing reset</p>
        <div className="mt-4 flex justify-center">
          <div className={`flex h-28 w-28 items-center justify-center rounded-full border-2 border-sky-400/50 bg-sky-500/10 transition-transform ${inhaling ? 'scale-110 duration-[4000ms]' : 'scale-90 duration-[6000ms]'}`}>
            <div><p className="text-2xl font-bold tabular-nums">{secondsLeft}s</p><p className="mt-1 text-[11px] text-ink-500">{breathPhase}</p></div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-500">Breathe in comfortably for 4 seconds and out slowly for 6. Do not force the breath.</p>
        <button type="button" onClick={breathing ? stopBreathing : startBreathing} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-bold text-white hover:bg-sky-400">
          {breathing ? <><CircleStop size={16} /> Stop</> : secondsLeft === 0 ? <><RefreshCw size={16} /> Do it again</> : <><Play size={16} /> Begin</>}
        </button>
      </article>

      <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">Two-minute desk-body reset</p>
        <ol className="mt-3 space-y-3">
          {STRETCHES.map((stretch, index) => <li key={stretch.name} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">{index + 1}</span><span><span className="block text-sm font-semibold text-ink-200">{stretch.name}</span><span className="mt-0.5 block text-xs leading-5 text-ink-500">{stretch.direction}</span></span></li>)}
        </ol>
      </article>
    </div>

    <p className="border-t border-ink-800 px-5 py-3 text-xs leading-5 text-ink-500 sm:px-6">Wellness note: Keep breathing and movement comfortable. Stop if you feel pain, dizziness, or shortness of breath. These general ideas are not medical care.</p>
  </section>
}
