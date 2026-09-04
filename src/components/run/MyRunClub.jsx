import { useEffect, useMemo, useState } from 'react'
import { Activity, CalendarDays, Footprints, HeartPulse, Loader2, Plus, ShieldCheck, Target, Trash2, Trophy } from 'lucide-react'
import { formatRunTime, parseRunTime } from '../../lib/runTracker'
import { trackToolUsage } from '../../services/productUsageService'

const BASE_WORKOUTS = [
  ['30-second intervals', 'Run 30 sec / walk 90 sec × 8', 'Walk easily for 5 minutes, complete 8 intervals, then cool down with a 5-minute walk.'],
  ['One-minute intervals', 'Run 1 min / walk 90 sec × 8', 'Walk easily for 5 minutes, complete 8 intervals, then cool down with a 5-minute walk.'],
  ['90-second intervals', 'Run 90 sec / walk 90 sec × 7', 'Keep every run comfortable enough that you could speak a short sentence.'],
  ['Two-minute intervals', 'Run 2 min / walk 90 sec × 6', 'Use the walk breaks fully. The final interval should feel controlled, not exhausting.'],
  ['Three-minute intervals', 'Run 3 min / walk 90 sec × 5', 'Maintain an easy pace and finish with a 5-minute cooldown walk.'],
  ['Five-minute intervals', 'Run 5 min / walk 2 min × 4', 'Slow the running pace if needed so all four intervals feel steady.'],
  ['Eight-minute intervals', 'Run 8 min / walk 2 min × 3', 'Focus on relaxed breathing and an easy, repeatable pace.'],
  ['Ten-minute intervals', 'Run 10 min / walk 90 sec × 3', 'Complete three controlled running blocks with short recovery walks.'],
].map(([title, short, details], index) => ({ title, short, details, startAtMiles: [0, 0.1, 0.15, 0.25, 0.4, 0.6, 0.8, 1][index] }))

function localDateValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function dateWeeksFromNow(weeks) {
  const date = new Date()
  date.setDate(date.getDate() + (weeks * 7))
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function readableDate(value) {
  if (!value) return 'No date selected'
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function displayNumber(value, digits = 2) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })
}

function startOfCurrentWeek() {
  const today = new Date()
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset)
  return new Date(monday.getTime() - monday.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function distanceWorkouts(goalDistance, currentDistance, movementStyle) {
  const goal = Number(goalDistance) || 3.1
  let distance = Math.max(0, Number(currentDistance) || 0)
  if (distance >= goal) {
    const action = movementStyle === 'walk' ? 'Walk' : movementStyle === 'run' ? 'Run' : 'Run/walk'
    return [{ title: `Comfortable ${displayNumber(goal)}-mile repeat`, short: `${action} ${displayNumber(goal)} ${goal === 1 ? 'mile' : 'miles'}`, details: 'Repeat the goal distance comfortably and finish feeling able to do a little more.' }]
  }
  const workouts = []
  while (distance < goal && workouts.length < 80) {
    const step = distance < 1 ? 0.1 : distance < 2 ? 0.25 : 0.5
    distance = Math.min(goal, Math.max(distance + step, 0.1))
    const label = `${displayNumber(distance)} ${distance === 1 ? 'mile' : 'miles'}`
    const action = movementStyle === 'walk' ? 'Walk' : movementStyle === 'run' ? 'Run' : 'Run/walk'
    workouts.push({
      title: `${action} ${label}`,
      short: `${action} ${label} at an easy to moderate effort`,
      details: movementStyle === 'walk' ? 'Use a comfortable walking pace and take a brief rest if needed.' : movementStyle === 'run' ? 'Use an easy pace that feels repeatable. Walking breaks are always allowed.' : 'Use comfortable run/walk intervals and keep the final interval controlled.',
    })
  }
  return workouts
}

function workoutsFor(goalDistance, movementStyle = 'run-walk', currentDistance = 0) {
  if (movementStyle === 'walk' || movementStyle === 'run') return distanceWorkouts(goalDistance, currentDistance, movementStyle)
  const goal = Number(goalDistance) || 3.1
  const current = Number(currentDistance) || 0
  const foundational = BASE_WORKOUTS.filter((workout) => workout.startAtMiles < goal && workout.startAtMiles >= current * 0.75)
  return [...foundational, ...distanceWorkouts(goal, Math.max(current, 1), 'run-walk')]
}

function trainingFor(runs, goalDistance, movementStyle, currentDistance) {
  const workouts = workoutsFor(goalDistance, movementStyle, currentDistance)
  let stageIndex = 0
  let successesAtStage = 0
  for (const run of [...runs].reverse()) {
    if (!run.followed_suggested_plan || stageIndex >= workouts.length) continue
    if (run.pain_reported || run.effort_rating === 'hard') {
      successesAtStage = 0
      continue
    }
    successesAtStage += 1
    if (successesAtStage === 3) {
      stageIndex += 1
      successesAtStage = 0
    }
  }

  const complete = stageIndex >= workouts.length
  const workout = workouts[Math.min(stageIndex, workouts.length - 1)]
  const latest = runs[0]
  let status = complete ? 'Goal reached — maintain comfortably' : 'Your next workout'
  let guidance = complete ? 'Repeat the goal distance comfortably before deciding whether to choose a new goal.' : `${workout.details} Complete this step three times without pain at an easy or moderate effort before advancing.`
  if (latest?.followed_suggested_plan && latest.pain_reported) {
    status = 'Recovery — do not advance'
    guidance = 'Pain was reported. Rest or modify activity and restart this step only when pain-free. Persistent, severe, or worsening pain should be discussed with a healthcare professional.'
  } else if (latest?.followed_suggested_plan && latest.effort_rating === 'hard') {
    status = 'Repeat this workout'
    guidance = 'The latest effort felt hard, so remain at this step. Slow the running pace or extend the walk breaks rather than advancing.'
  }
  return { workout, stage: Math.min(stageIndex + 1, workouts.length), totalStages: workouts.length, session: complete ? 3 : successesAtStage + 1, complete, status, guidance }
}

function scheduleFor(training, goalDistance, movementStyle, currentDistance, activityDaysPerWeek, targetDate) {
  const workouts = workoutsFor(goalDistance, movementStyle, currentDistance)
  const upcoming = []
  let stageIndex = Math.max(0, training.stage - 1)
  let session = training.session
  while (!training.complete && stageIndex < workouts.length) {
    upcoming.push({ stage: stageIndex + 1, session, workout: workouts[stageIndex] })
    session += 1
    if (session > 3) { stageIndex += 1; session = 1 }
  }
  const selectedDays = Number(activityDaysPerWeek) || 3
  const perWeek = movementStyle === 'walk' ? selectedDays : Math.min(3, selectedDays)
  const weeks = []
  for (let index = 0; index < upcoming.length; index += perWeek) weeks.push(upcoming.slice(index, index + perWeek))

  const today = new Date(`${localDateValue()}T12:00:00`)
  const goalDay = targetDate ? new Date(`${targetDate}T12:00:00`) : null
  const availableWeeks = goalDay ? Math.max(0, Math.ceil((goalDay - today) / (7 * 86_400_000))) : 0
  const recommendedDate = new Date(today)
  recommendedDate.setDate(recommendedDate.getDate() + weeks.length * 7)
  const recommendedDateValue = new Date(recommendedDate.getTime() - recommendedDate.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
  const onTrack = training.complete || !!(goalDay && availableWeeks >= weeks.length)
  return { weeks, availableWeeks, recommendedDateValue, onTrack, bufferWeeks: Math.max(0, availableWeeks - weeks.length), progressionDays: perWeek, extraEasyDays: Math.max(0, selectedDays - perWeek) }
}

export default function MyRunClub({ createPersonalRun, deletePersonalRun, getPersonalRunPlan, listPersonalRuns, savePersonalRunPlan }) {
  const [runs, setRuns] = useState(null)
  const [goalDistance, setGoalDistance] = useState(3.1)
  const [goalChoice, setGoalChoice] = useState('5k')
  const [customGoal, setCustomGoal] = useState('')
  const [movementStyle, setMovementStyle] = useState('run-walk')
  const [currentDistance, setCurrentDistance] = useState('0')
  const [targetDate, setTargetDate] = useState(() => dateWeeksFromNow(12))
  const [activityDaysPerWeek, setActivityDaysPerWeek] = useState(3)
  const [planStartedAt, setPlanStartedAt] = useState(null)
  const [savingGoal, setSavingGoal] = useState(false)
  const [runDate, setRunDate] = useState(localDateValue)
  const [totalDistance, setTotalDistance] = useState('1')
  const [intervals, setIntervals] = useState(BASE_WORKOUTS[0].short)
  const [runningTime, setRunningTime] = useState('')
  const [longestContinuous, setLongestContinuous] = useState('')
  const [effort, setEffort] = useState('moderate')
  const [followedPlan, setFollowedPlan] = useState(true)
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [pain, setPain] = useState(false)
  const [painNotes, setPainNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    Promise.all([listPersonalRuns(), getPersonalRunPlan()]).then(([savedRuns, plan]) => {
      setRuns(savedRuns)
      const distance = plan ? Number(plan.goal_distance_miles) : 3.1
      const style = plan?.movement_style || 'run-walk'
      const startingDistance = Number(plan?.current_continuous_miles) || 0
      setIntervals(trainingFor(savedRuns, distance, style, startingDistance).workout.short)
      if (!plan) return
      setGoalDistance(distance)
      setMovementStyle(style)
      setCurrentDistance(String(startingDistance))
      setTargetDate(plan.target_date || dateWeeksFromNow(12))
      setActivityDaysPerWeek(Number(plan.activity_days_per_week) || 3)
      setPlanStartedAt(plan.updated_at || null)
      if (Math.abs(distance - 1) < 0.01) setGoalChoice('mile')
      else if (Math.abs(distance - 3.1) < 0.01) setGoalChoice('5k')
      else { setGoalChoice('custom'); setCustomGoal(String(distance)) }
    }).catch((error) => setMessage({ type: 'error', text: error.message ?? 'Could not load your running progress.' }))
  }, [getPersonalRunPlan, listPersonalRuns])

  const currentPlanRuns = useMemo(() => planStartedAt ? (runs ?? []).filter((run) => !run.created_at || run.created_at >= planStartedAt) : (runs ?? []), [runs, planStartedAt])
  const training = useMemo(() => trainingFor(currentPlanRuns, goalDistance, movementStyle, Number(currentDistance) || 0), [currentPlanRuns, goalDistance, movementStyle, currentDistance])
  const schedule = useMemo(() => scheduleFor(training, goalDistance, movementStyle, Number(currentDistance) || 0, activityDaysPerWeek, targetDate), [training, goalDistance, movementStyle, currentDistance, activityDaysPerWeek, targetDate])

  const stats = useMemo(() => {
    if (!runs?.length) return null
    return {
      totalMiles: runs.reduce((sum, run) => sum + Number(run.total_distance_miles || 0), 0),
      bestContinuous: Math.max(...runs.map((run) => Number(run.longest_continuous_miles || 0))),
      weekMiles: runs.filter((run) => run.run_date >= startOfCurrentWeek()).reduce((sum, run) => sum + Number(run.total_distance_miles || 0), 0),
    }
  }, [runs])
  const goalPercent = Math.min(100, Math.round(((stats?.bestContinuous ?? 0) / goalDistance) * 100))

  async function updateGoal() {
    const distance = goalChoice === 'mile' ? 1 : goalChoice === '5k' ? 3.1 : Number(customGoal)
    const startingDistance = Number(currentDistance)
    if (!distance || distance < 0.25 || distance > 26.2) {
      setMessage({ type: 'error', text: 'Choose a goal from 0.25 through 26.2 miles.' })
      return
    }
    if (Number.isNaN(startingDistance) || startingDistance < 0 || startingDistance > 26.2) {
      setMessage({ type: 'error', text: 'Enter your current comfortable distance from 0 through 26.2 miles.' })
      return
    }
    if (!targetDate || targetDate < localDateValue()) {
      setMessage({ type: 'error', text: 'Choose today or a future date for your goal.' })
      return
    }
    setSavingGoal(true); setMessage(null)
    try {
      const savedPlan = await savePersonalRunPlan({ goalDistanceMiles: distance, goalLabel: goalChoice === 'mile' ? '1 Mile' : goalChoice === '5k' ? '5K' : `${displayNumber(distance)} Miles`, movementStyle, currentContinuousMiles: startingDistance, targetDate, activityDaysPerWeek })
      setGoalDistance(distance)
      setPlanStartedAt(savedPlan.updated_at || new Date().toISOString())
      setIntervals(trainingFor([], distance, movementStyle, startingDistance).workout.short)
      setMessage({ type: 'success', text: 'Your personalized walking or running plan has been built.' })
    } catch (error) { setMessage({ type: 'error', text: error.message ?? 'Could not update your goal.' }) }
    finally { setSavingGoal(false) }
  }

  async function addRun(event) {
    event.preventDefault()
    const totalRunningMs = parseRunTime(runningTime)
    const distanceMiles = Number(totalDistance)
    const continuousMiles = Number(longestContinuous)
    if (!runDate || !distanceMiles || distanceMiles <= 0 || !totalRunningMs || !continuousMiles || continuousMiles <= 0 || continuousMiles > distanceMiles) {
      setMessage({ type: 'error', text: 'Enter the date, total distance, running time, and a continuous distance no greater than the total.' })
      return
    }
    setSaving(true); setMessage(null)
    try {
      const saved = await createPersonalRun({
        runDate, totalDistanceMiles: distanceMiles, intervalsUsed: intervals,
        totalRunningMs, longestContinuousMiles: continuousMiles, effortRating: effort,
        followedSuggestedPlan: followedPlan, weightLbs: weight ? Number(weight) : null,
        waistInches: waist ? Number(waist) : null, painReported: pain, painNotes,
      })
      const nextRuns = [saved, ...(runs ?? [])].sort((a, b) => `${b.run_date}${b.created_at}`.localeCompare(`${a.run_date}${a.created_at}`))
      setRuns(nextRuns)
      const nextPlanRuns = planStartedAt ? nextRuns.filter((run) => !run.created_at || run.created_at >= planStartedAt) : nextRuns
      setIntervals(trainingFor(nextPlanRuns, goalDistance, movementStyle, Number(currentDistance) || 0).workout.short)
      setRunningTime(''); setLongestContinuous(''); setPain(false); setPainNotes('')
      setMessage({ type: 'success', text: pain ? 'Run saved. Pain was reported, so the plan will not advance.' : 'Run saved. Your next-workout recommendation has been updated.' })
      void trackToolUsage('teacher-running-progress', 'created', { moduleLabel: 'Teacher Health & Wellness', metadata: { source: 'progressive-run-plan' } })
    } catch (error) { setMessage({ type: 'error', text: error.message ?? 'Could not save your run.' }) }
    finally { setSaving(false) }
  }

  async function removeRun(run) {
    if (!window.confirm(`Remove your ${displayNumber(run.total_distance_miles)} mile entry from ${new Date(`${run.run_date}T12:00:00`).toLocaleDateString()}?`)) return
    try { await deletePersonalRun(run.id); setRuns((items) => items.filter((item) => item.id !== run.id)); setMessage({ type: 'success', text: 'Run removed.' }) }
    catch (error) { setMessage({ type: 'error', text: error.message ?? 'Could not remove that run.' }) }
  }

  return <section className="card overflow-hidden">
    <div className="border-b border-ink-800 bg-gradient-to-r from-accent-500/15 to-transparent p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15"><Footprints size={21} className="text-accent-600" /></div><div><h2 className="text-lg font-semibold">My Walking &amp; Running Progress</h2><p className="text-sm text-ink-500">A private plan built around where you are now and where you want to go.</p></div></div><span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-700"><ShieldCheck size={14} /> Private to you</span></div></div>

    <div className="space-y-5 p-5 sm:p-6">
      {runs == null ? <p className="flex items-center gap-2 text-sm text-ink-500"><Loader2 size={16} className="animate-spin" /> Loading your progress…</p> : <>
        <div className="rounded-xl border border-ink-800 p-4">
          <div className="flex items-center gap-2"><Target size={18} className="text-accent-600" /><div><h3 className="font-semibold">Build your personal goal</h3><p className="mt-0.5 text-xs text-ink-500">Walking-only goals are fully supported. You never have to choose running.</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-medium text-ink-500">How do you want to move?<select value={movementStyle} onChange={(event) => setMovementStyle(event.target.value)} className="input-field mt-1"><option value="walk">Walk only</option><option value="run-walk">Run/walk intervals</option><option value="run">Run—with walking allowed</option></select></label>
            <label className="text-xs font-medium text-ink-500">Comfortable distance now<input type="number" min="0" max="26.2" step="0.1" value={currentDistance} onChange={(event) => setCurrentDistance(event.target.value)} className="input-field mt-1" /><span className="mt-1 block font-normal">Miles without pushing</span></label>
            <label className="text-xs font-medium text-ink-500">Goal distance<select value={goalChoice} onChange={(event) => setGoalChoice(event.target.value)} className="input-field mt-1"><option value="mile">1 mile</option><option value="5k">5K (3.1 miles)</option><option value="custom">Custom distance</option></select></label>
            {goalChoice === 'custom' ? <label className="text-xs font-medium text-ink-500">Custom goal miles<input type="number" min="0.25" max="26.2" step="0.1" value={customGoal} onChange={(event) => setCustomGoal(event.target.value)} placeholder="2" className="input-field mt-1" /></label> : <label className="text-xs font-medium text-ink-500">When do you want to reach it?<input type="date" min={localDateValue()} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="input-field mt-1" /></label>}
            {goalChoice === 'custom' && <label className="text-xs font-medium text-ink-500">When do you want to reach it?<input type="date" min={localDateValue()} value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="input-field mt-1" /></label>}
            <label className="text-xs font-medium text-ink-500">Movement days each week<select value={activityDaysPerWeek} onChange={(event) => setActivityDaysPerWeek(Number(event.target.value))} className="input-field mt-1">{[2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label>
          </div>
          <button type="button" onClick={updateGoal} disabled={savingGoal} className="btn-primary mt-4 min-h-11">{savingGoal ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />} Build my plan</button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><div className="rounded-xl border border-ink-800 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">This week</p><p className="mt-1 text-2xl font-bold">{displayNumber(stats?.weekMiles ?? 0)} mi</p></div><div className="rounded-xl border border-ink-800 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">All-time distance</p><p className="mt-1 text-2xl font-bold">{displayNumber(stats?.totalMiles ?? 0)} mi</p></div><div className="rounded-xl border border-ink-800 p-3"><p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500"><Trophy size={13} /> Longest continuous</p><p className="mt-1 text-2xl font-bold text-green-600">{displayNumber(stats?.bestContinuous ?? 0)} mi</p></div><div className="rounded-xl border border-ink-800 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Goal progress</p><p className="mt-1 text-2xl font-bold">{goalPercent}%</p></div></div>

        <div className={`rounded-xl border p-4 ${training.status.includes('do not advance') ? 'border-amber-500/40 bg-amber-500/10' : 'border-accent-500/30 bg-accent-500/10'}`}><div className="flex items-start gap-3"><HeartPulse size={20} className={training.status.includes('do not advance') ? 'mt-0.5 text-amber-600' : 'mt-0.5 text-accent-600'} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wide text-ink-500">Step {training.stage} of {training.totalStages} · Workout {training.session} of 3</p><h3 className="mt-1 font-semibold">{training.status}: {training.workout.title}</h3></div><span className="rounded-full bg-white/60 px-2.5 py-1 text-xs font-bold dark:bg-ink-950/40">Goal {displayNumber(goalDistance)} mi</span></div><p className="mt-2 text-base font-semibold text-accent-700">{training.workout.short}</p><p className="mt-1 text-sm text-ink-400">{training.guidance}</p></div></div></div>

        <div className={`rounded-xl border p-4 ${schedule.onTrack ? 'border-teal-500/25 bg-teal-500/5' : 'border-amber-500/35 bg-amber-500/10'}`}>
          <div className="flex items-start gap-3"><CalendarDays size={19} className={schedule.onTrack ? 'mt-0.5 text-teal-400' : 'mt-0.5 text-amber-500'} /><div className="min-w-0 flex-1"><h3 className="font-semibold">Your generated progression</h3><p className="mt-1 text-sm leading-6 text-ink-500">{schedule.weeks.length ? `${schedule.weeks.length} estimated weeks · ${schedule.progressionDays} progression ${schedule.progressionDays === 1 ? 'day' : 'days'} per week · goal date ${readableDate(targetDate)}.` : `You already meet the distance you entered. Repeat it comfortably before increasing the goal.`}</p>
            {!schedule.onTrack && <p className="mt-2 text-sm font-semibold text-amber-600">Your chosen date allows about {schedule.availableWeeks} weeks. A gradual progression needs about {schedule.weeks.length}; consider {readableDate(schedule.recommendedDateValue)} or later.</p>}
            {schedule.onTrack && schedule.bufferWeeks > 0 && <p className="mt-2 text-sm text-teal-600">You have about {schedule.bufferWeeks} buffer {schedule.bufferWeeks === 1 ? 'week' : 'weeks'} for repeats, missed days, or recovery.</p>}
            {schedule.extraEasyDays > 0 && <p className="mt-2 text-xs leading-5 text-ink-500">Your other {schedule.extraEasyDays} selected movement {schedule.extraEasyDays === 1 ? 'day is' : 'days are'} optional easy walking or recovery—not additional progression runs.</p>}
            {!!schedule.weeks.length && <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-accent-600">View the full generated plan</summary><div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">{schedule.weeks.map((week, weekIndex) => <div key={weekIndex} className="rounded-lg border border-ink-800 bg-ink-950/25 p-3"><p className="text-xs font-bold uppercase tracking-wide text-ink-500">Week {weekIndex + 1}</p><ul className="mt-1.5 space-y-1">{week.map((item, sessionIndex) => <li key={`${item.stage}-${item.session}-${sessionIndex}`} className="text-xs leading-5 text-ink-400">Day {sessionIndex + 1}: {item.workout.short}</li>)}</ul></div>)}</div></details>}
          </div></div>
        </div>

        <form onSubmit={addRun} className="rounded-xl bg-ink-900/40 p-4"><h3 className="font-semibold">Log today’s walk or run</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-medium text-ink-500">Date<input type="date" max={localDateValue()} value={runDate} onChange={(event) => setRunDate(event.target.value)} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Total distance (miles)<input type="number" min="0.01" step="0.01" value={totalDistance} onChange={(event) => setTotalDistance(event.target.value)} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Total movement time<input value={runningTime} onChange={(event) => setRunningTime(event.target.value)} inputMode="decimal" placeholder="20:00" className="input-field mt-1 font-mono" /></label><label className="text-xs font-medium text-ink-500">Longest continuous distance<input type="number" min="0.01" step="0.01" max={totalDistance || undefined} value={longestContinuous} onChange={(event) => setLongestContinuous(event.target.value)} placeholder="0.5" className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500 sm:col-span-2">Walking/running pattern used<input value={intervals} onChange={(event) => setIntervals(event.target.value)} maxLength={160} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Effort rating<select value={effort} onChange={(event) => setEffort(event.target.value)} className="input-field mt-1"><option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option></select></label><label className="flex items-center gap-2 self-end rounded-xl border border-ink-800 px-3 py-3 text-sm font-semibold text-ink-300"><input type="checkbox" checked={pain} onChange={(event) => setPain(event.target.checked)} className="h-5 w-5 accent-red-500" /> Pain reported</label><label className="flex items-center gap-2 rounded-xl border border-ink-800 px-3 py-3 text-sm font-semibold text-ink-300 sm:col-span-2"><input type="checkbox" checked={followedPlan} onChange={(event) => setFollowedPlan(event.target.checked)} className="h-5 w-5 accent-accent-600" /> I followed the suggested workout</label><label className="text-xs font-medium text-ink-500">Weight (lb) <span className="font-normal">optional</span><input type="number" min="1" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Waist (inches) <span className="font-normal">optional</span><input type="number" min="1" step="0.1" value={waist} onChange={(event) => setWaist(event.target.value)} className="input-field mt-1" /></label>{pain && <label className="text-xs font-medium text-ink-500 sm:col-span-2">Pain notes<input value={painNotes} onChange={(event) => setPainNotes(event.target.value)} maxLength={240} placeholder="Where and when did it hurt?" className="input-field mt-1" /></label>}</div><button type="submit" disabled={saving} className="btn-primary mt-4 min-h-11">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save my workout</button></form>

        {message && <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-green-500/30 bg-green-500/10 text-green-700'}`}>{message.text}</p>}

        <div><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Recent workouts</h3>{runs.length > 5 && <span className="text-xs text-ink-500">Latest 5</span>}</div>{!runs.length ? <div className="mt-3 rounded-xl border border-dashed border-ink-700 p-5 text-center text-sm text-ink-500">Your first entry will establish your starting point.</div> : <div className="mt-3 divide-y divide-ink-800 rounded-xl border border-ink-800">{runs.slice(0, 5).map((run) => <div key={run.id} className="flex items-center gap-3 p-3"><Activity size={17} className="shrink-0 text-accent-600" /><div className="min-w-0 flex-1"><p className="font-semibold">{displayNumber(run.total_distance_miles)} mi total · {displayNumber(run.longest_continuous_miles)} mi continuous</p><p className="truncate text-xs text-ink-500">{new Date(`${run.run_date}T12:00:00`).toLocaleDateString()} · {formatRunTime(run.total_running_ms, { tenths: false })} running · {run.effort_rating}{run.intervals_used ? ` · ${run.intervals_used}` : ''}{run.weight_lbs ? ` · ${displayNumber(run.weight_lbs, 1)} lb` : ''}{run.waist_inches ? ` · ${displayNumber(run.waist_inches, 1)} in waist` : ''}{run.pain_reported ? ' · Pain reported' : ''}</p></div><button type="button" onClick={() => removeRun(run)} aria-label={`Remove run from ${run.run_date}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-500 hover:bg-red-500/10 hover:text-red-500"><Trash2 size={16} /></button></div>)}</div>}</div>
      </>}
    </div>
  </section>
}
