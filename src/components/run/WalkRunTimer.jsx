import { useEffect, useMemo, useRef, useState } from 'react'
import { BellRing, Pause, Play, RotateCcw, SkipForward, TimerReset } from 'lucide-react'

function durationInSeconds(value, unit) {
  const amount = Number(value)
  return Math.round(unit.toLowerCase().startsWith('min') ? amount * 60 : amount)
}

function parseRecommendedIntervals(value) {
  const run = value?.match(/run\s+(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)/i)
  const walk = value?.match(/walk\s+(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)/i)
  const rounds = value?.match(/[×x]\s*(\d+)/i)
  if (!run || !walk || !rounds) return null
  return {
    runSeconds: durationInSeconds(run[1], run[2]),
    walkSeconds: durationInSeconds(walk[1], walk[2]),
    rounds: Number(rounds[1]),
  }
}

function clock(value) {
  const seconds = Math.max(0, Math.ceil(value / 1000))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function intervalLabel(runSeconds, walkSeconds, rounds) {
  const unit = (seconds) => seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} sec`
  return `Run ${unit(runSeconds)} / walk ${unit(walkSeconds)} × ${rounds}`
}

function nextTimerState(current, settings, now = Date.now()) {
  let next = { ...current }
  while (next.running && next.endsAt <= now) {
    if (next.phase === 'run' && settings.walkSeconds > 0) {
      next = { ...next, phase: 'walk', remainingMs: settings.walkSeconds * 1000, endsAt: next.endsAt + settings.walkSeconds * 1000 }
    } else if (next.round < settings.rounds) {
      next = { ...next, phase: 'run', round: next.round + 1, remainingMs: settings.runSeconds * 1000, endsAt: next.endsAt + settings.runSeconds * 1000 }
    } else {
      return { ...next, remainingMs: 0, running: false, complete: true, endsAt: null }
    }
  }
  return { ...next, remainingMs: Math.max(0, next.endsAt - now) }
}

function playCue(complete = false) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = complete ? 880 : 660
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (complete ? 0.35 : 0.2))
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + (complete ? 0.36 : 0.21))
    oscillator.addEventListener('ended', () => context.close())
  } catch {
    // Audio cues are optional; the visual timer still works if audio is blocked.
  }
  navigator.vibrate?.(complete ? [180, 100, 180] : 180)
}

export default function WalkRunTimer({ recommendedWorkout, onPatternSelected, onComplete }) {
  const recommendation = useMemo(() => parseRecommendedIntervals(recommendedWorkout), [recommendedWorkout])
  const [runSeconds, setRunSeconds] = useState(recommendation?.runSeconds ?? 30)
  const [walkSeconds, setWalkSeconds] = useState(recommendation?.walkSeconds ?? 90)
  const [rounds, setRounds] = useState(recommendation?.rounds ?? 8)
  const [timer, setTimer] = useState({ phase: 'run', round: 1, remainingMs: (recommendation?.runSeconds ?? 30) * 1000, running: false, complete: false, endsAt: null })
  const previousMarker = useRef('run-1-false')
  const settings = useMemo(() => ({ runSeconds, walkSeconds, rounds }), [runSeconds, walkSeconds, rounds])
  const totalSeconds = rounds * (runSeconds + walkSeconds)
  const phaseLabel = timer.complete ? 'Workout complete' : timer.phase === 'run' ? 'Run' : 'Walk'

  function reset(nextSettings = settings) {
    setTimer({ phase: 'run', round: 1, remainingMs: nextSettings.runSeconds * 1000, running: false, complete: false, endsAt: null })
  }

  function loadRecommendation() {
    if (!recommendation) return
    setRunSeconds(recommendation.runSeconds)
    setWalkSeconds(recommendation.walkSeconds)
    setRounds(recommendation.rounds)
    reset(recommendation)
    onPatternSelected?.(intervalLabel(recommendation.runSeconds, recommendation.walkSeconds, recommendation.rounds))
  }

  function updateSettings(field, rawValue) {
    const limits = field === 'rounds' ? [1, 50] : [5, 3600]
    const value = Math.min(limits[1], Math.max(limits[0], Number(rawValue) || limits[0]))
    const next = { ...settings, [field]: value }
    if (field === 'runSeconds') setRunSeconds(value)
    if (field === 'walkSeconds') setWalkSeconds(value)
    if (field === 'rounds') setRounds(value)
    reset(next)
  }

  function startOrPause() {
    if (timer.complete) {
      setTimer({ phase: 'run', round: 1, remainingMs: runSeconds * 1000, running: true, complete: false, endsAt: Date.now() + runSeconds * 1000 })
    } else if (timer.running) {
      setTimer((current) => ({ ...current, remainingMs: Math.max(0, current.endsAt - Date.now()), running: false, endsAt: null }))
    } else {
      setTimer((current) => ({ ...current, running: true, endsAt: Date.now() + current.remainingMs }))
    }
    onPatternSelected?.(intervalLabel(runSeconds, walkSeconds, rounds))
  }

  function skip() {
    setTimer((current) => {
      if (current.complete) return current
      if (current.phase === 'run' && walkSeconds > 0) return { ...current, phase: 'walk', remainingMs: walkSeconds * 1000, endsAt: current.running ? Date.now() + walkSeconds * 1000 : null }
      if (current.round < rounds) return { ...current, phase: 'run', round: current.round + 1, remainingMs: runSeconds * 1000, endsAt: current.running ? Date.now() + runSeconds * 1000 : null }
      return { ...current, remainingMs: 0, running: false, complete: true, endsAt: null }
    })
  }

  useEffect(() => {
    if (!timer.running) return undefined
    const interval = window.setInterval(() => setTimer((current) => current.running ? nextTimerState(current, settings) : current), 200)
    return () => window.clearInterval(interval)
  }, [settings, timer.running])

  useEffect(() => {
    const marker = `${timer.phase}-${timer.round}-${timer.complete}`
    if (marker !== previousMarker.current) {
      playCue(timer.complete)
      if (timer.complete) onComplete?.(totalSeconds * 1000)
      previousMarker.current = marker
    }
  }, [onComplete, timer.complete, timer.phase, timer.round, totalSeconds])

  return <section className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-teal-500/5 to-transparent p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500"><TimerReset size={21} /></span><div><h3 className="font-semibold">Walk / run interval timer</h3><p className="mt-0.5 text-xs text-ink-500">Use sound and vibration cues so you do not have to watch the clock.</p></div></div>
      {recommendation && <button type="button" onClick={loadRecommendation} disabled={timer.running} className="btn-secondary min-h-10 text-xs"><BellRing size={15} /> Load today&rsquo;s intervals</button>}
    </div>

    {!recommendation && <p className="mt-3 rounded-lg border border-ink-800 bg-white/50 px-3 py-2 text-xs text-ink-500 dark:bg-ink-950/30">Today&rsquo;s recommendation is distance-based. Set any comfortable timed pattern below, or walk/run continuously and use your watch for total time.</p>}

    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] lg:items-center">
      <div className={`rounded-2xl border p-5 text-center ${timer.complete ? 'border-emerald-500/35 bg-emerald-500/10' : timer.phase === 'run' ? 'border-sky-500/30 bg-sky-500/10' : 'border-teal-500/30 bg-teal-500/10'}`}>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-ink-500">{timer.complete ? `${rounds} rounds finished` : `Round ${timer.round} of ${rounds}`}</p>
        <p className="mt-2 text-2xl font-black text-ink-100">{phaseLabel}</p>
        <p aria-live="polite" className="mt-1 font-mono text-5xl font-black tabular-nums text-ink-50">{clock(timer.remainingMs)}</p>
        {!timer.complete && <p className="mt-2 text-xs text-ink-500">Next: {timer.phase === 'run' && walkSeconds > 0 ? `Walk ${clock(walkSeconds * 1000)}` : timer.round < rounds ? `Run ${clock(runSeconds * 1000)}` : 'Finish'}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" onClick={startOrPause} className="btn-primary min-h-11">{timer.running ? <Pause size={17} /> : <Play size={17} />}{timer.running ? 'Pause' : timer.complete ? 'Start again' : 'Start'}</button><button type="button" onClick={skip} disabled={timer.complete} className="btn-secondary min-h-11"><SkipForward size={17} /> Skip</button><button type="button" onClick={() => reset()} className="btn-secondary min-h-11"><RotateCcw size={17} /> Reset</button></div>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-2"><label className="text-xs font-medium text-ink-500">Run seconds<input type="number" min="5" max="3600" step="5" value={runSeconds} disabled={timer.running} onChange={(event) => updateSettings('runSeconds', event.target.value)} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Walk seconds<input type="number" min="5" max="3600" step="5" value={walkSeconds} disabled={timer.running} onChange={(event) => updateSettings('walkSeconds', event.target.value)} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Rounds<input type="number" min="1" max="50" value={rounds} disabled={timer.running} onChange={(event) => updateSettings('rounds', event.target.value)} className="input-field mt-1" /></label></div>
        <p className="mt-3 text-sm font-semibold text-ink-300">{intervalLabel(runSeconds, walkSeconds, rounds)}</p>
        <p className="mt-1 text-xs text-ink-500">About {clock(totalSeconds * 1000)} of intervals, plus your warm-up and cool-down. Keep this page open while the timer runs.</p>
      </div>
    </div>
  </section>
}
