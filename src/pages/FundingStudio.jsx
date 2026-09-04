import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, BadgeDollarSign, BookOpenCheck, CalendarClock, Check, CheckCircle2, Clipboard,
  Download, ExternalLink, FileSearch, FileText, Loader2, Plus, Save, Search,
  ShieldCheck, Sparkles, Trash2, TriangleAlert, X,
} from 'lucide-react'
import { MODULES } from '../constants/modules'
import { US_STATES } from '../constants/usStates'
import {
  createGrantProject, fetchGrantOpportunity, generateGrantDraft, listGrantProjects,
  searchGrantOpportunities, updateGrantProject,
} from '../services/grantFundingService'
import { trackToolUsage, trackToolOpened } from '../services/productUsageService'

const GENERAL = 'General / Schoolwide'
const NEEDS = ['Equipment & supplies', 'Student programs', 'Field trips & events', 'Technology', 'Arts & performances', 'Health & wellness', 'Career pathways & internships', 'Family engagement', 'Professional development', 'Accessibility & inclusion']
const GRADE_BANDS = ['K–12', 'Elementary School', 'Middle School', 'High School']
const SCHOOL_TYPES = ['Public School', 'Private School']
const TITLE_I_OPTIONS = ['Not specified', 'Title I school', 'Not a Title I school']
const STATUSES = [['saved', 'Saved'], ['drafting', 'Drafting'], ['ready', 'Ready to review'], ['submitted', 'Submitted'], ['awarded', 'Awarded'], ['not_fit', 'Not a fit']]
const EMPTY_MANUAL = { title: '', funder: '', sourceUrl: '', closeDate: '', amountText: '', eligibilitySummary: '', officialRequirements: '' }
const EMPTY_INPUTS = {
  projectTitle: '', organization: '', projectLead: '', studentsServed: '', requestedAmount: '', targetDate: '',
  gradeBand: 'K–12', schoolType: 'Public School', titleIStatus: 'Not specified', freeReducedLunchPercent: '',
  needStatement: '', evidence: '', activities: '', measurement: '', sustainability: '', partners: '',
  officialPriorities: '', budgetItems: [{ category: 'Equipment / materials', description: '', amount: '' }],
}

function dateLabel(value) {
  if (!value) return 'No deadline listed'
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(value) {
  if (!value) return null
  const end = new Date(`${value}T23:59:59`)
  if (Number.isNaN(end.getTime())) return null
  return Math.ceil((end.getTime() - Date.now()) / 86400000)
}

function amountLabel(item) {
  if (item.amountText) return item.amountText
  if (item.awardFloor || item.awardCeiling) return [item.awardFloor, item.awardCeiling].filter(Boolean).join(' – ')
  return 'Review official notice'
}

function sourceBadge(item) {
  if (item.sourceKind === 'monitor' || item.status === 'monitor') return { label: 'Verified watch list', className: 'bg-amber-500/15 text-amber-400' }
  if (item.sourceType === 'federal') return { label: 'Verified federal source', className: 'bg-cyan-500/15 text-cyan-400' }
  return { label: 'Verified educator source', className: 'bg-emerald-500/15 text-emerald-400' }
}

function opportunityStatus(item) {
  if (item.sourceKind === 'monitor' || item.status === 'monitor') return 'Monitor for opening'
  if (item.status === 'forecasted') return 'Forecasted'
  return 'Open / accepting interest'
}

function opportunityReasons(item, moduleLabel, need, gradeBand, schoolType) {
  const text = `${item.title} ${item.description || ''} ${(item.categories || []).join(' ')}`.toLowerCase()
  const reasons = []
  const moduleWords = moduleLabel.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 3)
  if (moduleWords.some((word) => text.includes(word))) reasons.push(`Mentions a ${moduleLabel} priority`)
  if (need && text.includes(need.split(' ')[0].toLowerCase())) reasons.push(`Connected to ${need.toLowerCase()}`)
  if ((item.eligibility || []).some((value) => /school|education|district/i.test(value))) reasons.push('School-related applicant type appears')
  if (schoolType) reasons.push(`Check official ${schoolType.toLowerCase()} eligibility`)
  if (gradeBand && gradeBand !== 'K–12' && text.includes(gradeBand.split(' ')[0].toLowerCase())) reasons.push(`Mentions the ${gradeBand.toLowerCase()} level`)
  if (!reasons.length) reasons.push('Keyword match—eligibility still needs review')
  return reasons.slice(0, 2)
}

function projectAsOpportunity(project) {
  return {
    id: project.external_id || project.id, externalId: project.external_id, opportunityNumber: project.opportunity_number,
    title: project.title, agency: project.funder, sourceUrl: project.source_url, sourceType: project.source_type,
    openDate: project.open_date, closeDate: project.close_date, amountText: project.amount_text,
    eligibility: project.eligibility_summary ? [project.eligibility_summary] : [], description: project.finder_data?.description || '',
    officialRequirements: project.official_requirements,
  }
}

function draftText(project, draft) {
  if (!draft || !Object.keys(draft).length) return ''
  const lines = [project?.title || 'Grant Application Draft', project?.funder ? `Funder: ${project.funder}` : '', '']
  const section = (title, value) => {
    if (!value) return
    lines.push(title.toUpperCase(), Array.isArray(value) ? value.map((item) => `• ${typeof item === 'string' ? item : `${item.period}: ${item.action}`}`).join('\n') : value, '')
  }
  section('Executive Summary', draft.executive_summary)
  section('Needs Statement', draft.needs_statement)
  section('Goals & Objectives', draft.goals_objectives)
  section('Project Design', draft.project_design)
  section('Evaluation Plan', draft.evaluation_plan)
  section('Sustainability', draft.sustainability)
  section('Budget Narrative', draft.budget_narrative)
  section('Timeline', draft.timeline)
  section('Compliance Checklist', draft.compliance_checklist)
  section('Questions to Resolve', draft.questions_to_resolve)
  return lines.filter((line) => line !== null).join('\n')
}

function TabButton({ active, icon: Icon, children, onClick, count }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${active ? 'bg-emerald-500 text-ink-950 shadow-sm' : 'border border-ink-800 bg-white text-ink-500 hover:text-ink-100 dark:bg-ink-950'}`}><Icon size={16} />{children}{count != null && <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-ink-950/15' : 'bg-ink-900'}`}>{count}</span>}</button>
}

function StatusPill({ status }) {
  const label = STATUSES.find(([key]) => key === status)?.[1] || status
  const cls = status === 'awarded' ? 'bg-emerald-500/15 text-emerald-400' : status === 'submitted' ? 'bg-violet-500/15 text-violet-400' : status === 'ready' ? 'bg-cyan-500/15 text-cyan-400' : status === 'not_fit' ? 'bg-ink-800 text-ink-500' : 'bg-amber-500/15 text-amber-400'
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span>
}

export default function FundingStudio() {
  const [searchParams] = useSearchParams()
  const requestedModule = searchParams.get('module') || GENERAL
  const [tab, setTab] = useState('finder')
  const [filters, setFilters] = useState({ keyword: '', moduleLabel: requestedModule, need: '', state: '', gradeBand: 'K–12', schoolType: 'Public School', titleIStatus: 'Not specified', freeReducedLunchPercent: '' })
  const [results, setResults] = useState([])
  const [hitCount, setHitCount] = useState(0)
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [projects, setProjects] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [inputs, setInputs] = useState(EMPTY_INPUTS)
  const [draft, setDraft] = useState({})
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState(EMPTY_MANUAL)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    trackToolOpened('funding-studio', { moduleLabel: requestedModule })
    listGrantProjects().then(setProjects).catch((error) => setMessage(error.message))
  }, [requestedModule])

  const totalBudget = useMemo(() => (inputs.budgetItems || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0), [inputs.budgetItems])
  const urgent = projects.filter((project) => { const days = daysUntil(project.close_date); return days != null && days >= 0 && days <= 30 && !['submitted', 'awarded', 'not_fit'].includes(project.status) }).length

  async function runSearch(event) {
    event?.preventDefault()
    setSearching(true); setMessage('')
    try {
      const response = await searchGrantOpportunities({ ...filters, rows: 18 })
      setResults(response.opportunities || []); setHitCount(response.hitCount || 0); setSearched(true)
      void trackToolUsage('funding-studio', 'updated', { moduleLabel: filters.moduleLabel, metadata: { source: 'verified-funding-search' } })
    } catch (error) { setMessage(error.message) } finally { setSearching(false) }
  }

  async function saveOpportunity(item) {
    setBusy(item.id); setMessage('')
    try {
      const existing = projects.find((project) => project.external_id && project.external_id === String(item.externalId || item.id))
      if (existing) { setMessage('That opportunity is already saved.'); setTab('saved'); return }
      let detailed = item
      if (item.sourceType === 'federal') {
        try { detailed = (await fetchGrantOpportunity(item.externalId || item.id)).opportunity || item } catch { /* save the verified search record */ }
      }
      const saved = await createGrantProject({
        moduleLabel: filters.moduleLabel, gradeBand: filters.gradeBand, schoolType: filters.schoolType,
        titleIStatus: filters.titleIStatus, freeReducedLunchPercent: filters.freeReducedLunchPercent,
        sourceType: detailed.sourceType || 'private', externalId: String(detailed.externalId || detailed.id),
        opportunityNumber: detailed.opportunityNumber, title: detailed.title, funder: detailed.agency, sourceUrl: detailed.sourceUrl,
        openDate: detailed.openDate, closeDate: detailed.closeDate, amountText: amountLabel(detailed),
        eligibilitySummary: (detailed.eligibility || []).join('; '), officialRequirements: detailed.officialRequirements || detailed.description || '',
        finderData: detailed,
      })
      setProjects((current) => [saved, ...current]); setMessage('Opportunity saved—open it when you are ready to write.')
      void trackToolUsage('funding-studio', 'created', { moduleLabel: filters.moduleLabel, metadata: { source: detailed.sourceType || 'private' } })
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  async function saveManual(event) {
    event.preventDefault(); setBusy('manual'); setMessage('')
    try {
      const saved = await createGrantProject({ ...manual, moduleLabel: filters.moduleLabel, gradeBand: filters.gradeBand, schoolType: filters.schoolType, titleIStatus: filters.titleIStatus, freeReducedLunchPercent: filters.freeReducedLunchPercent, sourceType: 'manual' })
      setProjects((current) => [saved, ...current]); setManual(EMPTY_MANUAL); setManualOpen(false); setMessage('Local or private opportunity saved.'); setTab('saved')
      void trackToolUsage('funding-studio', 'created', { moduleLabel: filters.moduleLabel, metadata: { source: 'manual' } })
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  function openWriter(project) {
    setActiveProject(project); setInputs({ ...EMPTY_INPUTS, gradeBand: project.grade_band || 'K–12', schoolType: project.school_type || 'Public School', titleIStatus: project.title_i_status || 'Not specified', freeReducedLunchPercent: project.free_reduced_lunch_percent ?? '', ...(project.application_inputs || {}), budgetItems: project.application_inputs?.budgetItems?.length ? project.application_inputs.budgetItems : EMPTY_INPUTS.budgetItems }); setDraft(project.draft || {}); setTab('writer'); setMessage('')
  }

  async function saveWorkspace({ quiet = false } = {}) {
    if (!activeProject) { setMessage('Save or add a grant opportunity first.'); return null }
    setBusy('save')
    try {
      const status = Object.keys(draft).length ? 'drafting' : activeProject.status
      const updated = await updateGrantProject(activeProject.id, { application_inputs: inputs, draft, status })
      setActiveProject(updated); setProjects((current) => current.map((project) => project.id === updated.id ? updated : project))
      if (!quiet) setMessage('Grant workspace saved in PlansK12.')
      void trackToolUsage('funding-studio', 'updated', { moduleLabel: updated.module_label })
      return updated
    } catch (error) { setMessage(error.message); return null } finally { setBusy('') }
  }

  async function buildDraft() {
    if (!activeProject) { setMessage('Choose a saved opportunity first.'); return }
    if (!inputs.needStatement.trim() || !inputs.activities.trim()) { setMessage('Add the need and planned activities before building the draft.'); return }
    setBusy('generate'); setMessage('')
    try {
      const result = await generateGrantDraft({
        opportunity: { ...projectAsOpportunity(activeProject), officialRequirements: activeProject.official_requirements },
        inputs: { ...inputs, requestedAmount: inputs.requestedAmount || totalBudget, budgetTotal: totalBudget },
      })
      setDraft(result)
      const updated = await updateGrantProject(activeProject.id, { application_inputs: inputs, draft: result, status: 'drafting' })
      setActiveProject(updated); setProjects((current) => current.map((project) => project.id === updated.id ? updated : project)); setMessage('Draft built and saved. Review every fact before submitting.')
      void trackToolUsage('funding-studio', 'created', { moduleLabel: updated.module_label, metadata: { source: 'draft' } })
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  async function changeStatus(project, status) {
    setBusy(project.id)
    try {
      const updated = await updateGrantProject(project.id, { status })
      setProjects((current) => current.map((item) => item.id === updated.id ? updated : item)); if (activeProject?.id === updated.id) setActiveProject(updated)
      void trackToolUsage('funding-studio', status === 'submitted' ? 'completed' : 'updated', { moduleLabel: project.module_label, metadata: { status } })
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  function updateBudget(index, key, value) { setInputs((current) => ({ ...current, budgetItems: current.budgetItems.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) })) }
  function removeBudget(index) { setInputs((current) => ({ ...current, budgetItems: current.budgetItems.filter((_, rowIndex) => rowIndex !== index) })) }
  function addBudget() { setInputs((current) => ({ ...current, budgetItems: [...current.budgetItems, { category: '', description: '', amount: '' }] })) }

  async function copyDraft() { await navigator.clipboard.writeText(draftText(activeProject, draft)); setCopied(true); window.setTimeout(() => setCopied(false), 1500); void trackToolUsage('funding-studio', 'copied', { moduleLabel: activeProject?.module_label }) }
  function downloadDraft() {
    const blob = new Blob([draftText(activeProject, draft)], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${(activeProject?.title || 'grant-draft').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.txt`; link.click(); URL.revokeObjectURL(url); void trackToolUsage('funding-studio', 'exported', { moduleLabel: activeProject?.module_label })
  }

  return <div className="space-y-7">
    <style>{`@media print { body * { visibility:hidden!important } .grant-print,.grant-print * { visibility:visible!important } .grant-print { position:absolute!important; inset:0!important; width:100%!important; color:#111!important; background:#fff!important } .grant-print textarea { border:0!important; color:#111!important; overflow:visible!important } }`}</style>
    <Link to={requestedModule === 'PE & Health' ? '/pe-health' : '/'} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> Back to workspace</Link>
    <section className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-amber-500/10 p-5 sm:p-8">
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400"><BadgeDollarSign size={29} /></div><div><p className="text-xs font-black uppercase tracking-[.16em] text-emerald-400">Find it · plan it · fund it</p><h1 className="mt-1 text-3xl font-black tracking-tight text-ink-50">Funding Finder &amp; Grant Studio</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">Find verified opportunities that teachers and schools can actually pursue, track deadlines, and turn official requirements into a complete working draft.</p></div></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><div className="rounded-xl bg-white/60 p-3 text-center dark:bg-ink-950/45"><p className="text-xl font-black text-ink-50">{projects.length}</p><p className="text-[11px] text-ink-500">Saved grants</p></div><div className="rounded-xl bg-white/60 p-3 text-center dark:bg-ink-950/45"><p className="text-xl font-black text-amber-400">{urgent}</p><p className="text-[11px] text-ink-500">Due in 30 days</p></div><div className="col-span-2 rounded-xl bg-white/60 p-3 text-center dark:bg-ink-950/45 sm:col-span-1"><p className="text-xl font-black text-emerald-400">Official</p><p className="text-[11px] text-ink-500">Sources linked</p></div></div></div>
    </section>
    <div className="flex gap-2 overflow-x-auto pb-1"><TabButton active={tab === 'finder'} icon={FileSearch} onClick={() => setTab('finder')}>Find funding</TabButton><TabButton active={tab === 'saved'} icon={CalendarClock} onClick={() => setTab('saved')} count={projects.length}>Saved &amp; deadlines</TabButton><TabButton active={tab === 'writer'} icon={FileText} onClick={() => setTab('writer')}>Writing studio</TabButton></div>
    {message && <div className="flex items-start justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4 text-sm text-cyan-200"><span>{message}</span><button type="button" aria-label="Dismiss message" onClick={() => setMessage('')}><X size={16} /></button></div>}

    {tab === 'finder' && <div className="space-y-5">
      <section className="card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="label-eyebrow">Teacher &amp; school funding search</p><h2 className="mt-1 text-xl font-black text-ink-100">Find opportunities you can realistically pursue</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-ink-500">Direct educator and school opportunities appear first. Broad government programs are excluded unless school-level applicants clearly qualify.</p></div><button type="button" onClick={() => setManualOpen(true)} className="btn-secondary"><Plus size={15} /> Add local/private grant</button></div>
        <form onSubmit={runSearch} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold text-ink-500 xl:col-span-2">What do you want to fund?<input value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} className="input-field mt-1" placeholder="robotics equipment, art show, reading intervention…" /></label>
          <label className="text-xs font-semibold text-ink-500">Specialty<select value={filters.moduleLabel} onChange={(event) => setFilters({ ...filters, moduleLabel: event.target.value })} className="input-field mt-1"><option>{GENERAL}</option>{MODULES.map((module) => <option key={module.label}>{module.label}</option>)}</select></label>
          <label className="text-xs font-semibold text-ink-500">Funding need<select value={filters.need} onChange={(event) => setFilters({ ...filters, need: event.target.value })} className="input-field mt-1"><option value="">Any funding need</option>{NEEDS.map((need) => <option key={need}>{need}</option>)}</select></label>
          <label className="text-xs font-semibold text-ink-500">Grade band<select value={filters.gradeBand} onChange={(event) => setFilters({ ...filters, gradeBand: event.target.value })} className="input-field mt-1">{GRADE_BANDS.map((gradeBand) => <option key={gradeBand}>{gradeBand}</option>)}</select></label>
          <label className="text-xs font-semibold text-ink-500">School type<select value={filters.schoolType} onChange={(event) => setFilters({ ...filters, schoolType: event.target.value })} className="input-field mt-1">{SCHOOL_TYPES.map((schoolType) => <option key={schoolType}>{schoolType}</option>)}</select></label>
          <label className="text-xs font-semibold text-ink-500">Title I status <span className="font-normal text-ink-600">(optional)</span><select value={filters.titleIStatus} onChange={(event) => setFilters({ ...filters, titleIStatus: event.target.value })} className="input-field mt-1">{TITLE_I_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="text-xs font-semibold text-ink-500">Free/reduced lunch % <span className="font-normal text-ink-600">(optional)</span><input type="number" min="0" max="100" step="0.1" value={filters.freeReducedLunchPercent} onChange={(event) => setFilters({ ...filters, freeReducedLunchPercent: event.target.value })} className="input-field mt-1" placeholder="e.g. 68" /></label>
          <label className="text-xs font-semibold text-ink-500">State context<select value={filters.state} onChange={(event) => setFilters({ ...filters, state: event.target.value })} className="input-field mt-1"><option value="">Any state / national</option>{US_STATES.map((state) => <option key={state.abbr} value={state.name}>{state.name}</option>)}</select></label>
          <div className="md:col-span-2 flex items-center rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-ink-500"><ShieldCheck size={18} className="mr-2 shrink-0 text-amber-400" />These details improve matching and drafting; only the official notice determines eligibility.</div>
          <button disabled={searching} className="btn-primary justify-center self-end">{searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search grants</button>
        </form>
      </section>
      {searched && <div className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="label-eyebrow">Search results</p><h2 className="mt-1 text-xl font-black text-ink-100">{hitCount.toLocaleString()} verified match{hitCount === 1 ? '' : 'es'}</h2></div><p className="text-xs text-ink-500">Official sources · eligibility clearly labeled</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">{filters.gradeBand}</span><span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-400">{filters.schoolType}</span>{filters.titleIStatus !== 'Not specified' && <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">{filters.titleIStatus}</span>}{filters.freeReducedLunchPercent !== '' && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">{filters.freeReducedLunchPercent}% free/reduced lunch</span>}</div></div>}
      <div className="grid gap-4 lg:grid-cols-2">{results.map((item) => { const days = daysUntil(item.closeDate); const reasons = opportunityReasons(item, filters.moduleLabel, filters.need); const badge = sourceBadge(item); return <article key={item.id} className="card flex flex-col p-5"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${badge.className}`}><ShieldCheck size={12} className="mr-1 inline" />{badge.label}</span><span className="rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-bold text-ink-500">{opportunityStatus(item)}</span>{days != null && <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${days <= 30 ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{days < 0 ? 'Deadline passed' : `${days} days left`}</span>}</div><h3 className="mt-4 text-lg font-black leading-snug text-ink-100">{item.title}</h3><p className="mt-1 text-xs font-semibold text-ink-500">{item.agency} · {item.opportunityNumber}</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-400">{item.description || 'Open the official source for the full opportunity description and requirements.'}</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-ink-950 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-ink-600">Deadline</p><p className="mt-1 text-sm font-bold text-ink-200">{item.status === 'monitor' ? 'Watch for next opening' : dateLabel(item.closeDate)}</p></div><div className="rounded-xl bg-ink-950 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-ink-600">Funding</p><p className="mt-1 text-sm font-bold text-ink-200">{amountLabel(item)}</p></div></div><div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-emerald-400">Why it may match</p>{reasons.map((reason) => <p key={reason} className="mt-1 flex items-start gap-1.5 text-xs text-ink-400"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" />{reason}</p>)}</div><div className="mt-auto flex flex-wrap gap-2 pt-5"><button type="button" onClick={() => saveOpportunity(item)} disabled={busy === item.id} className="btn-primary">{busy === item.id ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save opportunity</button><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="btn-secondary">Official source <ExternalLink size={14} /></a></div></article> })}</div>
      {searched && !results.length && <section className="card p-8 text-center"><FileSearch size={40} className="mx-auto text-amber-400" /><h3 className="mt-4 text-lg font-black text-ink-100">No verified direct match yet</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-500">That is more honest than showing unrelated federal programs. Try a broader funding need, or add a local, state, district, or foundation opportunity to the writing studio.</p><button type="button" onClick={() => setManualOpen(true)} className="btn-secondary mt-4"><Plus size={15} /> Add an opportunity</button></section>}
      {!searched && <section className="grid gap-4 sm:grid-cols-3"><div className="card p-5"><Search className="text-emerald-400" /><h3 className="mt-3 font-black text-ink-100">Find opportunities</h3><p className="mt-1 text-sm text-ink-500">Search by real school need instead of guessing grant terminology.</p></div><div className="card p-5"><BookOpenCheck className="text-cyan-400" /><h3 className="mt-3 font-black text-ink-100">Screen the fit</h3><p className="mt-1 text-sm text-ink-500">Compare eligibility, deadline, award range, match, and required cost sharing.</p></div><div className="card p-5"><Sparkles className="text-amber-400" /><h3 className="mt-3 font-black text-ink-100">Build the application</h3><p className="mt-1 text-sm text-ink-500">Keep source requirements beside the writing, budget, timeline, and checklist.</p></div></section>}
    </div>}

    {tab === 'saved' && <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="label-eyebrow">Your funding pipeline</p><h2 className="mt-1 text-2xl font-black text-ink-100">Saved grants &amp; deadlines</h2></div><button onClick={() => { setTab('finder'); setManualOpen(true) }} className="btn-secondary"><Plus size={15} /> Add opportunity</button></div>{projects.length ? <div className="grid gap-4 lg:grid-cols-2">{projects.map((project) => { const days = daysUntil(project.close_date); return <article key={project.id} className="card p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusPill status={project.status} /><span className="text-[11px] font-bold text-ink-600">{project.module_label}</span></div><h3 className="mt-3 text-lg font-black leading-snug text-ink-100">{project.title}</h3><p className="mt-1 text-xs text-ink-500">{project.funder || 'Funder not entered'}</p></div><BadgeDollarSign className="shrink-0 text-emerald-400" /></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-ink-950 p-3"><p className="text-[10px] font-bold uppercase text-ink-600">Deadline</p><p className="mt-1 text-sm font-bold text-ink-200">{dateLabel(project.close_date)}</p>{days != null && days >= 0 && <p className={`mt-1 text-[11px] ${days <= 30 ? 'text-amber-400' : 'text-ink-500'}`}>{days} days remaining</p>}</div><div className="rounded-xl bg-ink-950 p-3"><p className="text-[10px] font-bold uppercase text-ink-600">Funding</p><p className="mt-1 text-sm font-bold text-ink-200">{project.amount_text || 'Not entered'}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => openWriter(project)} className="btn-primary"><FileText size={15} /> {Object.keys(project.draft || {}).length ? 'Continue draft' : 'Start application'}</button>{project.source_url && <a href={project.source_url} target="_blank" rel="noreferrer" className="btn-secondary">Source <ExternalLink size={14} /></a>}<select aria-label={`Status for ${project.title}`} value={project.status} onChange={(event) => changeStatus(project, event.target.value)} disabled={busy === project.id} className="input-field min-h-10 w-auto py-2 text-xs">{STATUSES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></article> })}</div> : <section className="card p-9 text-center"><FileSearch size={42} className="mx-auto text-emerald-400" /><h3 className="mt-4 text-xl font-black text-ink-100">Your funding pipeline is ready</h3><p className="mx-auto mt-2 max-w-lg text-sm text-ink-500">Search federal grants or add an opportunity you found through a state agency, foundation, district, or community partner.</p><button onClick={() => setTab('finder')} className="btn-primary mt-5">Find funding</button></section>}</div>}

    {tab === 'writer' && <div className="space-y-6">{!activeProject ? <section className="card p-9 text-center"><FileText size={42} className="mx-auto text-emerald-400" /><h2 className="mt-4 text-xl font-black text-ink-100">Choose a saved grant to begin</h2><p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">The official opportunity stays attached to your writing workspace so eligibility, requirements, and deadlines never get separated from the draft.</p><button onClick={() => setTab(projects.length ? 'saved' : 'finder')} className="btn-primary mt-5">{projects.length ? 'Open saved grants' : 'Find a grant'}</button></section> : <>
      <section className="card overflow-hidden"><div className="flex flex-col gap-4 border-b border-ink-800 bg-emerald-500/5 p-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><StatusPill status={activeProject.status} /><span className="text-xs font-bold text-ink-500">{activeProject.module_label}</span></div><h2 className="mt-2 text-xl font-black text-ink-100">{activeProject.title}</h2><p className="mt-1 text-sm text-ink-500">{activeProject.funder} · Due {dateLabel(activeProject.close_date)}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => saveWorkspace()} disabled={busy === 'save'} className="btn-secondary">{busy === 'save' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save</button>{activeProject.source_url && <a href={activeProject.source_url} target="_blank" rel="noreferrer" className="btn-secondary">Official source <ExternalLink size={14} /></a>}</div></div><div className="grid gap-4 p-5 lg:grid-cols-3"><div><p className="text-[10px] font-black uppercase text-ink-600">Eligibility notes</p><p className="mt-1 text-xs leading-5 text-ink-400">{activeProject.eligibility_summary || 'Add eligibility notes from the official source before investing substantial writing time.'}</p></div><div><p className="text-[10px] font-black uppercase text-ink-600">Funding range</p><p className="mt-1 text-xs leading-5 text-ink-400">{activeProject.amount_text || 'Check the official notice.'}</p></div><div><p className="text-[10px] font-black uppercase text-ink-600">Source check</p><p className="mt-1 text-xs leading-5 text-ink-400">Verify applicant type, allowable costs, match requirements, deadline time zone, and required attachments.</p></div></div></section>
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"><aside className="space-y-5"><section className="card space-y-4 p-5">
        <div><p className="label-eyebrow">Your project facts</p><p className="mt-1 text-xs text-ink-500">Use real local evidence. PlansK12 will not invent statistics.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block text-xs font-semibold text-ink-500">Grade band<select value={inputs.gradeBand} onChange={(event) => setInputs({ ...inputs, gradeBand: event.target.value })} className="input-field mt-1">{GRADE_BANDS.map((gradeBand) => <option key={gradeBand}>{gradeBand}</option>)}</select></label>
          <label className="block text-xs font-semibold text-ink-500">School type<select value={inputs.schoolType} onChange={(event) => setInputs({ ...inputs, schoolType: event.target.value })} className="input-field mt-1">{SCHOOL_TYPES.map((schoolType) => <option key={schoolType}>{schoolType}</option>)}</select></label>
          <label className="block text-xs font-semibold text-ink-500">Title I status <span className="font-normal text-ink-600">(optional)</span><select value={inputs.titleIStatus} onChange={(event) => setInputs({ ...inputs, titleIStatus: event.target.value })} className="input-field mt-1">{TITLE_I_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="block text-xs font-semibold text-ink-500">Free/reduced lunch % <span className="font-normal text-ink-600">(optional)</span><input type="number" min="0" max="100" step="0.1" value={inputs.freeReducedLunchPercent} onChange={(event) => setInputs({ ...inputs, freeReducedLunchPercent: event.target.value })} className="input-field mt-1" /></label>
        </div>
        {[['projectTitle','Project title'],['organization','School / organization'],['projectLead','Project lead'],['studentsServed','Who and how many will be served'],['targetDate','Target completion date'],['partners','Partners or supporters']].map(([key, label]) => <label key={key} className="block text-xs font-semibold text-ink-500">{label}<input value={inputs[key]} onChange={(event) => setInputs({ ...inputs, [key]: event.target.value })} className="input-field mt-1" /></label>)}
        <label className="block text-xs font-semibold text-ink-500">Requested amount<input type="number" min="0" value={inputs.requestedAmount} onChange={(event) => setInputs({ ...inputs, requestedAmount: event.target.value })} className="input-field mt-1" placeholder={totalBudget ? String(totalBudget) : '0'} /></label>
        {[['needStatement','Documented need *'],['evidence','Local evidence and source'],['activities','Planned activities *'],['measurement','How success will be measured'],['sustainability','How the work continues'],['officialPriorities','Official priorities or scoring language']].map(([key, label]) => <label key={key} className="block text-xs font-semibold text-ink-500">{label}<textarea rows="3" value={inputs[key]} onChange={(event) => setInputs({ ...inputs, [key]: event.target.value })} className="input-field mt-1 resize-y" /></label>)}
        <button onClick={buildDraft} disabled={busy === 'generate'} className="btn-primary w-full justify-center">{busy === 'generate' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Build application draft</button>
      </section></aside>
        <main className="space-y-5"><section className="card p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="label-eyebrow">Itemized budget</p><h3 className="mt-1 text-lg font-black text-ink-100">Make every dollar easy to defend</h3></div><p className="text-lg font-black text-emerald-400">${totalBudget.toLocaleString()}</p></div><div className="mt-4 space-y-3">{inputs.budgetItems.map((row, index) => <div key={index} className="grid gap-2 rounded-xl border border-ink-800 p-3 sm:grid-cols-[1fr_1.4fr_120px_40px]"><input aria-label="Budget category" value={row.category} onChange={(event) => updateBudget(index, 'category', event.target.value)} className="input-field" placeholder="Category" /><input aria-label="Budget description" value={row.description} onChange={(event) => updateBudget(index, 'description', event.target.value)} className="input-field" placeholder="What is being purchased and why" /><input aria-label="Budget amount" type="number" min="0" value={row.amount} onChange={(event) => updateBudget(index, 'amount', event.target.value)} className="input-field" placeholder="$" /><button aria-label="Remove budget row" onClick={() => removeBudget(index)} disabled={inputs.budgetItems.length === 1} className="flex h-11 items-center justify-center rounded-xl text-ink-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"><Trash2 size={16} /></button></div>)}</div><button onClick={addBudget} className="mt-3 inline-flex items-center gap-1 text-xs font-black text-emerald-400"><Plus size={14} /> Add budget item</button></section>
          {Object.keys(draft).length ? <section className="grant-print space-y-5 rounded-3xl border border-ink-800 bg-white p-5 dark:bg-ink-950 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3 print:hidden"><div><p className="label-eyebrow">Editable working draft</p><h3 className="mt-1 text-xl font-black text-ink-100">Review, personalize, and verify</h3></div><div className="flex gap-2"><button onClick={copyDraft} className="btn-secondary">{copied ? <Check size={15} /> : <Clipboard size={15} />} {copied ? 'Copied' : 'Copy all'}</button><button onClick={downloadDraft} className="btn-secondary"><Download size={15} /> Download</button><button onClick={() => window.print()} className="btn-secondary"><FileText size={15} /> Print</button></div></div><div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs leading-5 text-amber-200 print:hidden"><TriangleAlert size={16} className="mr-2 inline" />This is a working draft, not a guarantee of eligibility or funding. Replace placeholders, verify every claim, and follow the official notice when requirements conflict.</div><DraftEditor draft={draft} setDraft={setDraft} /></section> : <section className="card p-8 text-center"><Sparkles size={38} className="mx-auto text-emerald-400" /><h3 className="mt-4 text-xl font-black text-ink-100">Your application draft will appear here</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-500">Add the real need, evidence, activities, measures, and budget. The studio will organize them into funder-ready sections and flag questions that still need answers.</p></section>}
        </main></div></>}
    </div>}

    {manualOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10 backdrop-blur-sm"><form onSubmit={saveManual} className="w-full max-w-2xl rounded-3xl border border-ink-800 bg-white p-6 shadow-2xl dark:bg-ink-950"><div className="flex items-start justify-between gap-4"><div><p className="label-eyebrow">Local, state, private, or foundation grant</p><h2 className="mt-1 text-2xl font-black text-ink-100">Save an opportunity you found</h2><p className="mt-1 text-sm text-ink-500">Always link to the funder’s official page—not a repost or search result.</p></div><button type="button" onClick={() => setManualOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-ink-500"><X /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-500 sm:col-span-2">Grant title<input required value={manual.title} onChange={(event) => setManual({ ...manual, title: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-semibold text-ink-500">Funder<input required value={manual.funder} onChange={(event) => setManual({ ...manual, funder: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-semibold text-ink-500">Deadline<input type="date" value={manual.closeDate} onChange={(event) => setManual({ ...manual, closeDate: event.target.value })} className="input-field mt-1" /></label><label className="text-xs font-semibold text-ink-500 sm:col-span-2">Official opportunity URL<input type="url" required value={manual.sourceUrl} onChange={(event) => setManual({ ...manual, sourceUrl: event.target.value })} className="input-field mt-1" placeholder="https://funder.org/official-grant-page" /></label><label className="text-xs font-semibold text-ink-500">Award amount or range<input value={manual.amountText} onChange={(event) => setManual({ ...manual, amountText: event.target.value })} className="input-field mt-1" placeholder="$1,000–$5,000" /></label><label className="text-xs font-semibold text-ink-500">Eligibility summary<input value={manual.eligibilitySummary} onChange={(event) => setManual({ ...manual, eligibilitySummary: event.target.value })} className="input-field mt-1" placeholder="Public schools in…" /></label><label className="text-xs font-semibold text-ink-500 sm:col-span-2">Paste official requirements<textarea rows="7" value={manual.officialRequirements} onChange={(event) => setManual({ ...manual, officialRequirements: event.target.value })} className="input-field mt-1 resize-y" placeholder="Paste the application requirements, priorities, scoring criteria, and allowable costs…" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setManualOpen(false)} className="btn-secondary">Cancel</button><button disabled={busy === 'manual'} className="btn-primary">{busy === 'manual' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save grant</button></div></form></div>}
  </div>
}

function DraftEditor({ draft, setDraft }) {
  const textSections = [['executive_summary', 'Executive summary'], ['needs_statement', 'Needs statement'], ['project_design', 'Project design'], ['evaluation_plan', 'Evaluation plan'], ['sustainability', 'Sustainability'], ['budget_narrative', 'Budget narrative']]
  const updateList = (key, index, value) => setDraft((current) => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item) }))
  return <div className="space-y-5"><header className="border-b border-ink-800 pb-5"><p className="text-xs font-black uppercase tracking-[.16em] text-emerald-600">Grant application working draft</p><h1 className="mt-2 text-2xl font-black text-ink-100">Editable narrative and readiness packet</h1></header>{textSections.map(([key, title]) => draft[key] != null && <section key={key}><h2 className="font-black text-emerald-600">{title}</h2><textarea value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} rows={key === 'needs_statement' || key === 'project_design' ? 8 : 6} className="input-field mt-2 resize-y leading-6" /></section>)}{Array.isArray(draft.goals_objectives) && <section><h2 className="font-black text-emerald-600">Goals &amp; measurable objectives</h2><div className="mt-2 space-y-2">{draft.goals_objectives.map((item, index) => <textarea key={index} value={item} onChange={(event) => updateList('goals_objectives', index, event.target.value)} rows="2" className="input-field resize-y" />)}</div></section>}{Array.isArray(draft.timeline) && <section><h2 className="font-black text-emerald-600">Implementation timeline</h2><div className="mt-2 space-y-2">{draft.timeline.map((item, index) => <div key={index} className="grid gap-2 sm:grid-cols-[150px_1fr]"><input value={item.period} onChange={(event) => setDraft((current) => ({ ...current, timeline: current.timeline.map((row, rowIndex) => rowIndex === index ? { ...row, period: event.target.value } : row) }))} className="input-field font-bold" /><textarea value={item.action} onChange={(event) => setDraft((current) => ({ ...current, timeline: current.timeline.map((row, rowIndex) => rowIndex === index ? { ...row, action: event.target.value } : row) }))} rows="2" className="input-field resize-y" /></div>)}</div></section>}{[['compliance_checklist', 'Before submitting'], ['questions_to_resolve', 'Questions still to resolve']].map(([key, title]) => Array.isArray(draft[key]) && <section key={key} className="rounded-2xl border border-ink-800 p-4"><h2 className="font-black text-ink-100">{title}</h2><div className="mt-3 space-y-2">{draft[key].map((item, index) => <div key={index} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-2.5 shrink-0 text-emerald-500" /><textarea value={item} onChange={(event) => updateList(key, index, event.target.value)} rows="2" className="min-h-0 flex-1 resize-y border-0 bg-transparent p-2 text-sm leading-5 text-ink-300 outline-none" /></div>)}</div></section>)}</div>
}
