import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Check, Clipboard, Download, Filter, Grid3X3, HeartPulse, Inbox, Link2, Loader2, Plus, RefreshCw, Sparkles, Users } from 'lucide-react'
import StaffWellnessPrintKit from '../components/wellness/StaffWellnessPrintKit'
import { BINGO_PROMPTS, WELLNESS_TEMPLATES, challengeMessages, csvCell, makeBingoCard, parseStaffList } from '../lib/staffWellness'
import { approveStaffWellnessCheckIn, createStaffWellnessChallenge, listStaffWellnessChallenges, listStaffWellnessCheckIns, updateStaffWellnessChallenge } from '../services/staffWellnessService'

const dateInput = (days = 0) => { const value = new Date(); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10) }
const SAMPLE_STAFF = `Alex | Elementary
Jordan | Elementary
Casey | Middle School
Morgan | Middle School
Taylor | Office & Support
Riley | Office & Support`

export default function StaffWellnessChallenge() {
  const [challenges, setChallenges] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [view, setView] = useState('ideas')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState('All levels')
  const [templateId, setTemplateId] = useState('move-10')
  const [form, setForm] = useState({ title: 'Move for 10', goal: 20, unit: 'days', startsOn: dateInput(), endsOn: dateInput(30), scope: 'Schoolwide collective', leaderboard: 'off' })
  const [staffRaw, setStaffRaw] = useState(SAMPLE_STAFF)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [checkIns, setCheckIns] = useState([])

  useEffect(() => { listStaffWellnessChallenges().then((rows) => { setChallenges(rows); if (rows[0]) { setSelectedId(rows[0].id); setView('overview') } }).catch((err) => { setError(err.message); setChallenges([]) }) }, [])

  const selected = challenges?.find((item) => item.id === selectedId) ?? null
  const participants = useMemo(() => selected?.participants ?? [], [selected])
  const total = participants.reduce((sum, person) => sum + Number(selected?.progress?.[person.id] ?? 0), 0)
  const percent = selected?.settings.goal ? Math.min(100, Math.round(total / Number(selected.settings.goal) * 100)) : 0
  const participating = participants.filter((person) => Number(selected?.progress?.[person.id] ?? 0) > 0).length
  const teams = useMemo(() => Object.values(participants.reduce((acc, person) => { const team = person.team || 'Schoolwide'; if (!acc[team]) acc[team] = { name: team, total: 0, people: 0 }; acc[team].total += Number(selected?.progress?.[person.id] ?? 0); acc[team].people += 1; return acc }, {})).sort((a, b) => b.total - a.total), [participants, selected])
  const categories = ['All', ...new Set(WELLNESS_TEMPLATES.map((item) => item.category))]
  const visibleTemplates = WELLNESS_TEMPLATES.filter((item) => (category === 'All' || item.category === category) && (level === 'All levels' || item.level === level || item.level === 'All levels'))
  const chosenTemplate = WELLNESS_TEMPLATES.find((item) => item.id === templateId) ?? WELLNESS_TEMPLATES[0]
  const checkInLink = selected ? (import.meta.env.VITE_STANDALONE_PREVIEW ? `${window.location.origin}/preview.html#/wellness-check-in/${selected.public_token}` : `${window.location.origin}/wellness-check-in/${selected.public_token}`) : ''

  useEffect(() => {
    if (!selectedId) return
    listStaffWellnessCheckIns(selectedId).then(setCheckIns).catch((err) => setError(err.message))
  }, [selectedId])

  function chooseTemplate(template) {
    setTemplateId(template.id)
    setForm((current) => ({ ...current, title: template.title, goal: template.goal, unit: template.unit }))
    setView('setup')
  }

  async function createChallenge(event) {
    event.preventDefault()
    setSaving('create'); setError('')
    try {
      const settings = { ...form, blurb: chosenTemplate.blurb, alternative: chosenTemplate.alternative, category: chosenTemplate.category, level: chosenTemplate.level, metric: chosenTemplate.metric }
      const context = { title: form.title, ...settings }
      const publicToken = crypto.randomUUID().replaceAll('-', '').slice(0, 20)
      const row = await createStaffWellnessChallenge({ title: form.title, templateId, publicToken, settings, participants: parseStaffList(staffRaw), progress: {}, bingo: makeBingoCard(challenges?.length ?? 0), messages: challengeMessages(context) })
      setChallenges((current) => [row, ...(current ?? [])]); setSelectedId(row.id); setView('overview')
    } catch (err) { setError(err.message) } finally { setSaving('') }
  }

  async function persist(updates) {
    if (!selected) return null
    const updated = await updateStaffWellnessChallenge(selected.id, updates)
    setChallenges((current) => current.map((item) => item.id === updated.id ? updated : item))
    return updated
  }

  async function addProgress(person, amount) {
    setSaving(person.id); setError('')
    try { await persist({ progress: { ...(selected.progress ?? {}), [person.id]: Math.max(0, Number(selected.progress?.[person.id] ?? 0) + Number(amount)) } }) } catch (err) { setError(err.message) } finally { setSaving('') }
  }

  async function regenerateBingo() {
    setSaving('bingo')
    try { await persist({ bingo: makeBingoCard(Math.max(1, BINGO_PROMPTS.indexOf(selected.bingo?.[0]) + 1)) }) } catch (err) { setError(err.message) } finally { setSaving('') }
  }

  async function copyMessage(key) {
    await navigator.clipboard.writeText(selected.messages[key]); setCopied(key); window.setTimeout(() => setCopied(''), 1500)
  }

  async function copyCheckInLink() {
    await navigator.clipboard.writeText(checkInLink); setCopied('link'); window.setTimeout(() => setCopied(''), 1500)
  }

  async function approveCheckIn(checkIn) {
    setSaving(checkIn.id); setError('')
    try {
      let person = participants.find((item) => item.name.trim().toLowerCase() === checkIn.participant_label.trim().toLowerCase())
      let nextParticipants = participants
      if (!person) {
        person = { id: `staff-checkin-${checkIn.id}`, name: checkIn.participant_label, team: checkIn.team_label || 'Schoolwide' }
        nextParticipants = [...participants, person]
      }
      const nextProgress = { ...(selected.progress ?? {}), [person.id]: Number(selected.progress?.[person.id] ?? 0) + Number(checkIn.amount) }
      await persist({ participants: nextParticipants, progress: nextProgress })
      const approved = await approveStaffWellnessCheckIn(checkIn.id)
      setCheckIns((current) => current.map((item) => item.id === approved.id ? approved : item))
    } catch (err) { setError(err.message) } finally { setSaving('') }
  }

  function exportCsv() {
    if (!selected) return
    const rows = [['Staff member', 'Team/department', `Progress (${selected.settings.unit})`], ...participants.map((person) => [person.name, person.team, selected.progress?.[person.id] ?? 0])]
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-progress.csv`; anchor.click(); URL.revokeObjectURL(url)
  }

  if (challenges === null) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-emerald-400" /></div>

  return <div className="space-y-7">
    <style>{`@media print { body * { visibility: hidden !important; } .staff-wellness-print, .staff-wellness-print * { visibility: visible !important; } .staff-wellness-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; } }`}</style>
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link to="/pe-health" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> PE &amp; Health</Link><div className="flex gap-2">{selected && <button onClick={exportCsv} className="btn-secondary"><Download size={15} /> Export CSV</button>}<button onClick={() => setView('ideas')} className="btn-primary"><Plus size={15} /> New challenge</button></div></div>
    <section className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-sky-500/10 p-5 sm:p-8"><div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15"><HeartPulse size={28} className="text-emerald-400" /></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-400">Staff Wellness Challenge</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-50">Wellness that includes everyone.</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">Choose from movement, mobility, recovery, mindfulness, outdoor, team, consistency, and bingo challenges—then run the program without collecting sensitive health data.</p></div></div>{selected && <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setView('overview') }} className="input-field max-w-sm"><option value="">Choose challenge</option>{challenges.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>}</div></section>
    {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

    <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">{[['ideas','Challenge Library',Sparkles],['setup','Build Challenge',Filter],...(selected ? [['overview','Overview',BarChart3],['submissions',`Submissions${checkIns.filter((item) => item.status === 'pending').length ? ` (${checkIns.filter((item) => item.status === 'pending').length})` : ''}`,Inbox],['track','Log Progress',Plus],['bingo','Bingo',Grid3X3],['messages','Messages',Clipboard]] : [])].map(([key,label,Icon]) => <button key={key} onClick={() => setView(key)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${view === key ? 'bg-emerald-500 text-white' : 'border border-ink-800 bg-ink-950 text-ink-400'}`}><Icon size={15} />{label}</button>)}</div>

    {view === 'ideas' && <section className="space-y-5 print:hidden"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="label-eyebrow">25 ready-made ideas</p><h2 className="mt-1 text-2xl font-black text-ink-50">Find a challenge that fits your staff</h2></div><div className="flex flex-wrap gap-2"><select value={category} onChange={(event) => setCategory(event.target.value)} className="input-field w-auto">{categories.map((value) => <option key={value}>{value}</option>)}</select><select value={level} onChange={(event) => setLevel(event.target.value)} className="input-field w-auto">{['All levels','Beginner','Moderate','Advanced'].map((value) => <option key={value}>{value}</option>)}</select></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleTemplates.map((template) => <article key={template.id} className="card flex flex-col p-5"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-400">{template.category}</span><span className="ml-2 text-[10px] font-bold uppercase text-ink-500">{template.level}</span></div><span className="text-xs font-bold text-ink-500">{template.goal} {template.unit}</span></div><h3 className="mt-4 text-lg font-black text-ink-50">{template.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{template.blurb}</p><p className="mt-3 rounded-xl bg-emerald-500/5 p-3 text-xs leading-relaxed text-emerald-300"><strong>Inclusive option:</strong> {template.alternative}</p><button type="button" aria-label={`Use ${template.title}`} onClick={() => chooseTemplate(template)} className="btn-secondary mt-4 w-full">Use this challenge</button></article>)}</div></section>}

    {view === 'setup' && <form onSubmit={createChallenge} className="grid gap-6 xl:grid-cols-[1fr_390px] print:hidden"><section className="card p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15"><Sparkles className="text-emerald-400" /></div><div><p className="label-eyebrow">Selected idea</p><h2 className="mt-1 text-xl font-black text-ink-50">{chosenTemplate.title}</h2><p className="mt-2 text-sm text-ink-500">{chosenTemplate.blurb}</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-ink-500 sm:col-span-2">Challenge title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Starts<input type="date" value={form.startsOn} onChange={(event) => setForm({ ...form, startsOn: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Ends<input type="date" value={form.endsOn} onChange={(event) => setForm({ ...form, endsOn: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Shared goal<input type="number" value={form.goal} onChange={(event) => setForm({ ...form, goal: Number(event.target.value) })} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Unit<input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-medium text-ink-500">Participation<select value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value })} className="input-field mt-1"><option>Schoolwide collective</option><option>Teams/departments</option><option>Individual goals + school total</option></select></label><label className="text-xs font-medium text-ink-500">Public ranking<select value={form.leaderboard} onChange={(event) => setForm({ ...form, leaderboard: event.target.value })} className="input-field mt-1"><option value="off">No individual leaderboard</option><option value="team">Team totals only</option><option value="opt_in">Opt-in individual recognition</option></select></label></div><div className="mt-5 rounded-2xl bg-emerald-500/5 p-4"><p className="text-xs font-black uppercase text-emerald-400">Built-in adaptation</p><p className="mt-2 text-sm leading-relaxed text-ink-400">{chosenTemplate.alternative}</p></div></section><aside className="card p-6"><div className="flex items-start justify-between gap-3"><div><p className="label-eyebrow">Staff and teams</p><p className="mt-1 text-xs leading-relaxed text-ink-500">Paste “Name | Team” or two CSV columns. Only the organizer sees individual progress.</p></div><Users size={20} className="text-emerald-400" /></div><textarea value={staffRaw} onChange={(event) => setStaffRaw(event.target.value)} rows="12" className="input-field mt-4 resize-y font-mono text-xs" /><p className="mt-2 text-xs font-bold text-emerald-400">{parseStaffList(staffRaw).length} staff members ready</p><button type="submit" disabled={saving === 'create'} className="btn-primary mt-5 w-full">{saving === 'create' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Launch challenge</button></aside></form>}

    {selected && view === 'overview' && <section className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="card p-5"><p className="label-eyebrow">Shared progress</p><p className="mt-2 text-3xl font-black text-ink-50">{total}</p><p className="text-xs text-ink-500">of {selected.settings.goal} {selected.settings.unit}</p></div><div className="card p-5"><p className="label-eyebrow">Goal reached</p><p className="mt-2 text-3xl font-black text-emerald-400">{percent}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-800"><div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} /></div></div><div className="card p-5"><p className="label-eyebrow">Participation</p><p className="mt-2 text-3xl font-black text-ink-50">{participating}/{participants.length}</p><p className="text-xs text-ink-500">staff with progress logged</p></div><div className="card p-5"><p className="label-eyebrow">Privacy</p><p className="mt-2 text-lg font-black text-ink-50">Individual results private</p><p className="mt-1 text-xs text-ink-500">Public ranking: {selected.settings.leaderboard === 'off' ? 'off' : selected.settings.leaderboard}</p></div></div><section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><Link2 size={18} className="text-emerald-400" /><h2 className="font-black text-ink-50">Staff phone check-in form</h2></div><p className="mt-2 text-sm text-ink-500">Share this link or turn it into a QR code. Staff do not need a PlansK12 account; submissions wait for your approval.</p><p className="mt-3 break-all rounded-xl border border-ink-800 bg-ink-950 p-3 font-mono text-xs text-emerald-300">{checkInLink}</p></div><div className="flex shrink-0 gap-2"><button onClick={copyCheckInLink} className="btn-secondary">{copied === 'link' ? <Check size={15} /> : <Clipboard size={15} />}{copied === 'link' ? 'Copied' : 'Copy link'}</button><Link to={`/wellness-check-in/${selected.public_token}`} className="btn-primary">Open form</Link></div></div></section><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className="card p-6"><h2 className="font-black text-ink-50">Team/department totals</h2><div className="mt-4 space-y-3">{teams.map((team) => <div key={team.name} className="rounded-xl border border-ink-800 p-4"><div className="flex justify-between"><span className="font-bold text-ink-100">{team.name}</span><span className="font-black text-emerald-400">{team.total} {selected.settings.unit}</span></div><p className="mt-1 text-xs text-ink-500">{team.people} staff members · aggregate display only</p></div>)}</div></section><section className="card p-6"><h2 className="font-black text-ink-50">Why this works</h2><p className="mt-3 text-sm leading-relaxed text-ink-400">{selected.settings.blurb}</p><div className="mt-4 rounded-2xl bg-emerald-500/5 p-4"><p className="text-xs font-black uppercase text-emerald-400">Inclusive option</p><p className="mt-2 text-sm leading-relaxed text-ink-400">{selected.settings.alternative}</p></div></section></div></section>}

    {selected && view === 'submissions' && <section className="card overflow-hidden"><div className="border-b border-ink-800 p-5 sm:p-6"><h2 className="text-xl font-black text-ink-50">Staff submission inbox</h2><p className="mt-1 text-sm text-ink-500">Review phone-form submissions before adding them to challenge totals.</p></div>{checkIns.length ? <div className="divide-y divide-ink-800">{checkIns.map((item) => <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-bold text-ink-100">{item.participant_label}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{item.status}</span></div><p className="mt-1 text-xs text-ink-500">{item.team_label || 'No team'} · {item.activity_type}</p></div><div className="flex items-center gap-3"><strong className="text-xl text-emerald-400">+{item.amount} {selected.settings.unit}</strong>{item.status === 'pending' && <button onClick={() => approveCheckIn(item)} disabled={saving === item.id} className="btn-primary">{saving === item.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Approve</button>}</div></div>)}</div> : <div className="p-10 text-center"><Inbox size={34} className="mx-auto text-emerald-400" /><p className="mt-3 font-bold text-ink-100">No submissions yet</p><p className="mt-1 text-sm text-ink-500">Share the check-in link from Overview. New entries will appear here.</p></div>}</section>}

    {selected && view === 'track' && <section className="card overflow-hidden"><div className="border-b border-ink-800 p-5 sm:p-6"><h2 className="text-xl font-black text-ink-50">Organizer progress entry</h2><p className="mt-1 text-sm text-ink-500">Use the quick buttons after staff submissions. Individual results remain private.</p></div><div className="divide-y divide-ink-800">{participants.map((person) => <div key={person.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-ink-100">{person.name}</p><p className="text-xs text-ink-500">{person.team}</p></div><div className="flex items-center gap-2"><span className="mr-2 min-w-16 text-right text-lg font-black text-emerald-400">{selected.progress?.[person.id] ?? 0}</span><button aria-label={`Subtract 1 for ${person.name}`} onClick={() => addProgress(person, -1)} className="btn-secondary">−1</button><button aria-label={`Add 1 for ${person.name}`} onClick={() => addProgress(person, 1)} className="btn-secondary">+1</button><button aria-label={`Add 5 for ${person.name}`} onClick={() => addProgress(person, 5)} className="btn-primary">+5</button>{saving === person.id && <Loader2 size={15} className="animate-spin text-emerald-400" />}</div></div>)}</div></section>}

    {selected && view === 'bingo' && <section className="grid gap-6 xl:grid-cols-[1fr_320px]"><div className="overflow-x-auto rounded-3xl border border-ink-800 bg-white p-5"><div className="grid min-w-[700px] grid-cols-5 border-l-2 border-t-2 border-emerald-500">{selected.bingo.map((square,index) => <div key={`${square}-${index}`} className={`flex min-h-32 items-center justify-center border-b-2 border-r-2 border-emerald-500 p-3 text-center text-xs font-bold leading-5 text-slate-800 ${index === 12 ? 'bg-emerald-100 text-emerald-900' : ''}`}>{square}</div>)}</div></div><aside className="card p-6"><p className="label-eyebrow">Bingo builder</p><h2 className="mt-1 text-xl font-black text-ink-50">{BINGO_PROMPTS.length} inclusive prompts</h2><p className="mt-3 text-sm leading-relaxed text-ink-500">Each card mixes movement, mobility, recovery, mindfulness, connection, outdoors, and everyday wellness. Staff may adapt any square.</p><button onClick={regenerateBingo} disabled={saving === 'bingo'} className="btn-secondary mt-5 w-full"><RefreshCw size={15} className={saving === 'bingo' ? 'animate-spin' : ''} /> Generate a different card</button></aside></section>}

    {selected && view === 'messages' && <section className="grid gap-4 lg:grid-cols-3">{[['launch','Launch email'],['reminder','Reminder'],['results','Results message']].map(([key,title]) => <article key={key} className="card p-5"><div className="flex items-center justify-between"><h2 className="font-black text-ink-50">{title}</h2><button onClick={() => copyMessage(key)} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">{copied === key ? <Check size={13} /> : <Clipboard size={13} />}{copied === key ? 'Copied' : 'Copy'}</button></div><textarea value={selected.messages[key]} onChange={(event) => setChallenges((current) => current.map((item) => item.id === selected.id ? { ...item, messages: { ...item.messages, [key]: event.target.value } } : item))} rows="16" className="input-field mt-4 resize-y text-xs leading-5" /></article>)}</section>}

    {selected && <StaffWellnessPrintKit challenge={selected} total={total} participantCount={participating} />}
  </div>
}
