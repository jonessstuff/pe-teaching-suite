import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Award, BarChart3, CalendarDays, Check, ChevronRight, ClipboardCheck,
  Dumbbell, ListChecks, Loader2, Plus, Save, Settings2, ShieldCheck,
  Sparkles, Target, Trash2, Trophy, UsersRound, X,
} from 'lucide-react'
import {
  createCoachingWorkspace, deleteCoachingWorkspace, listCoachingWorkspaces, updateCoachingWorkspace,
} from '../services/coachingService'
import {
  blankCandidate, blankTryoutEvaluation, candidateTryoutSummary, DEFAULT_COMMENT_TAGS,
  DEFAULT_RUBRIC, parseCandidateNames, weightedTryoutScore,
} from '../lib/tryoutScoring'

const SPORT_TEMPLATES = {
  General: DEFAULT_RUBRIC,
  Basketball: [
    { id: 'ball-skill', label: 'Ball skill', weight: 25, maxScore: 5 },
    { id: 'decision-making', label: 'Decision-making', weight: 25, maxScore: 5 },
    { id: 'defense', label: 'Defense', weight: 20, maxScore: 5 },
    { id: 'effort', label: 'Effort', weight: 15, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 15, maxScore: 5 },
  ],
  Volleyball: [
    { id: 'serve-pass', label: 'Serving & passing', weight: 25, maxScore: 5 },
    { id: 'court-movement', label: 'Court movement', weight: 20, maxScore: 5 },
    { id: 'decision-making', label: 'Decision-making', weight: 20, maxScore: 5 },
    { id: 'communication', label: 'Communication', weight: 20, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 15, maxScore: 5 },
  ],
  Soccer: [
    { id: 'technical', label: 'Technical skill', weight: 25, maxScore: 5 },
    { id: 'tactical', label: 'Tactical awareness', weight: 25, maxScore: 5 },
    { id: 'work-rate', label: 'Work rate', weight: 20, maxScore: 5 },
    { id: 'teamwork', label: 'Teamwork', weight: 15, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 15, maxScore: 5 },
  ],
  'Field Hockey': [
    { id: 'stick-skills', label: 'Stick skills', weight: 25, maxScore: 5 },
    { id: 'passing-receiving', label: 'Passing & receiving', weight: 20, maxScore: 5 },
    { id: 'field-awareness', label: 'Field awareness', weight: 20, maxScore: 5 },
    { id: 'speed-fitness', label: 'Speed & fitness', weight: 20, maxScore: 5 },
    { id: 'coachability-teamwork', label: 'Coachability & teamwork', weight: 15, maxScore: 5 },
  ],
  Football: [
    { id: 'position-skills', label: 'Position skills', weight: 25, maxScore: 5 },
    { id: 'athleticism', label: 'Athleticism', weight: 20, maxScore: 5 },
    { id: 'football-iq', label: 'Football IQ', weight: 20, maxScore: 5 },
    { id: 'effort-toughness', label: 'Effort & toughness', weight: 20, maxScore: 5 },
    { id: 'coachability-teamwork', label: 'Coachability & teamwork', weight: 15, maxScore: 5 },
  ],
  Baseball: [
    { id: 'fielding', label: 'Fielding', weight: 25, maxScore: 5 },
    { id: 'throwing', label: 'Throwing', weight: 20, maxScore: 5 },
    { id: 'hitting', label: 'Hitting', weight: 25, maxScore: 5 },
    { id: 'game-awareness', label: 'Game awareness', weight: 15, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 15, maxScore: 5 },
  ],
  Softball: [
    { id: 'fielding', label: 'Fielding', weight: 25, maxScore: 5 },
    { id: 'throwing', label: 'Throwing', weight: 20, maxScore: 5 },
    { id: 'hitting', label: 'Hitting', weight: 25, maxScore: 5 },
    { id: 'game-awareness', label: 'Game awareness', weight: 15, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 15, maxScore: 5 },
  ],
  Cheer: [
    { id: 'motion', label: 'Motion technique', weight: 20, maxScore: 5 },
    { id: 'jumps', label: 'Jumps', weight: 20, maxScore: 5 },
    { id: 'tumbling', label: 'Tumbling', weight: 20, maxScore: 5 },
    { id: 'performance', label: 'Performance', weight: 20, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 20, maxScore: 5 },
  ],
  'Track & Field': [
    { id: 'event-technique', label: 'Event technique', weight: 25, maxScore: 5 },
    { id: 'speed-power', label: 'Speed & power', weight: 20, maxScore: 5 },
    { id: 'endurance', label: 'Endurance', weight: 20, maxScore: 5 },
    { id: 'consistency', label: 'Consistency', weight: 20, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 15, maxScore: 5 },
  ],
  'Cross Country': [
    { id: 'endurance', label: 'Endurance', weight: 25, maxScore: 5 },
    { id: 'pacing-strategy', label: 'Pacing & race strategy', weight: 25, maxScore: 5 },
    { id: 'consistency', label: 'Consistency', weight: 20, maxScore: 5 },
    { id: 'mental-toughness', label: 'Mental toughness', weight: 15, maxScore: 5 },
    { id: 'coachability-teamwork', label: 'Coachability & teamwork', weight: 15, maxScore: 5 },
  ],
  Wrestling: [
    { id: 'technique', label: 'Technique', weight: 30, maxScore: 5 },
    { id: 'mat-awareness', label: 'Mat awareness', weight: 20, maxScore: 5 },
    { id: 'conditioning', label: 'Conditioning', weight: 20, maxScore: 5 },
    { id: 'competitiveness', label: 'Competitiveness', weight: 15, maxScore: 5 },
    { id: 'coachability', label: 'Coachability', weight: 15, maxScore: 5 },
  ],
}

function normalizedWorkspace(row) {
  const fallbackDate = String(row.created_at ?? new Date().toISOString()).slice(0, 10)
  const tryoutDays = row.tryout_days?.length
    ? row.tryout_days
    : [{ id: 'day-1', label: 'Day 1', date: fallbackDate }]
  return {
    ...row,
    rubric: row.rubric?.length ? row.rubric : structuredClone(DEFAULT_RUBRIC),
    comment_tags: row.comment_tags?.length ? row.comment_tags : structuredClone(DEFAULT_COMMENT_TAGS),
    tryout_days: tryoutDays,
    candidates: (row.candidates ?? []).map((candidate) => candidate.evaluations
      ? candidate
      : {
          ...candidate,
          evaluations: {
            [tryoutDays[0].id]: {
              scores: candidate.scores ?? {},
              commentTagIds: candidate.commentTagIds ?? [],
              notes: candidate.notes ?? '',
            },
          },
        }),
    team_tools: row.team_tools ?? { practices: [], plays: [], events: [] },
  }
}

function uid(prefix) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function summaryFor(candidate, workspace) {
  return candidateTryoutSummary(candidate, workspace.tryout_days, workspace.rubric, workspace.comment_tags, workspace.comments_affect_score)
}

function dayScoreFor(candidate, dayId, workspace) {
  return weightedTryoutScore(candidate?.evaluations?.[dayId] ?? blankTryoutEvaluation(), workspace.rubric, workspace.comment_tags, workspace.comments_affect_score)
}

export default function CoachingTryouts() {
  const [workspaces, setWorkspaces] = useState(null)
  const [active, setActive] = useState(null)
  const [activeCandidateId, setActiveCandidateId] = useState(null)
  const [activeTryoutDayId, setActiveTryoutDayId] = useState(null)
  const [tab, setTab] = useState('evaluate')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [saveState, setSaveState] = useState('saved')
  const [rosterText, setRosterText] = useState('')
  const [positionFilter, setPositionFilter] = useState('All positions')
  const dirtyRef = useRef(false)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    listCoachingWorkspaces().then((rows) => {
      const next = rows.map(normalizedWorkspace)
      setWorkspaces(next)
      if (next.length === 1) {
        setActive(next[0])
        setActiveCandidateId(next[0].candidates[0]?.id ?? null)
        setActiveTryoutDayId(next[0].tryout_days.at(-1)?.id ?? null)
      }
    }).catch((err) => setError(err.message))
  }, [])

  useEffect(() => () => window.clearTimeout(saveTimerRef.current), [])

  function updateActive(updater) {
    setActive((current) => {
      const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
      dirtyRef.current = true
      setSaveState('saving')
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(async () => {
        try {
          const saved = normalizedWorkspace(await updateCoachingWorkspace(next.id, {
            teamName: next.team_name,
            sport: next.sport,
            season: next.season,
            status: next.status,
            rubric: next.rubric,
            commentTags: next.comment_tags,
            commentsAffectScore: next.comments_affect_score,
            tryoutDays: next.tryout_days,
            candidates: next.candidates,
            teamTools: next.team_tools,
          }))
          setWorkspaces((items) => items.map((item) => item.id === saved.id ? saved : item))
          dirtyRef.current = false
          setSaveState('saved')
        } catch (err) {
          setError(err.message)
          setSaveState('error')
        }
      }, 550)
      return next
    })
  }

  function openWorkspace(workspace) {
    const normalized = normalizedWorkspace(workspace)
    setActive(normalized)
    setActiveCandidateId(normalized.candidates[0]?.id ?? null)
    setActiveTryoutDayId(normalized.tryout_days.at(-1)?.id ?? null)
    setCreating(false)
    setTab('evaluate')
  }

  async function handleCreate(values) {
    try {
      const saved = normalizedWorkspace(await createCoachingWorkspace(values))
      setWorkspaces((items) => [saved, ...(items ?? [])])
      openWorkspace(saved)
    } catch (err) {
      setError(err.message)
    }
  }

  if (workspaces === null) return <div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-accent-500" /></div>

  if (creating || (!active && workspaces.length === 0)) {
    return <CreateWorkspace onCreate={handleCreate} onCancel={workspaces.length ? () => setCreating(false) : null} />
  }

  if (!active) {
    return (
      <WorkspaceList
        workspaces={workspaces}
        onOpen={openWorkspace}
        onCreate={() => setCreating(true)}
        onDelete={async (id) => {
          if (!window.confirm('Delete this coaching workspace?')) return
          await deleteCoachingWorkspace(id)
          setWorkspaces((items) => items.filter((item) => item.id !== id))
        }}
      />
    )
  }

  const activeCandidate = active.candidates.find((candidate) => candidate.id === activeCandidateId) ?? active.candidates[0] ?? null
  const rankings = [...active.candidates].sort((a, b) => summaryFor(b, active).average - summaryFor(a, active).average)
  const selectedCount = active.candidates.filter((candidate) => candidate.selected).length

  function updateCandidate(candidateId, patch) {
    updateActive((current) => ({
      ...current,
      candidates: current.candidates.map((candidate) => candidate.id === candidateId
        ? { ...candidate, ...(typeof patch === 'function' ? patch(candidate) : patch) }
        : candidate),
    }))
  }

  function addCandidates() {
    const names = parseCandidateNames(rosterText)
    if (!names.length) return
    const existing = new Set(active.candidates.map((candidate) => candidate.name.toLowerCase()))
    const additions = names
      .filter((name) => !existing.has(name.toLowerCase()))
      .map((name, index) => blankCandidate(name, active.candidates.length + index))
    if (!additions.length) return
    updateActive((current) => ({ ...current, candidates: [...current.candidates, ...additions] }))
    setRosterText('')
    if (!activeCandidateId) setActiveCandidateId(additions[0].id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => setActive(null)} className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> All teams & tryouts</button>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600"><Trophy size={25} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">{active.sport} · {active.season || 'Current season'}</p><h1 className="text-3xl font-semibold text-ink-50">{active.team_name}</h1></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${saveState === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-700'}`}>
            {saveState === 'saving' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved automatically'}
          </span>
          <button type="button" onClick={() => setTab('setup')} className="btn-secondary"><Settings2 size={16} /> Edit scoring</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-ink-800 bg-white p-2 dark:bg-ink-900 sm:grid-cols-4">
        {[
          ['evaluate', ClipboardCheck, 'Live scoring'],
          ['rankings', BarChart3, 'Rankings'],
          ['team', UsersRound, `Team (${selectedCount})`],
          ['tools', Dumbbell, 'Coach tools'],
        ].map(([key, Icon, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${tab === key ? 'bg-accent-500 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-950'}`}><Icon size={17} />{label}</button>)}
      </div>

      {tab === 'setup' && <ScoringSetup workspace={active} onChange={updateActive} onDone={() => setTab('evaluate')} />}
      {tab === 'evaluate' && (
        <LiveScoring
          workspace={active}
          candidate={activeCandidate}
          activeCandidateId={activeCandidateId}
          onSelectCandidate={setActiveCandidateId}
          activeTryoutDayId={activeTryoutDayId}
          onSelectTryoutDay={setActiveTryoutDayId}
          onUpdateCandidate={updateCandidate}
          onUpdateWorkspace={updateActive}
          rosterText={rosterText}
          onRosterText={setRosterText}
          onAddCandidates={addCandidates}
        />
      )}
      {tab === 'rankings' && (
        <Rankings
          workspace={active}
          rankings={rankings}
          positionFilter={positionFilter}
          onPositionFilter={setPositionFilter}
          onUpdateCandidate={updateCandidate}
          onEvaluate={(id) => { setActiveCandidateId(id); setTab('evaluate') }}
          onFormTeam={() => updateActive((current) => ({ ...current, status: 'team' }))}
        />
      )}
      {tab === 'team' && <TeamRoster workspace={active} onUpdateCandidate={updateCandidate} onEvaluate={(id) => { setActiveCandidateId(id); setTab('evaluate') }} />}
      {tab === 'tools' && <CoachTools workspace={active} onChange={updateActive} />}
    </div>
  )
}

function WorkspaceList({ workspaces, onOpen, onCreate, onDelete }) {
  return <div className="space-y-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Link to="/pe-health" className="inline-flex items-center gap-1.5 text-sm text-ink-500"><ArrowLeft size={14} /> PE Dashboard</Link><h1 className="mt-3 text-3xl font-semibold">Coaching & Tryouts</h1><p className="mt-2 text-ink-500">Evaluate fairly, form the team, and organize the season.</p></div><button onClick={onCreate} className="btn-primary"><Plus size={17} /> New tryout</button></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{workspaces.map((workspace) => <button key={workspace.id} onClick={() => onOpen(workspace)} className="card group p-5 text-left transition-colors hover:border-amber-500/40"><div className="flex items-start justify-between"><Trophy className="text-amber-500" /><button type="button" onClick={(event) => { event.stopPropagation(); onDelete(workspace.id) }} className="rounded-lg p-2 text-ink-600 hover:bg-red-500/10 hover:text-red-500"><Trash2 size={16} /></button></div><h2 className="mt-5 text-xl font-bold">{workspace.team_name}</h2><p className="mt-1 text-sm text-ink-500">{workspace.sport} · {workspace.season || 'Current season'}</p><div className="mt-4 flex items-center justify-between text-sm"><span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700">{workspace.candidates?.length ?? 0} candidates</span><ChevronRight className="text-ink-600 transition-transform group-hover:translate-x-1" /></div></button>)}</div>
  </div>
}

function CreateWorkspace({ onCreate, onCancel }) {
  const [form, setForm] = useState({ teamName: '', sport: 'General', season: '', roster: '' })
  const [submitting, setSubmitting] = useState(false)
  return <div className="mx-auto max-w-3xl space-y-6"><button type="button" onClick={onCancel ?? (() => {})} className={`inline-flex items-center gap-1.5 text-sm text-ink-500 ${onCancel ? '' : 'invisible'}`}><ArrowLeft size={14} /> Back</button><div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Coaching & Tryouts</p><h1 className="mt-1 text-3xl font-semibold">Set up a tryout</h1><p className="mt-2 text-ink-500">Start with a sport template, then edit every category and weight.</p></div><form onSubmit={async (event) => { event.preventDefault(); setSubmitting(true); const firstDay = { id: uid('day'), label: 'Day 1', date: new Date().toISOString().slice(0, 10) }; await onCreate({ teamName: form.teamName, sport: form.sport, season: form.season, rubric: structuredClone(SPORT_TEMPLATES[form.sport] ?? DEFAULT_RUBRIC), commentTags: structuredClone(DEFAULT_COMMENT_TAGS), commentsAffectScore: true, tryoutDays: [firstDay], candidates: parseCandidateNames(form.roster).map(blankCandidate) }); setSubmitting(false) }} className="card space-y-5 p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Team name<input required value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} className="input-field mt-2" placeholder="JV Volleyball" /></label><label className="text-sm font-semibold">Season<input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="input-field mt-2" placeholder="Fall 2026" /></label></div><label className="block text-sm font-semibold">Sport<select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} className="input-field mt-2">{Object.keys(SPORT_TEMPLATES).map((sport) => <option key={sport}>{sport}</option>)}</select><span className="mt-1 block text-xs font-normal text-ink-500">These categories are only a starting point. The coach can rename, reweight, add, or remove all of them.</span></label><label className="block text-sm font-semibold">Candidate names <span className="font-normal text-ink-500">(optional)</span><textarea rows={7} value={form.roster} onChange={(e) => setForm({ ...form, roster: e.target.value })} className="input-field mt-2" placeholder={'Paste one name per line\nAvery M.\nJordan R.\nCasey L.'} /></label><button disabled={submitting} className="btn-primary w-full">{submitting ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />} Create editable tryout</button></form></div>
}

function LiveScoring({ workspace, candidate, activeCandidateId, onSelectCandidate, activeTryoutDayId, onSelectTryoutDay, onUpdateCandidate, onUpdateWorkspace, rosterText, onRosterText, onAddCandidates }) {
  const activeDay = workspace.tryout_days.find((day) => day.id === activeTryoutDayId) ?? workspace.tryout_days.at(-1)
  const evaluation = candidate?.evaluations?.[activeDay?.id] ?? blankTryoutEvaluation()
  const dayScore = candidate && activeDay ? dayScoreFor(candidate, activeDay.id, workspace) : null
  const finalSummary = candidate ? summaryFor(candidate, workspace) : null

  function updateEvaluation(patch) {
    if (!candidate || !activeDay) return
    onUpdateCandidate(candidate.id, (current) => {
      const currentEvaluation = current.evaluations?.[activeDay.id] ?? blankTryoutEvaluation()
      return {
        evaluations: {
          ...(current.evaluations ?? {}),
          [activeDay.id]: { ...currentEvaluation, ...(typeof patch === 'function' ? patch(currentEvaluation) : patch) },
        },
      }
    })
  }

  function addTryoutDay() {
    const number = workspace.tryout_days.length + 1
    const day = { id: uid('day'), label: `Day ${number}`, date: new Date().toISOString().slice(0, 10) }
    onUpdateWorkspace((current) => ({ ...current, tryout_days: [...current.tryout_days, day] }))
    onSelectTryoutDay(day.id)
  }

  return <div className="space-y-5">
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wider text-accent-700">Tryout sessions</p><p className="mt-1 text-sm text-ink-500">Each day keeps separate scores, comments, and notes.</p></div>
        <button onClick={addTryoutDay} className="btn-secondary"><Plus size={16} /> Add tryout day</button>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {workspace.tryout_days.map((day) => <button key={day.id} onClick={() => onSelectTryoutDay(day.id)} className={`min-w-32 rounded-xl border px-4 py-3 text-left ${activeDay?.id === day.id ? 'border-accent-500 bg-accent-500 text-white' : 'border-ink-700 bg-white text-ink-400 dark:bg-ink-800'}`}><strong className="block text-sm">{day.label}</strong><span className="text-xs opacity-80">{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></button>)}
      </div>
      {activeDay && <div className="mt-3 grid gap-2 rounded-xl bg-ink-950 p-3 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-500">Session label<input value={activeDay.label} onChange={(e) => onUpdateWorkspace((current) => ({ ...current, tryout_days: current.tryout_days.map((day) => day.id === activeDay.id ? { ...day, label: e.target.value } : day) }))} className="input-field mt-1" /></label><label className="text-xs font-semibold text-ink-500">Tryout date<input type="date" value={activeDay.date} onChange={(e) => onUpdateWorkspace((current) => ({ ...current, tryout_days: current.tryout_days.map((day) => day.id === activeDay.id ? { ...day, date: e.target.value } : day) }))} className="input-field mt-1" /></label></div>}
    </section>

    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-ink-500">Add candidates</p><textarea rows={3} value={rosterText} onChange={(e) => onRosterText(e.target.value)} className="input-field mt-2" placeholder="Paste names, one per line" /><button onClick={onAddCandidates} className="btn-secondary mt-2 w-full"><Plus size={16} /> Add to tryout</button></div>
        <div className="card overflow-hidden"><div className="border-b border-ink-800 p-4"><p className="font-bold">Candidates</p><p className="text-xs text-ink-500">Tap a name to score {activeDay?.label}</p></div><div className="max-h-[62vh] overflow-y-auto">{workspace.candidates.map((item) => { const daily = activeDay ? dayScoreFor(item, activeDay.id, workspace) : null; const overall = summaryFor(item, workspace); return <button key={item.id} onClick={() => onSelectCandidate(item.id)} className={`flex w-full items-center gap-3 border-b border-ink-900 p-3 text-left last:border-0 ${activeCandidateId === item.id ? 'bg-accent-500/10' : 'hover:bg-ink-950'}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-ink-300">#{item.number}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.name}</strong><span className="text-xs text-ink-500">{item.position || 'Position not set'} · {daily?.completed ?? 0}/{daily?.total ?? workspace.rubric.length} today</span></span><span className="text-right"><strong className={`block text-sm ${daily?.completed === daily?.total ? 'text-emerald-600' : 'text-ink-500'}`}>{daily?.score ?? 0}%</strong><small className="text-[10px] text-ink-500">avg {overall.average}%</small></span></button>})}</div></div>
      </aside>

      {!candidate ? <div className="card flex min-h-96 flex-col items-center justify-center p-8 text-center"><UsersRound size={40} className="text-ink-600" /><h2 className="mt-4 text-xl font-bold">Add candidates to begin</h2><p className="mt-2 max-w-md text-sm text-ink-500">Paste names from an email, spreadsheet, or roster. Tryout numbers are assigned automatically and remain editable.</p></div> : <section className="space-y-5">
        <div className="card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-accent-700">{activeDay?.label} evaluation · {activeDay?.date}</p><div className="mt-1 flex flex-wrap items-center gap-2"><input aria-label="Tryout number" value={candidate.number} onChange={(e) => onUpdateCandidate(candidate.id, { number: e.target.value })} className="w-20 rounded-lg border border-ink-700 bg-white px-2 py-1.5 text-center font-bold dark:bg-ink-800" /><input aria-label="Candidate name" value={candidate.name} onChange={(e) => onUpdateCandidate(candidate.id, { name: e.target.value })} className="min-w-48 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-2xl font-bold text-ink-50 hover:border-ink-700 focus:border-ink-700" /></div><input aria-label="Position" value={candidate.position} onChange={(e) => onUpdateCandidate(candidate.id, { position: e.target.value })} className="input-field mt-3 max-w-xs" placeholder="Position or role" /></div><div className="grid grid-cols-2 gap-2"><div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-center"><p className="text-2xl font-black text-amber-700">{dayScore.score}%</p><p className="text-[11px] font-semibold text-amber-700">{activeDay?.label} total</p></div><div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-center"><p className="text-2xl font-black text-emerald-700">{finalSummary.average}%</p><p className="text-[11px] font-semibold text-emerald-700">Final average</p></div></div></div></div>

        <div className="card p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Tap to score {activeDay?.label}</h2><p className="text-sm text-ink-500">The same editable rubric is saved separately for every tryout day.</p></div><ListChecks className="text-accent-600" /></div><div className="mt-5 space-y-5">{workspace.rubric.map((category) => <div key={category.id} className="grid gap-3 border-b border-ink-900 pb-5 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold">{category.label}</p><p className="text-xs text-ink-500">{category.weight}% weight</p></div><div className="flex flex-wrap gap-2">{Array.from({ length: Number(category.maxScore) }, (_, index) => index + 1).map((value) => <button key={value} onClick={() => updateEvaluation((current) => ({ scores: { ...current.scores, [category.id]: value } }))} className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold transition ${Number(evaluation.scores?.[category.id]) === value ? 'border-accent-500 bg-accent-500 text-white shadow' : 'border-ink-700 bg-white text-ink-400 hover:border-accent-400 dark:bg-ink-800'}`}>{value}</button>)}</div></div>)}</div></div>

        <div className="card p-5"><h2 className="text-lg font-bold">{activeDay?.label} comments & notes</h2><p className="mt-1 text-sm text-ink-500">{workspace.comments_affect_score ? 'Point values are visible and included in this day’s total.' : 'Tags are notes only and do not affect the score.'}</p><div className="mt-4 flex flex-wrap gap-2">{workspace.comment_tags.map((tag) => { const selected = evaluation.commentTagIds?.includes(tag.id); return <button key={tag.id} onClick={() => updateEvaluation((current) => ({ commentTagIds: selected ? current.commentTagIds.filter((id) => id !== tag.id) : [...(current.commentTagIds ?? []), tag.id] }))} className={`rounded-full border px-3 py-2 text-sm font-semibold ${selected ? 'border-amber-500 bg-amber-500/15 text-amber-700' : 'border-ink-700 text-ink-400 hover:border-amber-500/50'}`}>{selected && <Check size={13} className="mr-1 inline" />}{tag.label}{workspace.comments_affect_score && <span className="ml-1 opacity-70">({tag.points > 0 ? '+' : ''}{tag.points})</span>}</button>})}</div><textarea rows={4} value={evaluation.notes} onChange={(e) => updateEvaluation({ notes: e.target.value })} className="input-field mt-4" placeholder={`Notes for ${activeDay?.label}…`} /></div>

        <CandidateDayHistory candidate={candidate} workspace={workspace} onSelectDay={onSelectTryoutDay} />
      </section>}
    </div>
  </div>
}

function CandidateDayHistory({ candidate, workspace, onSelectDay }) {
  const summary = summaryFor(candidate, workspace)
  return <div className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Tryout history</h2><p className="mt-1 text-sm text-ink-500">Review every day before making a final selection.</p></div><div className="text-right"><p className="text-xl font-black text-emerald-700">{summary.totalPoints} total points</p><p className="text-xs text-ink-500">÷ {summary.daysScored || 0} scored day{summary.daysScored === 1 ? '' : 's'} = {summary.average}% average</p></div></div><div className="mt-4 space-y-2">{summary.days.map((result) => { const notes = candidate.evaluations?.[result.day.id]?.notes; return <button key={result.day.id} onClick={() => onSelectDay(result.day.id)} className="grid w-full gap-2 rounded-xl border border-ink-800 p-3 text-left hover:border-accent-500/40 sm:grid-cols-[130px_100px_1fr]"><span><strong className="block text-sm">{result.day.label}</strong><small className="text-ink-500">{result.day.date}</small></span><strong className="text-lg text-emerald-700">{result.completed ? `${result.score}%` : 'Not scored'}</strong><span className="text-sm text-ink-500">{notes || `${result.completed}/${result.total} categories completed`}</span></button>})}</div></div>
}

function ScoringSetup({ workspace, onChange, onDone }) {
  function updateRubric(id, patch) { onChange((current) => ({ ...current, rubric: current.rubric.map((item) => item.id === id ? { ...item, ...patch } : item) })) }
  function updateTag(id, patch) { onChange((current) => ({ ...current, comment_tags: current.comment_tags.map((item) => item.id === id ? { ...item, ...patch } : item) })) }
  const totalWeight = workspace.rubric.reduce((sum, item) => sum + Number(item.weight || 0), 0)
  return <section className="space-y-5"><div className="card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-accent-700">Coach-controlled scoring</p><h2 className="mt-1 text-2xl font-bold">Edit the live rubric</h2><p className="mt-1 text-sm text-ink-500">Use the language and priorities that fit this sport and level.</p></div><button onClick={onDone} className="btn-primary"><Check size={16} /> Done editing</button></div><div className={`mt-5 rounded-xl p-3 text-sm font-semibold ${totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>Current category weight: {totalWeight}% {totalWeight === 100 ? '✓' : '— PlansK12 will normalize the total, but 100% is easiest to explain.'}</div><div className="mt-5 space-y-3">{workspace.rubric.map((category) => <div key={category.id} className="grid gap-2 rounded-xl border border-ink-800 p-3 sm:grid-cols-[1fr_120px_120px_auto]"><input value={category.label} onChange={(e) => updateRubric(category.id, { label: e.target.value })} className="input-field" aria-label="Category name" /><label className="text-xs font-semibold text-ink-500">Weight %<input type="number" min="0" max="100" value={category.weight} onChange={(e) => updateRubric(category.id, { weight: Number(e.target.value) })} className="input-field mt-1" /></label><label className="text-xs font-semibold text-ink-500">Scale max<input type="number" min="2" max="10" value={category.maxScore} onChange={(e) => updateRubric(category.id, { maxScore: Number(e.target.value) })} className="input-field mt-1" /></label><button onClick={() => onChange((current) => ({ ...current, rubric: current.rubric.filter((item) => item.id !== category.id) }))} className="btn-ghost self-end !px-3 text-red-500"><Trash2 size={16} /></button></div>)}</div><button onClick={() => onChange((current) => ({ ...current, rubric: [...current.rubric, { id: uid('category'), label: 'New category', weight: 10, maxScore: 5 }] }))} className="btn-secondary mt-4"><Plus size={16} /> Add category</button></div>
    <div className="card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Quick comment tags</h2><p className="mt-1 text-sm text-ink-500">Coaches can change every phrase and point value.</p></div><label className="flex items-center gap-2 rounded-xl bg-ink-950 px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={workspace.comments_affect_score} onChange={(e) => onChange({ ...workspace, comments_affect_score: e.target.checked })} /> Comments affect score</label></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{workspace.comment_tags.map((tag) => <div key={tag.id} className="grid grid-cols-[1fr_85px_auto] gap-2 rounded-xl border border-ink-800 p-3"><input value={tag.label} onChange={(e) => updateTag(tag.id, { label: e.target.value })} className="input-field" aria-label="Comment label" /><input type="number" min="-10" max="10" value={tag.points} onChange={(e) => updateTag(tag.id, { points: Number(e.target.value) })} className="input-field" aria-label="Comment points" /><button onClick={() => onChange((current) => ({ ...current, comment_tags: current.comment_tags.filter((item) => item.id !== tag.id) }))} className="btn-ghost !px-2 text-red-500"><X size={16} /></button></div>)}</div><button onClick={() => onChange((current) => ({ ...current, comment_tags: [...current.comment_tags, { id: uid('tag'), label: 'New observation', points: 0 }] }))} className="btn-secondary mt-4"><Plus size={16} /> Add comment tag</button></div>
  </section>
}

function Rankings({ workspace, rankings, positionFilter, onPositionFilter, onUpdateCandidate, onEvaluate, onFormTeam }) {
  const positions = ['All positions', ...new Set(workspace.candidates.map((item) => item.position).filter(Boolean))]
  const shown = positionFilter === 'All positions' ? rankings : rankings.filter((item) => item.position === positionFilter)
  return <section className="space-y-5"><div className="card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">Coach decision support</p><h2 className="mt-1 text-2xl font-bold">Final tryout rankings</h2><p className="mt-1 text-sm text-ink-500">Every completed day is added, then divided by days scored for the final average. Filter by position before selecting.</p></div><select value={positionFilter} onChange={(e) => onPositionFilter(e.target.value)} className="input-field max-w-56">{positions.map((position) => <option key={position}>{position}</option>)}</select></div></div><div className="overflow-hidden rounded-2xl border border-ink-800 bg-white dark:bg-ink-900"><div className="hidden grid-cols-[70px_1fr_150px_160px_120px] gap-3 border-b border-ink-800 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink-500 md:grid"><span>Rank</span><span>Candidate</span><span>Position</span><span>Final total</span><span>Team</span></div>{shown.map((candidate, index) => { const result = summaryFor(candidate, workspace); return <div key={candidate.id} className="grid gap-3 border-b border-ink-900 p-4 last:border-0 md:grid-cols-[70px_1fr_150px_160px_120px] md:items-center"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 font-black text-amber-700">{index + 1}</span><button onClick={() => onEvaluate(candidate.id)} className="text-left"><strong className="block">#{candidate.number} · {candidate.name}</strong><span className="text-xs text-ink-500">{result.daysScored}/{result.totalDays} tryout days scored · open complete history</span></button><span className="text-sm text-ink-400">{candidate.position || '—'}</span><span><strong className="text-lg text-emerald-700">{result.average}% avg</strong><small className="block text-ink-500">{result.totalPoints} points ÷ {result.daysScored || 0} days</small></span><button onClick={() => onUpdateCandidate(candidate.id, { selected: !candidate.selected })} className={`rounded-lg px-3 py-2 text-sm font-semibold ${candidate.selected ? 'bg-emerald-500 text-white' : 'border border-ink-700 text-ink-400'}`}>{candidate.selected ? <><Check size={14} className="mr-1 inline" />Selected</> : 'Select'}</button></div>})}</div><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><div><p className="font-bold text-emerald-800 dark:text-emerald-300">{workspace.candidates.filter((item) => item.selected).length} athletes currently selected</p><p className="text-sm text-emerald-700 dark:text-emerald-400">You can continue changing selections after forming the team.</p></div><button onClick={onFormTeam} className="btn-primary"><ShieldCheck size={17} /> Form team</button></div></section>
}

function TeamRoster({ workspace, onUpdateCandidate, onEvaluate }) {
  const selected = workspace.candidates.filter((candidate) => candidate.selected)
  return <section className="space-y-5"><div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Selected roster</p><h2 className="mt-1 text-2xl font-bold">{workspace.team_name}</h2><p className="mt-1 text-sm text-ink-500">{selected.length} athletes · Changes stay connected to every tryout-day evaluation.</p></div>{selected.length === 0 ? <div className="card p-8 text-center"><Award size={40} className="mx-auto text-ink-600" /><h3 className="mt-4 text-xl font-bold">No athletes selected yet</h3><p className="mt-2 text-sm text-ink-500">Open Rankings to select the team.</p></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selected.map((candidate) => { const result = summaryFor(candidate, workspace); return <div key={candidate.id} className="card p-4"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 font-bold text-emerald-700">#{candidate.number}</span><button onClick={() => onUpdateCandidate(candidate.id, { selected: false })} className="rounded-lg p-2 text-ink-600 hover:bg-red-500/10 hover:text-red-500" title="Remove from selected roster"><X size={16} /></button></div><h3 className="mt-4 font-bold">{candidate.name}</h3><p className="text-sm text-ink-500">{candidate.position || 'Position not assigned'} · {result.average}% final average</p><button onClick={() => onEvaluate(candidate.id)} className="mt-4 text-sm font-semibold text-accent-700">Review all tryout days →</button></div>})}</div>}</section>
}

function CoachTools({ workspace, onChange }) {
  const [forms, setForms] = useState({ practice: { title: '', date: '', notes: '' }, play: { title: '', notes: '' }, event: { title: '', date: '', time: '', location: '' } })
  const sections = [
    { key: 'practices', form: 'practice', title: 'Practice plans', icon: Dumbbell, fields: [['title', 'Practice focus'], ['date', 'Date', 'date'], ['notes', 'Plan or notes']] },
    { key: 'plays', form: 'play', title: 'Plays & strategies', icon: Target, fields: [['title', 'Play or strategy name'], ['notes', 'Teaching points']] },
    { key: 'events', form: 'event', title: 'Game schedule', icon: CalendarDays, fields: [['title', 'Opponent or event'], ['date', 'Date', 'date'], ['time', 'Time'], ['location', 'Location']] },
  ]
  function addItem(section) {
    const value = forms[section.form]
    if (!value.title.trim()) return
    onChange((current) => ({ ...current, team_tools: { ...current.team_tools, [section.key]: [...(current.team_tools?.[section.key] ?? []), { id: uid(section.form), ...value }] } }))
    setForms((current) => ({ ...current, [section.form]: Object.fromEntries(Object.keys(value).map((key) => [key, ''])) }))
  }
  return <section className="space-y-5"><div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-violet-600">After the team is formed</p><h2 className="mt-1 text-2xl font-bold">Season command center</h2><p className="mt-1 text-sm text-ink-500">Starter tools are usable now. Sport-specific drill libraries and visual play diagrams can grow next.</p></div><div className="grid gap-5 lg:grid-cols-3">{sections.map((section) => { const Icon = section.icon; const values = forms[section.form]; const items = workspace.team_tools?.[section.key] ?? []; return <div key={section.key} className="card p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600"><Icon size={20} /></div><h3 className="font-bold">{section.title}</h3></div><div className="mt-4 space-y-2">{section.fields.map(([key, placeholder, type]) => <input key={key} type={type || 'text'} value={values[key]} onChange={(e) => setForms((current) => ({ ...current, [section.form]: { ...current[section.form], [key]: e.target.value } }))} className="input-field" placeholder={placeholder} />)}<button onClick={() => addItem(section)} className="btn-secondary w-full"><Plus size={15} /> Add</button></div><div className="mt-5 space-y-2">{items.map((item) => <div key={item.id} className="rounded-xl bg-ink-950 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-ink-500">{[item.date, item.time, item.location, item.notes].filter(Boolean).join(' · ')}</p></div><button onClick={() => onChange((current) => ({ ...current, team_tools: { ...current.team_tools, [section.key]: current.team_tools[section.key].filter((entry) => entry.id !== item.id) } }))} className="text-ink-600 hover:text-red-500"><Trash2 size={14} /></button></div></div>)}{items.length === 0 && <p className="rounded-xl border border-dashed border-ink-700 p-3 text-center text-xs text-ink-500">Nothing added yet</p>}</div></div>})}</div></section>
}
