import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Check, Clipboard, Drama, Loader2, Music2, Printer, Save, Sparkles, Wind, Atom, Briefcase, Circle, CheckCircle2, Trophy, Globe2, Blocks, Languages, Lightbulb, Target, School } from 'lucide-react'
import { EXPERIENCE_CONFIGS, applyExperienceTemplate, buildExperiencePlan } from '../lib/specialtyExperiences'
import { SPECIALTY_CONTEXTS } from '../constants/moduleHomes'
import { createSpecialtyExperience, listSpecialtyExperiences, updateSpecialtyExperience } from '../services/specialtyExperienceService'
import { trackToolUsage } from '../services/productUsageService'
import FieldDayPlanner from './FieldDayPlanner'

const ACCENTS = {
  cyan: { hero: 'border-cyan-500/25 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/10', soft: 'border-cyan-500/25 bg-cyan-500/10', text: 'text-cyan-400', button: 'bg-cyan-500 text-ink-950 hover:bg-cyan-400' },
  violet: { hero: 'border-violet-500/25 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-indigo-500/10', soft: 'border-violet-500/25 bg-violet-500/10', text: 'text-violet-400', button: 'bg-violet-500 text-white hover:bg-violet-400' },
  rose: { hero: 'border-rose-500/25 bg-gradient-to-br from-rose-500/20 via-red-500/10 to-orange-500/10', soft: 'border-rose-500/25 bg-rose-500/10', text: 'text-rose-400', button: 'bg-rose-500 text-white hover:bg-rose-400' },
  amber: { hero: 'border-amber-500/25 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-lime-500/10', soft: 'border-amber-500/25 bg-amber-500/10', text: 'text-amber-400', button: 'bg-amber-500 text-ink-950 hover:bg-amber-400' },
  pink: { hero: 'border-pink-500/25 bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-purple-500/10', soft: 'border-pink-500/25 bg-pink-500/10', text: 'text-pink-400', button: 'bg-pink-500 text-white hover:bg-pink-400' },
  emerald: { hero: 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/10', soft: 'border-emerald-500/25 bg-emerald-500/10', text: 'text-emerald-400', button: 'bg-emerald-500 text-ink-950 hover:bg-emerald-400' },
}

const ICONS = {
  'pe-events': Trophy,
  'stem-night': Atom,
  'music-concert': Music2,
  'theater-production': Drama,
  'dance-recital': Wind,
  'cte-experiences': Briefcase,
  'world-language-experiences': Globe2,
  'early-family-events': Blocks,
  'esl-family-night': Languages,
  'gifted-showcase': Lightbulb,
  'test-prep-family-support': Target,
  'open-house': School,
}
const PRINTABLES = [
  ['master', 'Master plan', 'All editable preparation sections'],
  ['run', 'Run of show', 'Times, activities, and responsible leads'],
  ['roles', 'Roles & volunteers', 'A fillable staffing assignment sheet'],
  ['family', 'Family communication', 'Invitation plus arrival and access reminders'],
  ['complete', 'Complete event kit', 'Every planning and communication page'],
]

function completion(plan) {
  const items = plan.sections.flatMap((section) => section.items)
  const done = items.filter((item) => item.done).length
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 }
}

function PrintKit({ config, inputs, plan, printable }) {
  const show = (key) => printable === key || printable === 'complete'
  return <article className="specialty-experience-print hidden bg-white p-8 text-slate-900 print:block">
    <header className="border-b-4 border-slate-900 pb-4">
      <p className="text-xs font-black uppercase tracking-[.2em]">PlansK12 · {config.moduleLabel}</p>
      <h1 className="mt-1 text-3xl font-black">{plan.title}</h1>
      <p className="mt-2 text-sm">{inputs.date} · {inputs.time} · {inputs.location}</p>
      <p className="mt-1 text-sm">Focus: {plan.focus}</p>
    </header>
    {show('master') && <section className="mt-6 space-y-5"><h2 className="text-xl font-black">Master planning checklist</h2>{plan.sections.map((section) => <div key={section.title}><h3 className="font-bold">{section.title}</h3>{section.items.map((item) => <p key={item.text} className="mt-1 text-sm">{item.done ? '☑' : '☐'} {item.text}</p>)}</div>)}</section>}
    {show('run') && <section className="mt-6 break-before-page"><h2 className="text-xl font-black">Run of show</h2><table className="mt-3 w-full border-collapse text-left text-sm"><thead><tr><th className="border p-2">Time</th><th className="border p-2">Activity or cue</th><th className="border p-2">Lead</th></tr></thead><tbody>{plan.schedule.map((row, index) => <tr key={`${row.time}-${index}`}><td className="border p-2">{row.time}</td><td className="border p-2">{row.activity}</td><td className="border p-2">{row.lead}</td></tr>)}</tbody></table></section>}
    {show('roles') && <section className="mt-6 break-before-page"><h2 className="text-xl font-black">Roles & volunteers</h2>{plan.roles.map((row) => <div key={row.role} className="mt-3 flex border-b pb-2 text-sm"><strong className="w-1/2">{row.role}</strong><span>{row.person || '____________________________'}</span></div>)}</section>}
    {show('family') && <section className="mt-6 break-before-page"><h2 className="text-xl font-black">Family communication</h2><p className="mt-3 whitespace-pre-line text-sm leading-6">{plan.invitation}</p><div className="mt-6 rounded-xl border p-4 text-sm"><strong>Before sending, add:</strong><p>□ Parking and entrance · □ Accessibility contact · □ Arrival/pickup · □ Photo policy · □ What to bring or wear</p></div></section>}
    {show('complete') && <section className="mt-6 break-before-page"><h2 className="text-xl font-black">Reflection & improvement</h2><p className="mt-3 text-sm">What worked well? ____________________________________________________________</p><p className="mt-4 text-sm">What should change next time? __________________________________________________</p><p className="mt-4 text-sm">Student/family/partner feedback themes: __________________________________________</p></section>}
  </article>
}

export default function SpecialtyExperienceStudio({ experienceKey }) {
  const config = EXPERIENCE_CONFIGS[experienceKey]
  const { search } = useLocation()
  const requestedModule = new URLSearchParams(search).get('module')
  const requestedEntry = requestedModule === 'PE & Health'
    ? ['pe-health', { title: 'PE & Health' }]
    : Object.entries(SPECIALTY_CONTEXTS).find(([, moduleConfig]) => requestedModule === moduleConfig.moduleLabel || requestedModule === moduleConfig.title)
  const workspacePath = experienceKey === 'open-house' && requestedEntry ? `/${requestedEntry[0]}` : (config.workspacePath ?? `/${config.moduleSlug}`)
  const workspaceLabel = experienceKey === 'open-house' && requestedEntry ? `${requestedEntry[1].title} workspace` : (config.workspaceLabel ?? `${config.moduleLabel} workspace`)
  const activeModuleLabel = experienceKey === 'open-house' && requestedModule ? requestedModule : config.moduleLabel
  const initialInputs = useMemo(() => applyExperienceTemplate(experienceKey, config.templates[0].id, config.defaults), [config, experienceKey])
  const [inputs, setInputs] = useState(initialInputs)
  const [plan, setPlan] = useState(() => buildExperiencePlan(experienceKey, initialInputs))
  const [saved, setSaved] = useState([])
  const [savedId, setSavedId] = useState('')
  const [status, setStatus] = useState('active')
  const [tab, setTab] = useState(() => experienceKey === 'pe-events' && new URLSearchParams(search).get('view') === 'stations' ? 'stations' : 'plan')
  const [printable, setPrintable] = useState('master')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const accent = ACCENTS[config.accent]
  const Icon = ICONS[experienceKey]
  const progress = completion(plan)

  useEffect(() => { listSpecialtyExperiences(experienceKey, experienceKey === 'open-house' ? activeModuleLabel : null).then(setSaved).catch((error) => setMessage(error.message)) }, [activeModuleLabel, experienceKey])

  function chooseTemplate(templateId) {
    const next = applyExperienceTemplate(experienceKey, templateId, inputs)
    setInputs(next)
    setPlan(buildExperiencePlan(experienceKey, next))
    setSavedId('')
    setStatus('active')
    setMessage('Template loaded — every detail is editable')
    void trackToolUsage(experienceKey, 'template_selected', { moduleLabel: activeModuleLabel, metadata: { templateId } })
  }

  function rebuild() {
    setPlan(buildExperiencePlan(experienceKey, inputs))
    setMessage('Plan rebuilt from your event details')
  }

  function newPlan() {
    setInputs(initialInputs)
    setPlan(buildExperiencePlan(experienceKey, initialInputs))
    setSavedId('')
    setStatus('active')
    setTab('plan')
    setMessage('New plan ready')
  }

  function loadPlan(id) {
    if (!id) { newPlan(); return }
    const row = saved.find((item) => item.id === id)
    if (!row) return
    setSavedId(id)
    setInputs(row.inputs)
    setPlan(row.plan)
    setStatus(row.status)
    setMessage('Saved plan opened')
    void trackToolUsage(experienceKey, 'reopened', { moduleLabel: activeModuleLabel })
  }

  async function savePlan(nextStatus = status) {
    setSaving(true)
    setMessage('')
    try {
      const values = { experienceType: experienceKey, moduleLabel: activeModuleLabel, title: inputs.title, inputs, plan, status: nextStatus }
      const wasSaved = Boolean(savedId)
      const row = wasSaved ? await updateSpecialtyExperience(savedId, values) : await createSpecialtyExperience(values)
      setSavedId(row.id)
      setStatus(row.status)
      setSaved((current) => [row, ...current.filter((item) => item.id !== row.id)])
      setMessage(nextStatus === 'completed' ? 'Marked complete and saved' : 'Saved in PlansK12')
      const action = nextStatus === 'completed' ? 'completed' : nextStatus === 'active' && status === 'completed' ? 'reopened' : wasSaved ? 'updated' : 'created'
      void trackToolUsage(experienceKey, action, { moduleLabel: activeModuleLabel, metadata: { status: nextStatus } })
    } catch (error) { setMessage(error.message) } finally { setSaving(false) }
  }

  function updateChecklist(sectionIndex, itemIndex, changes) {
    setPlan((current) => ({ ...current, sections: current.sections.map((section, s) => s === sectionIndex ? { ...section, items: section.items.map((item, i) => i === itemIndex ? { ...item, ...changes } : item) } : section) }))
  }

  function updateSchedule(index, key, value) {
    setPlan((current) => ({ ...current, schedule: current.schedule.map((row, i) => i === index ? { ...row, [key]: value } : row) }))
  }

  function updateRole(index, person) {
    setPlan((current) => ({ ...current, roles: current.roles.map((row, i) => i === index ? { ...row, person } : row) }))
  }

  async function copyInvitation() {
    try { await navigator.clipboard.writeText(plan.invitation); setCopied(true); void trackToolUsage(experienceKey, 'copied', { moduleLabel: activeModuleLabel, metadata: { source: 'invitation' } }); window.setTimeout(() => setCopied(false), 1500) } catch { setMessage('Copy is unavailable here — select the message and copy it manually.') }
  }

  return <div className="space-y-7">
    <style>{`@media print { body * { visibility: hidden !important; } .specialty-experience-print, .specialty-experience-print * { visibility: visible !important; } .specialty-experience-print { display: block !important; position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; } }`}</style>
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link to={workspacePath} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> {workspaceLabel}</Link>
      <div className="flex gap-2"><button type="button" onClick={newPlan} className="btn-secondary"><Sparkles size={15} /> New</button><button type="button" onClick={() => savePlan()} disabled={saving} className="btn-primary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{message === 'Saved in PlansK12' ? 'Saved' : 'Save plan'}</button></div>
    </div>

    <section className={`relative overflow-hidden rounded-3xl border p-5 print:hidden sm:p-8 ${accent.hero}`}>
      <div className="relative flex items-start gap-4"><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink-950/30 ${accent.text}`}><Icon size={28} /></div><div><p className={`text-xs font-bold uppercase tracking-[.16em] ${accent.text}`}>{config.eyebrow}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-50">{config.shortTitle}</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">{config.description}</p></div></div>
    </section>

    <section className="card p-5 print:hidden"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="label-eyebrow">Choose a proven starting point</p><h2 className="mt-1 text-lg font-semibold text-ink-100">Built for the real work behind the experience</h2></div><select value={savedId} onChange={(event) => loadPlan(event.target.value)} className="input-field max-w-xs" aria-label="Saved plans"><option value="">New plan</option>{saved.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</select></div><div className="mt-4 grid gap-3 md:grid-cols-3">{config.templates.map((template) => <button key={template.id} type="button" onClick={() => chooseTemplate(template.id)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-ink-600 ${inputs.templateId === template.id ? accent.soft : 'border-ink-800 bg-ink-950/30'}`}><p className={`font-bold ${accent.text}`}>{template.title}</p><p className="mt-1 text-xs leading-5 text-ink-500">{template.description}</p></button>)}</div></section>

    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] print:hidden">
      <aside className="space-y-4"><section className="card space-y-4 p-5"><div><p className="label-eyebrow">Your details</p><p className="mt-1 text-xs text-ink-500">Change the basics, then rebuild your complete plan.</p></div>{[['title','Title'],['location','Location'],['audience','Audience'],['focus','Learning or performance focus']].map(([key,label]) => <label key={key} className="block text-xs font-medium text-ink-500">{label}<input value={inputs[key]} onChange={(event) => setInputs({ ...inputs, [key]: event.target.value })} className="input-field mt-1" /></label>)}<div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium text-ink-500">Date<input type="date" value={inputs.date} onChange={(event) => setInputs({ ...inputs, date: event.target.value })} className="input-field mt-1" /></label><label className="block text-xs font-medium text-ink-500">Time<input value={inputs.time} onChange={(event) => setInputs({ ...inputs, time: event.target.value })} className="input-field mt-1" /></label></div><label className="block text-xs font-medium text-ink-500">Expected participants<input type="number" min="1" value={inputs.participants} onChange={(event) => setInputs({ ...inputs, participants: Number(event.target.value) })} className="input-field mt-1" /></label><button type="button" onClick={rebuild} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${accent.button}`}><Sparkles size={16} /> Build my plan</button></section><section className={`rounded-2xl border p-4 ${accent.soft}`}><p className={`text-xs font-bold uppercase tracking-wide ${accent.text}`}>Preparation progress</p><p className="mt-2 text-3xl font-black text-ink-50">{progress.percent}%</p><p className="text-xs text-ink-500">{progress.done} of {progress.total} tasks complete</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-900"><div className={`h-full ${accent.button.split(' ')[0]}`} style={{ width: `${progress.percent}%` }} /></div>{message && <p className="mt-3 text-xs text-ink-500">{message}</p>}</section></aside>

      <main className="space-y-5"><div className="flex flex-wrap gap-2">{[...(experienceKey === 'pe-events' ? [['stations','Games & stations']] : []),['plan','Plan checklist'],['run','Run of show'],['communication','Communication'],['print','Print kit']].map(([key,label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab === key ? `${accent.soft} ${accent.text}` : 'border-ink-800 text-ink-500 hover:text-ink-200'}`}>{label}</button>)}</div>
        {tab === 'stations' && experienceKey === 'pe-events' && <section className="card p-5"><div className={`mb-5 rounded-2xl border p-4 ${accent.soft}`}><p className={`text-xs font-bold uppercase tracking-wide ${accent.text}`}>Field Day activity builder</p><p className="mt-1 text-sm text-ink-500">Generate a complete rotation plan or document one new station. Saved Field Day plans remain available here.</p></div><FieldDayPlanner embedded /></section>}
        {tab === 'plan' && <div className="space-y-4">{plan.sections.map((section, sectionIndex) => <section key={section.title} className="card p-5"><h2 className={`font-bold ${accent.text}`}>{section.title}</h2><div className="mt-3 space-y-3">{section.items.map((item, itemIndex) => <div key={`${sectionIndex}-${itemIndex}`} className="flex items-start gap-3 rounded-xl border border-ink-800 bg-ink-950/20 p-3"><button type="button" onClick={() => updateChecklist(sectionIndex, itemIndex, { done: !item.done })} aria-label={`${item.done ? 'Mark incomplete' : 'Mark complete'}: ${item.text}`} className={`mt-1 shrink-0 ${item.done ? accent.text : 'text-ink-600'}`}>{item.done ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button><textarea value={item.text} onChange={(event) => updateChecklist(sectionIndex, itemIndex, { text: event.target.value })} rows="2" aria-label={`${section.title} task ${itemIndex + 1}`} className={`min-h-0 w-full resize-y border-0 bg-transparent p-0 text-sm leading-6 outline-none ${item.done ? 'text-ink-600 line-through' : 'text-ink-300'}`} /></div>)}</div></section>)}</div>}
        {tab === 'run' && <div className="space-y-5"><section className="card overflow-x-auto p-5"><div className="mb-4"><p className="label-eyebrow">Editable event-day timeline</p><h2 className="mt-1 text-lg font-semibold text-ink-100">Run of show</h2></div><div className="min-w-[650px] space-y-2">{plan.schedule.map((row, index) => <div key={index} className="grid grid-cols-[120px_minmax(0,1fr)_180px] gap-2"><input value={row.time} onChange={(event) => updateSchedule(index, 'time', event.target.value)} className="input-field" aria-label={`Schedule time ${index + 1}`} /><input value={row.activity} onChange={(event) => updateSchedule(index, 'activity', event.target.value)} className="input-field" aria-label={`Schedule activity ${index + 1}`} /><input value={row.lead} onChange={(event) => updateSchedule(index, 'lead', event.target.value)} className="input-field" aria-label={`Schedule lead ${index + 1}`} /></div>)}</div></section><section className="card p-5"><p className="label-eyebrow">People plan</p><h2 className="mt-1 text-lg font-semibold text-ink-100">Assign roles when you are ready</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{plan.roles.map((row, index) => <label key={row.role} className="rounded-xl border border-ink-800 p-3 text-xs font-semibold text-ink-400">{row.role}<input value={row.person} onChange={(event) => updateRole(index, event.target.value)} placeholder="Name or team" className="input-field mt-2" /></label>)}</div></section></div>}
        {tab === 'communication' && <section className="card p-5"><div className="flex items-center justify-between gap-3"><div><p className="label-eyebrow">Ready-to-personalize message</p><h2 className="mt-1 text-lg font-semibold text-ink-100">Family, audience, or partner invitation</h2></div><button type="button" onClick={copyInvitation} className={`inline-flex items-center gap-1 text-xs font-bold ${accent.text}`}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? 'Copied' : 'Copy'}</button></div><textarea value={plan.invitation} onChange={(event) => setPlan({ ...plan, invitation: event.target.value })} rows="12" className="input-field mt-4 resize-y text-sm leading-6" /><div className={`mt-4 rounded-xl border p-4 text-xs leading-5 text-ink-500 ${accent.soft}`}><strong className={accent.text}>Privacy reminder:</strong> Keep student health, disability, contact, evaluation, and placement information in district-approved systems—not in invitations or public printables.</div></section>}
        {tab === 'print' && <section className="card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="label-eyebrow">Complete resource kit</p><h2 className="mt-1 text-lg font-semibold text-ink-100">Print only what you need</h2></div><button type="button" onClick={() => { void trackToolUsage(experienceKey, 'printed', { moduleLabel: activeModuleLabel, metadata: { printable } }); window.print() }} className="btn-primary"><Printer size={15} /> Print or save PDF</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{PRINTABLES.map(([key,title,desc]) => <button key={key} type="button" onClick={() => setPrintable(key)} className={`rounded-xl border p-4 text-left ${printable === key ? accent.soft : 'border-ink-800'}`}><p className={`font-semibold ${accent.text}`}>{title}</p><p className="mt-1 text-xs text-ink-500">{desc}</p></button>)}</div><div className={`mt-5 rounded-2xl border p-5 ${accent.soft}`}><p className={`text-xs font-black uppercase tracking-wide ${accent.text}`}>Preview: {PRINTABLES.find(([key]) => key === printable)?.[1]}</p><h3 className="mt-2 text-xl font-black text-ink-50">{plan.title}</h3><p className="mt-1 text-sm text-ink-500">{plan.subtitle}</p><p className="mt-4 text-sm text-ink-300">The printed version is clean, ink-friendly, and includes the sections selected above.</p></div></section>}
        <section className="card flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-sm font-semibold text-ink-200">{status === 'completed' ? 'This plan is complete and remains saved.' : 'Finished planning this experience?'}</p><p className="text-xs text-ink-500">You can reopen it, reuse the printables, and improve next year’s version.</p></div><button type="button" onClick={() => savePlan(status === 'completed' ? 'active' : 'completed')} className="btn-secondary">{status === 'completed' ? 'Reopen plan' : 'Mark complete'}</button></section>
      </main>
    </div>
    <PrintKit config={config} inputs={inputs} plan={plan} printable={printable} />
  </div>
}
