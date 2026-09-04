import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Building2, Copy, CreditCard, DollarSign, Download, Eye, Layers, Link2, Loader2, Mail, Megaphone, MousePointerClick, RefreshCw, Search, TrendingDown, TrendingUp, UserCheck, Users, UserX, Wrench, XCircle } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import { getOwnerAnalytics, saveOwnerContact, saveSchoolLead, sendCancellationRecoveryEmail } from '../services/ownerAnalyticsService'
import { MODULE_HOMES } from '../constants/moduleHomes'
import { campaignLink } from '../services/campaignAttributionService'

const REASON_LABELS = { seasonal: 'Seasonal / summer', price: 'Price', not_using: 'Not using it enough', missing_feature: 'Missing feature', confusing: 'Confusing', output_quality: 'Output quality', technical: 'Technical problem', other: 'Other' }
const TOOL_LABELS = {
  'module-home': 'Module workspace',
  'pe-events': 'PE Events Studio', 'stem-night': 'STEM Night Studio', 'music-concert': 'Concert Builder',
  'theater-production': 'Production Planner', 'dance-recital': 'Dance Team & Recital Studio', 'cte-experiences': 'Career Experiences Hub',
  'world-language-experiences': 'Cultural Experiences Studio', 'early-family-events': 'Family Engagement Events',
  'esl-family-night': 'Multilingual Family Night', 'gifted-showcase': 'Student Showcase Studio',
  'test-prep-family-support': 'Test Readiness & Family Support', 'open-house': 'Open House Planner',
}
const ALL_MODULES = ['PE & Health', ...new Set(Object.values(MODULE_HOMES).map((module) => module.moduleLabel))]

function toolLabel(key) {
  return TOOL_LABELS[key] ?? key.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function rangeLabel(days) {
  if (days === 0) return 'today'
  if (days === 365) return 'the last year'
  return `the last ${days} days`
}

function Metric({ icon: Icon, label, value, note, color = 'text-accent-400', onClick }) {
  const content = <><Icon size={21} className={color} /><p className="mt-4 text-2xl font-bold text-ink-50">{value}</p><p className="mt-1 text-sm font-semibold text-ink-300">{label}</p>{note && <p className="mt-1 text-xs text-ink-500">{note}</p>}</>
  return onClick ? <button type="button" onClick={onClick} className="card p-5 text-left transition-colors hover:border-accent-500/40">{content}</button> : <div className="card p-5">{content}</div>
}

export default function OwnerDashboard() {
  const { isOwner, loaded } = useTrial()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customerFilter, setCustomerFilter] = useState('all')
  const [rangeDays, setRangeDays] = useState(7)

  function openCustomers(filter) {
    setCustomerFilter(filter)
    setTimeout(() => document.getElementById('customer-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function load() {
    setLoading(true); setError(null)
    try { setData(await getOwnerAnalytics(rangeDays)) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => {
    if (!isOwner) return undefined
    let active = true
    getOwnerAnalytics(rangeDays)
      .then((result) => { if (active) setData(result) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isOwner, rangeDays])

  if (!loaded || loading) return <div className="flex items-center gap-2 text-ink-400"><Loader2 size={18} className="animate-spin" /> Loading owner dashboard…</div>
  if (!isOwner) return <div className="card border-red-500/30 p-6 text-red-400">Owner access required.</div>
  if (error) return <div className="card p-6"><p className="text-red-400">{error}</p><button onClick={load} className="btn-secondary mt-4">Try again</button></div>

  const s = data.subscriptions
  const f = data.funnel30d
  const a = data.activation
  const reasons = Object.entries(data.cancellation.reasons).sort((a, b) => b[1] - a[1])
  const maxSection = Math.max(1, ...Object.values(f.sections))
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="label-eyebrow mb-2">Private owner view</p><h1 className="text-3xl font-semibold text-ink-50">Growth &amp; Retention</h1><p className="mt-2 text-ink-400">Subscriptions are live from Stripe. Campaign and product activity covers the selected period.</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl border border-ink-800 bg-ink-950 p-1">{[0, 7, 30, 90, 365].map((days) => <button key={days} type="button" onClick={() => setRangeDays(days)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${rangeDays === days ? 'bg-accent-500 text-white' : 'text-ink-400 hover:text-ink-100'}`}>{days === 0 ? 'Today' : days === 365 ? '1 year' : `${days} days`}</button>)}</div><button onClick={load} className="btn-secondary"><RefreshCw size={16} /> Refresh</button></div></div>
    <section><h2 className="mb-3 font-semibold text-ink-200">Revenue health</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={CreditCard} label="Paying subscriptions" value={s.active} color="text-emerald-400" /><Metric icon={Users} label="Trials" value={s.trialing} color="text-violet-400" /><Metric icon={DollarSign} label="Estimated MRR" value={`$${(s.mrrCents / 100).toFixed(0)}`} note="Annual plans normalized" color="text-amber-400" /><Metric icon={TrendingUp} label="Current access" value={s.current} note="Paid + trialing subscriptions" /></div></section>
    {data.schoolLeads && <SchoolLeadWorkspace leads={data.schoolLeads} onRefresh={load} />}
    <section><div className="mb-3"><h2 className="font-semibold text-ink-200">Cancellation recovery</h2><p className="mt-1 text-xs text-ink-500">Click a card to see the people behind the number and plan personal follow-up.</p></div><div className="grid gap-4 sm:grid-cols-3"><Metric icon={XCircle} label="Canceling soon" value={s.scheduledCancel} note="Still active—best chance to save" color="text-red-400" onClick={() => openCustomers('canceling')} /><Metric icon={XCircle} label="Canceled · last 30 days" value={s.canceled30d} note="Recent win-back opportunities" color="text-orange-400" onClick={() => openCustomers('canceled_30')} /><Metric icon={XCircle} label="All canceled" value={s.canceledTotal} note="Historical former subscribers" color="text-ink-400" onClick={() => openCustomers('canceled')} /></div></section>
    {a && <section><div className="mb-3"><h2 className="font-semibold text-ink-200">Customer activation &amp; inactivity</h2><p className="mt-1 text-xs text-ink-500">Click a card to open the matching customer list. “Activated” means they created a lesson or used a teacher tool meaningfully.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric icon={UserCheck} label="Activated customers" value={a.activated} note={`${a.activationRate}% of matched customers`} color="text-emerald-400" onClick={() => openCustomers('all')} /><Metric icon={UserX} label="Never activated" value={a.neverActivated} note="No lesson or saved tool work yet" color="text-amber-400" onClick={() => openCustomers('never_activated')} /><Metric icon={Activity} label="Inactive 7+ days" value={a.inactive7d} note="No recent sign-in, lesson, or tool use" color="text-orange-400" onClick={() => openCustomers('inactive_7')} /><Metric icon={TrendingDown} label="Inactive 30+ days" value={a.inactive30d} note="Highest re-engagement priority" color="text-red-400" onClick={() => openCustomers('inactive_30')} /><Metric icon={Users} label="Matched customers" value={a.customers} note="Current Stripe customers linked to accounts" onClick={() => openCustomers('all')} /></div></section>}
    {data.acquisition && <AcquisitionInsights acquisition={data.acquisition} rangeDays={rangeDays} />}
    {data.landingVideo && <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink-200">Landing page · My School Year video</h2>
          <p className="mt-1 text-xs text-ink-500">Direct engagement with the landing-page walkthrough during {rangeLabel(rangeDays)}.</p>
        </div>
        <a href="/resources/PlansK12-My-School-Year-Walkthrough.mp4" download="PlansK12-My-School-Year-Walkthrough.mp4" className="btn-secondary text-xs"><Download size={14} /> Download my video</a>
      </div>
      <div className="grid gap-4 sm:grid-cols-3"><Metric icon={Eye} label="Landing visitors" value={data.landingVideo.landingVisitors ?? 0} note="Unique visitors in this period" color="text-cyan-400" /><Metric icon={MousePointerClick} label="People who clicked" value={data.landingVideo.uniqueClickers ?? 0} note={data.landingVideo.landingVisitors ? `${data.landingVideo.clickRate}% of landing visitors` : 'Collecting landing-page data'} color="text-violet-400" /><Metric icon={Activity} label="Total video clicks" value={data.landingVideo.totalClicks ?? 0} note="Includes repeat interactions" color="text-emerald-400" /></div>
    </section>}
    {data.product.toolUsage30d && <ToolUsageInsights usage={data.product.toolUsage30d} rangeDays={rangeDays} />}
    {data.product.generationHealth && <GenerationHealth health={data.product.generationHealth} rangeDays={rangeDays} />}
    {data.customers && <CustomerWorkspace customers={data.customers} filter={customerFilter} setFilter={setCustomerFilter} onRefresh={load} />}
    <section><h2 className="mb-3 font-semibold text-ink-200">Growth funnel · {rangeLabel(rangeDays)}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"><Metric icon={Eye} label="Demo visits" value={f.demoViews} /><Metric icon={MousePointerClick} label="Trial clicks" value={f.trialClicks} note={f.demoViews ? `${Math.round(f.trialClicks / f.demoViews * 100)}% of demo visits` : 'Collecting data'} color="text-cyan-400" /><Metric icon={Users} label="New accounts" value={f.newSignups} color="text-violet-400" /><Metric icon={UserCheck} label="Trials started" value={f.trialsStarted ?? 0} color="text-amber-400" /><Metric icon={TrendingUp} label="Trial conversions" value={f.trialConversions ?? 0} note="Trials that became paid" color="text-emerald-400" /><Metric icon={BarChart3} label="Lessons created" value={data.product.lessons30d} note={`${data.product.totalLessons} all time`} color="text-orange-400" /></div></section>
    <div className="grid gap-5 lg:grid-cols-2"><section className="card p-6"><h2 className="font-semibold text-ink-100">Demo sections viewed</h2><div className="mt-5 space-y-4">{Object.entries(f.sections).map(([name, count]) => <div key={name}><div className="flex justify-between text-sm"><span className="capitalize text-ink-300">{name}</span><strong>{count}</strong></div><div className="mt-1.5 h-2 rounded-full bg-ink-800"><div className="h-full rounded-full bg-accent-500" style={{ width: `${count / maxSection * 100}%` }} /></div></div>)}</div></section>
      <section className="card p-6"><h2 className="font-semibold text-ink-100">Cancellation reasons</h2>{reasons.length ? <div className="mt-5 space-y-3">{reasons.map(([reason, count]) => <div key={reason} className="flex justify-between rounded-lg bg-ink-900 p-3 text-sm"><span>{REASON_LABELS[reason] ?? reason}</span><strong>{count}</strong></div>)}</div> : <p className="mt-4 text-sm text-ink-500">No cancellation surveys submitted yet. New responses will appear here.</p>}</section></div>
    {data.cancellation.recent.length > 0 && <section className="card p-6"><h2 className="font-semibold text-ink-100">Recent cancellation feedback</h2><div className="mt-4 space-y-3">{data.cancellation.recent.slice(0, 10).map((row, i) => <div key={i} className="border-b border-ink-800 pb-3 last:border-0"><p className="text-sm font-semibold">{REASON_LABELS[row.reason] ?? row.reason}</p>{row.detail && <p className="mt-1 text-sm text-ink-400">{row.detail}</p>}<p className="mt-1 text-xs text-ink-600">{new Date(row.created_at).toLocaleDateString()}</p></div>)}</div></section>}
  </div>
}

const SCHOOL_LEAD_LABELS = {
  role: { teacher: 'Teacher', department_lead: 'Department or program lead', school_admin: 'School administrator', district_admin: 'District administrator', curriculum: 'Curriculum or instruction leader', technology: 'Technology or purchasing', other: 'Other' },
  scope: { department: 'One department or program', school: 'One school', multiple_schools: 'Multiple schools', district: 'Entire district' },
  interest: { pricing: 'School pricing', demo: 'Personal demonstration', pilot: 'Founding-school pilot', admin_packet: 'Administrator information', exploring: 'Just exploring' },
  timeline: { immediately: 'As soon as possible', this_semester: 'This semester', next_semester: 'Next semester', next_school_year: 'Next school year', unsure: 'Not sure yet' },
  nextStep: { email_information: 'Email school information', walkthrough: 'Schedule a walkthrough', pilot_conversation: 'Discuss a founding-school pilot', admin_packet: 'Send an administrator-ready packet' },
}
const SCHOOL_LEAD_STATUSES = [
  ['new', 'New'], ['contacted', 'Contacted'], ['replied', 'Replied'],
  ['demo_scheduled', 'Demo scheduled'], ['pilot_discussion', 'Pilot discussion'],
  ['not_now', 'Not right now'], ['closed', 'Closed'],
]

function SchoolLeadWorkspace({ leads, onRefresh }) {
  const [selected, setSelected] = useState(null)
  const [leadStatus, setLeadStatus] = useState('new')
  const [followUpAt, setFollowUpAt] = useState('')
  const [ownerNote, setOwnerNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const hot = leads.filter((lead) => lead.lead_tier === 'hot').length
  const warm = leads.filter((lead) => lead.lead_tier === 'warm').length
  const newCount = leads.filter((lead) => lead.lead_status === 'new').length

  function selectLead(lead) {
    setSelected(lead)
    setLeadStatus(lead.lead_status || 'new')
    setFollowUpAt(lead.follow_up_at || '')
    setOwnerNote(lead.owner_note || '')
    setCopied(false)
  }

  function draftForLead(lead) {
    const first = lead.name?.split(/\s+/)[0] || 'there'
    return {
      subject: `PlansK12 for ${lead.organization}`,
      body: `Hi ${first},\n\nThank you for your interest in bringing PlansK12 to ${lead.organization}. I personally reviewed your request${lead.specialties?.length ? ` for ${lead.specialties.join(', ')}` : ''}.\n\nI would love to learn a little more about your educators and help with your requested next step: ${SCHOOL_LEAD_LABELS.nextStep[lead.preferred_next_step] || 'school information'}.\n\nWould you be available for a brief conversation this week?\n\nThank you,\nStacey\nFounder, PlansK12`,
    }
  }

  async function copyDraft() {
    const draft = draftForLead(selected)
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function save() {
    setSaving(true)
    try {
      await saveSchoolLead({ leadId: selected.id, leadStatus, followUpAt, ownerNote, contacted: leadStatus !== 'new' })
      setSelected(null)
      await onRefresh()
    } finally {
      setSaving(false)
    }
  }

  return <section className="card overflow-hidden">
    <div className="border-b border-ink-800 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Building2 size={20} className="text-cyan-400" /><h2 className="font-semibold text-ink-100">School &amp; district opportunities</h2></div><p className="mt-1 text-xs text-ink-500">Qualified requests from the landing page, with the exact information needed for personal follow-up.</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">{hot} hot</span><span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">{warm} warm</span><span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">{newCount} new</span></div></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-ink-950 text-xs uppercase tracking-wide text-ink-600"><tr><th className="px-5 py-3">Organization</th><th>Contact</th><th>Teachers &amp; specialties</th><th>Request</th><th>Timing</th><th>Status</th></tr></thead><tbody className="divide-y divide-ink-800">{leads.map((lead) => <tr key={lead.id}><td className="px-5 py-3"><p className="font-semibold text-ink-200">{lead.organization}</p><p className="text-xs text-ink-500">{lead.location || 'Location not provided'} · {SCHOOL_LEAD_LABELS.scope[lead.organization_scope] || 'Earlier inquiry'}</p></td><td><p className="font-semibold text-ink-300">{lead.name}</p><p className="text-xs text-ink-500">{SCHOOL_LEAD_LABELS.role[lead.role] || 'Role not provided'}</p></td><td><strong>{lead.teacher_count ?? '—'}</strong> teachers<p className="max-w-64 text-xs text-ink-500">{lead.specialties?.length ? lead.specialties.join(' · ') : 'Specialties not provided'}</p></td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${lead.lead_tier === 'hot' ? 'bg-red-500/10 text-red-400' : lead.lead_tier === 'warm' ? 'bg-amber-500/10 text-amber-400' : 'bg-ink-800 text-ink-400'}`}>{lead.lead_tier || 'exploring'}</span><p className="mt-1 text-xs text-ink-500">{SCHOOL_LEAD_LABELS.nextStep[lead.preferred_next_step] || 'Earlier inquiry'}</p></td><td><p className="text-xs text-ink-300">{SCHOOL_LEAD_LABELS.timeline[lead.timeline] || '—'}</p><p className="text-[11px] text-ink-600">Received {new Date(lead.created_at).toLocaleDateString()}</p></td><td><button type="button" onClick={() => selectLead(lead)} className="btn-secondary text-xs"><Mail size={14} /> {lead.lead_status === 'new' ? 'Review lead' : 'Update follow-up'}</button></td></tr>)}</tbody></table>{!leads.length && <p className="p-8 text-center text-sm text-ink-500">New qualified school requests will appear here automatically.</p>}</div>
    {selected && <div className="border-t border-cyan-500/20 bg-cyan-500/[0.04] p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="label-eyebrow">School opportunity details</p><h3 className="mt-1 text-lg font-semibold text-ink-100">{selected.organization}</h3><p className="mt-1 text-sm text-ink-400">{selected.primary_goal || 'This earlier inquiry did not include a stated goal.'}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Close school lead"><XCircle size={18} /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-ink-800 bg-ink-950/50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-ink-600">Looking for</p><p className="mt-1 text-sm text-ink-200">{SCHOOL_LEAD_LABELS.interest[selected.interest_type] || 'Not provided'}</p><p className="mt-1 text-xs text-ink-500">Next: {SCHOOL_LEAD_LABELS.nextStep[selected.preferred_next_step] || 'Personal follow-up'}</p></div><div className="rounded-xl border border-ink-800 bg-ink-950/50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-ink-600">Additional note</p><p className="mt-1 text-sm text-ink-300">{selected.note || 'No additional note.'}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><a className="btn-primary" href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selected.email)}&su=${encodeURIComponent(draftForLead(selected).subject)}&body=${encodeURIComponent(draftForLead(selected).body)}`} target="_blank" rel="noreferrer"><Mail size={15} /> Open personalized email</a><button type="button" onClick={copyDraft} className="btn-secondary"><Copy size={15} /> {copied ? 'Copied' : 'Copy email draft'}</button><a href="/resources/PlansK12-Administrator-Information-Packet.pdf" download className="btn-secondary"><Download size={15} /> Download administrator packet</a></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-500">Lead status<select value={leadStatus} onChange={(event) => setLeadStatus(event.target.value)} className="input-field mt-1">{SCHOOL_LEAD_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-semibold text-ink-500">Follow up on<input type="date" value={followUpAt} onChange={(event) => setFollowUpAt(event.target.value)} className="input-field mt-1" /></label></div><textarea value={ownerNote} onChange={(event) => setOwnerNote(event.target.value)} placeholder="Private note: decision maker, needs, purchasing process, or next action" className="input-field mt-3 min-h-20" /><button type="button" onClick={save} disabled={saving} className="btn-primary mt-3">{saving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Save school follow-up</button></div>}
  </section>
}

function AcquisitionInsights({ acquisition, rangeDays }) {
  const [moduleLabel, setModuleLabel] = useState('CTE')
  const [campaign, setCampaign] = useState('cte-facebook-update')
  const [content, setContent] = useState('group-post')
  const [copied, setCopied] = useState(false)
  const link = campaignLink({ campaign, module: moduleLabel, content })
  const campaigns = acquisition.campaigns ?? []
  const best = campaigns.find((row) => row.paid > 0 || row.trials > 0 || row.trialClicks > 0)

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <section className="space-y-4">
    <div><h2 className="font-semibold text-ink-200">Campaign growth · {rangeLabel(rangeDays)}</h2><p className="mt-1 text-xs text-ink-500">See which post brought the visit, trial click, and eventual subscription. Tracking begins with this release and contains no names or student information.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Eye} label="Tracked visitors" value={acquisition.visitors ?? 0} color="text-cyan-400" /><Metric icon={MousePointerClick} label="Trial clicks" value={acquisition.trialClicks ?? 0} color="text-violet-400" /><Metric icon={Users} label="Attributed trials" value={acquisition.attributedTrials ?? 0} color="text-amber-400" /><Metric icon={CreditCard} label="Attributed subscribers" value={acquisition.attributedPaid ?? 0} color="text-emerald-400" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className="card overflow-hidden"><div className="border-b border-ink-800 p-5"><h3 className="font-semibold text-ink-100">Post and campaign results</h3><p className="mt-1 text-xs text-ink-500">A trial or subscriber appears here after Stripe completes checkout.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-ink-950 text-xs uppercase tracking-wide text-ink-600"><tr><th className="px-5 py-3">Campaign</th><th>Module</th><th>Visitors</th><th>Trial clicks</th><th>Trials</th><th>Paid</th></tr></thead><tbody className="divide-y divide-ink-800">{campaigns.map((row) => <tr key={`${row.source}-${row.campaign}-${row.module ?? ''}`}><td className="px-5 py-3"><p className="font-semibold text-ink-200">{row.campaign}</p><p className="text-xs text-ink-600">{row.source}</p></td><td className="text-xs text-ink-400">{row.module || 'General'}</td><td>{row.visitors}</td><td>{row.trialClicks}<p className="text-[11px] text-ink-600">{row.clickRate}% of visitors</p></td><td>{row.trials}</td><td><strong className="text-emerald-400">{row.paid}</strong></td></tr>)}</tbody></table>{!campaigns.length && <p className="p-8 text-center text-sm text-ink-500">Create a tracked link for the next Facebook post. Results will start appearing here immediately.</p>}</div></div>
      <div className="space-y-5"><div className="card p-5"><div className="flex items-center gap-2"><Megaphone size={18} className="text-accent-400" /><h3 className="font-semibold text-ink-100">Create a tracked Facebook link</h3></div><p className="mt-2 text-xs text-ink-500">Use this link in the post so you can tell exactly which specialty and post produced interest.</p><div className="mt-4 space-y-3"><label className="block text-xs font-semibold text-ink-400">Module<select value={moduleLabel} onChange={(event) => setModuleLabel(event.target.value)} className="input mt-1 w-full">{ALL_MODULES.map((module) => <option key={module}>{module}</option>)}</select></label><label className="block text-xs font-semibold text-ink-400">Campaign name<input value={campaign} onChange={(event) => setCampaign(event.target.value)} className="input mt-1 w-full" placeholder="library-facebook-september" /></label><label className="block text-xs font-semibold text-ink-400">Post label<input value={content} onChange={(event) => setContent(event.target.value)} className="input mt-1 w-full" placeholder="group-post" /></label><div className="rounded-xl border border-ink-800 bg-ink-950 p-3"><p className="break-all text-xs text-ink-400">{link}</p></div><button type="button" onClick={copyLink} className="btn-primary w-full justify-center"><Copy size={15} /> {copied ? 'Copied—paste into Facebook' : 'Copy tracked link'}</button></div></div><div className="card p-5"><div className="flex items-center gap-2"><Link2 size={18} className="text-emerald-400" /><h3 className="font-semibold text-ink-100">What to promote next</h3></div><p className="mt-3 text-sm text-ink-300">{best ? <><strong>{best.campaign}</strong> is currently your strongest signal with {best.paid} paid, {best.trials} trial, and {best.trialClicks} trial-click result{best.trialClicks === 1 ? '' : 's'}.</> : <>No campaign has enough data yet. Use the tracked link for your next Library or CTE post, then compare results here.</>}</p></div></div>
    </div>
  </section>
}

function ToolUsageInsights({ usage, rangeDays }) {
  const byModule = new Map((usage.modules ?? []).map((row) => [row.moduleLabel, row]))
  const modules = ALL_MODULES.map((moduleLabel) => byModule.get(moduleLabel) ?? { moduleLabel, uniqueUsers: 0, meaningfulActions: 0, totalEvents: 0, lastUsedAt: null })
    .sort((a, b) => b.uniqueUsers - a.uniqueUsers || b.meaningfulActions - a.meaningfulActions || a.moduleLabel.localeCompare(b.moduleLabel))
  const activeModules = modules.filter((row) => row.totalEvents > 0).length
  return <section className="space-y-4">
    <div><h2 className="font-semibold text-ink-200">Tool &amp; module usage · {rangeLabel(rangeDays)}</h2><p className="mt-1 text-xs text-ink-500">Privacy-safe activity collected from this release forward. No student names, lesson text, or generated content is recorded.</p></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={Users} label="Teachers using tools" value={usage.uniqueUsers ?? 0} note="Unique signed-in teachers" color="text-cyan-400" /><Metric icon={Wrench} label="Useful actions" value={usage.meaningfulActions ?? 0} note="Created, saved, completed, printed, exported, or reused" color="text-emerald-400" /><Metric icon={Layers} label="Modules with activity" value={activeModules} note={`${modules.length - activeModules} promotion opportunities`} color="text-violet-400" /></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="card overflow-hidden"><div className="border-b border-ink-800 p-5"><h3 className="font-semibold text-ink-100">Module popularity</h3><p className="mt-1 text-xs text-ink-500">Use low-adoption rows to plan specialty-specific posts and demos.</p></div><div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="sticky top-0 bg-ink-950 text-xs uppercase tracking-wide text-ink-600"><tr><th className="px-5 py-3">Module</th><th>Teachers</th><th>Useful actions</th><th>Marketing signal</th></tr></thead><tbody className="divide-y divide-ink-800">{modules.map((row, index) => <tr key={row.moduleLabel}><td className="px-5 py-3 font-semibold text-ink-200">{row.moduleLabel}</td><td>{row.uniqueUsers}</td><td>{row.meaningfulActions}</td><td>{index === 0 && row.uniqueUsers > 0 ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">Most popular</span> : row.uniqueUsers === 0 ? <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-400">Promotion opportunity</span> : <span className="text-xs text-ink-500">Building interest</span>}</td></tr>)}</tbody></table></div></div>
      <div className="card overflow-hidden"><div className="border-b border-ink-800 p-5"><h3 className="font-semibold text-ink-100">Most-used tools</h3><p className="mt-1 text-xs text-ink-500">Opens show discovery; useful actions show teachers putting a tool to work.</p></div><div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="sticky top-0 bg-ink-950 text-xs uppercase tracking-wide text-ink-600"><tr><th className="px-5 py-3">Tool</th><th>Module</th><th>Teachers</th><th>Opens</th><th>Useful</th></tr></thead><tbody className="divide-y divide-ink-800">{(usage.tools ?? []).map((row) => <tr key={`${row.moduleLabel}-${row.toolKey}`}><td className="px-5 py-3 font-semibold text-ink-200">{toolLabel(row.toolKey)}</td><td className="text-xs text-ink-500">{row.moduleLabel}</td><td>{row.uniqueUsers}</td><td>{row.opens}</td><td><strong>{row.meaningfulActions}</strong><p className="text-[11px] text-ink-600">{row.created + row.updated} saves · {row.completes} complete · {row.prints + row.exports} print/export</p></td></tr>)}</tbody></table>{!(usage.tools ?? []).length && <p className="p-8 text-center text-sm text-ink-500">Usage will appear as teachers begin using the newly tracked tools.</p>}</div></div>
    </div>
  </section>
}

function GenerationHealth({ health, rangeDays }) {
  const tools = health.tools ?? []
  return <section className="space-y-4">
    <div><h2 className="font-semibold text-ink-200">AI generation health · {rangeLabel(rangeDays)}</h2><p className="mt-1 text-xs text-ink-500">Shows privacy-safe service reliability only. Lesson topics, prompts, student information, and generated content are never recorded here.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={RefreshCw} label="Automatic recoveries" value={health.recovered ?? 0} note="Finished after a quiet retry" color="text-emerald-400" /><Metric icon={XCircle} label="Generations still failed" value={health.failed ?? 0} note="Teacher received a friendly retry option" color="text-red-400" /><Metric icon={Users} label="Teachers affected" value={health.affectedTeachers ?? 0} note="Unique signed-in teachers" color="text-amber-400" /><Metric icon={Activity} label="Recovery rate" value={`${health.recoveryRate ?? 100}%`} note={`${health.retries ?? 0} retry attempts recorded`} color="text-cyan-400" /></div>
    {tools.length > 0 && <div className="card overflow-hidden"><div className="border-b border-ink-800 p-5"><h3 className="font-semibold text-ink-100">Where generation trouble occurred</h3><p className="mt-1 text-xs text-ink-500">Use this to see whether one tool or module needs attention.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-ink-950 text-xs uppercase tracking-wide text-ink-600"><tr><th className="px-5 py-3">Generator</th><th>Module</th><th>Teachers</th><th>Retries</th><th>Recovered</th><th>Failed</th></tr></thead><tbody className="divide-y divide-ink-800">{tools.map((row) => <tr key={`${row.moduleLabel}-${row.toolKey}`}><td className="px-5 py-3 font-semibold text-ink-200">{toolLabel(row.toolKey.replace(/^ai-/, ''))}</td><td className="text-xs text-ink-500">{row.moduleLabel}</td><td>{row.affectedTeachers}</td><td>{row.retries}</td><td className="text-emerald-400">{row.recovered}</td><td className="text-red-400">{row.failed}</td></tr>)}</tbody></table></div></div>}
  </section>
}

const FILTERS = [
  ['all', 'All customers'], ['never_activated', 'Never activated'], ['inactive_7', 'Inactive 7+'],
  ['inactive_30', 'Inactive 30+'], ['trial', 'Trials'], ['paying', 'Paying'], ['canceling', 'Canceling soon'], ['canceled_30', 'Canceled recently'], ['canceled', 'All canceled'],
]

function draftFor(customer) {
  const first = customer.name?.split(/\s+/)[0] || 'there'
  if (customer.status === 'canceling') return { subject: 'Can I help before your PlansK12 access ends?', body: `Hi ${first},\n\nI noticed your PlansK12 subscription is scheduled to end. I’m Stacey, the teacher who created PlansK12, and I’d genuinely appreciate knowing what would make it more useful for you.\n\nIf something was confusing or a feature was missing, reply and tell me—I read every response.\n\nThank you,\nStacey\nPlansK12` }
  if (customer.status === 'canceled') return { subject: 'PlansK12 has grown since you last visited', body: `Hi ${first},\n\nI’m Stacey, the teacher who created PlansK12. I wanted to reach out personally because you tried PlansK12 in the past, and I’ve made meaningful improvements based on teacher feedback.\n\nI’d love to know what was missing or frustrating when you used it. If you reply, I’ll personally help you see whether the new tools are a better fit for your classroom.\n\nThank you for giving it a try,\nStacey\nPlansK12` }
  if (customer.lessonCount === 0 && (customer.toolUsageCount ?? 0) === 0) return { subject: 'Can I help you get started with PlansK12?', body: `Hi ${first},\n\nI wanted to check in personally. I’m Stacey, the teacher who created PlansK12. It looks like you haven’t created your first lesson or saved work in a teacher tool yet, and I’d be happy to help you get started.\n\nWhat subject and grade do you teach? Reply and I’ll point you to the best place to begin.\n\nStacey\nPlansK12` }
  return { subject: 'A quick PlansK12 check-in', body: `Hi ${first},\n\nI’m Stacey, the teacher who created PlansK12. I noticed you haven’t used the site recently and wanted to check whether there’s anything I can help with.\n\nWe’ve been improving the lesson experience and teacher tools, and I’d love to hear what would make PlansK12 more useful in your classroom.\n\nStacey\nPlansK12` }
}

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"` }

function CustomerWorkspace({ customers, filter, setFilter, onRefresh }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const [outcome, setOutcome] = useState('contacted')
  const [followUpAt, setFollowUpAt] = useState('')
  const [sendingRecovery, setSendingRecovery] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)
  const [recoveryError, setRecoveryError] = useState('')
  useEffect(() => {
    if (!selected) return undefined
    const frame = requestAnimationFrame(() => {
      const heading = [...document.querySelectorAll('h3')].find((el) => el.textContent?.startsWith('Personal outreach for'))
      heading?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [selected])
  const visible = useMemo(() => customers.filter((c) => {
    const matchesFilter = filter === 'all' || c.segment === filter || c.status === filter || (filter === 'canceled_30' && c.status === 'canceled' && c.canceledRecently) || (filter === 'inactive_7' && c.inactiveDays >= 7) || (filter === 'inactive_30' && c.inactiveDays >= 30)
    const haystack = `${c.name} ${c.email} ${(c.teachingAreas ?? []).join(' ')}`.toLowerCase()
    return matchesFilter && haystack.includes(query.toLowerCase())
  }), [customers, filter, query])

  function copy(value, key) {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  function exportCsv() {
    const header = ['Name', 'Email', 'Status', 'Access ends', 'Canceled', 'Lessons', 'Useful tool actions', 'Modules used', 'Tools used', 'Inactive days', 'Joined', 'Last activity', 'Teaching areas', 'Cancellation reason', 'Feedback', 'Last contacted', 'Follow-up', 'Outcome', 'Owner note']
    const rows = visible.map((c) => [c.name, c.email, c.status, c.accessEndsAt, c.canceledAt, c.lessonCount, c.toolUsageCount ?? 0, (c.modulesUsed ?? []).join('; '), (c.toolsUsed ?? []).map((tool) => `${toolLabel(tool.toolKey)} (${tool.meaningfulActions})`).join('; '), c.inactiveDays, c.joinedAt, c.lastActivityAt, (c.teachingAreas ?? []).join('; '), REASON_LABELS[c.cancellationFeedback?.reason] ?? c.cancellationFeedback?.reason, c.cancellationFeedback?.detail, c.contact?.last_contacted_at, c.contact?.follow_up_at, c.contact?.outcome, c.contact?.note])
    const blob = new Blob([[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `plansk12-${filter}-customers.csv`; a.click(); URL.revokeObjectURL(url)
  }

  function selectCustomer(customer) {
    setSelected(customer)
    setNote(customer.contact?.note ?? '')
    setOutcome(customer.contact?.outcome ?? 'contacted')
    setFollowUpAt(customer.contact?.follow_up_at?.slice(0, 10) ?? '')
    setRecoverySent(false)
    setRecoveryError('')
  }

  async function sendRecoveryEmail() {
    if (!selected) return
    const endDate = selected.accessEndsAt ? new Date(selected.accessEndsAt).toLocaleDateString() : 'the scheduled end date'
    const confirmed = window.confirm(`Send the reviewed cancellation-recovery email to ${selected.email}? Their access is scheduled to end ${endDate}.`)
    if (!confirmed) return
    setSendingRecovery(true)
    setRecoveryError('')
    try {
      const result = await sendCancellationRecoveryEmail(selected.id)
      setRecoverySent(true)
      if (!result?.alreadySent) await onRefresh()
    } catch (error) {
      setRecoveryError(error.message || 'The email could not be sent.')
    } finally {
      setSendingRecovery(false)
    }
  }

  async function saveFollowUp() {
    setSaving(true)
    try { await saveOwnerContact({ userId: selected.id, contacted: true, note, outcome, followUpAt: followUpAt || null }); await onRefresh(); setSelected(null); setNote('') } finally { setSaving(false) }
  }

  return <section id="customer-workspace" className="card scroll-mt-24 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-ink-100">Customer follow-up workspace</h2><p className="mt-1 text-xs text-ink-500">Private owner-only contact information. Drafts open for your review and never send automatically.</p></div><button onClick={exportCsv} className="btn-secondary text-xs"><Download size={14} /> Export {visible.length} to CSV</button></div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{FILTERS.map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === key ? 'bg-accent-500 text-white' : 'bg-ink-900 text-ink-400'}`}>{label}</button>)}</div>
    <label className="mt-4 flex items-center gap-2 rounded-lg border border-ink-800 px-3"><Search size={15} className="text-ink-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, or teaching area" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-ink-600"><tr><th className="pb-2">Customer</th><th>Usage</th><th>Status</th><th>Important date</th><th>Last activity</th><th>Follow-up</th></tr></thead><tbody className="divide-y divide-ink-800">{visible.map((c) => <tr key={c.id}><td className="py-3"><p className="font-semibold text-ink-200">{c.name}</p><p className="text-xs text-ink-500">{c.email}</p>{c.cancellationFeedback?.reason && <p className="mt-1 text-xs text-amber-500">Reason: {REASON_LABELS[c.cancellationFeedback.reason] ?? c.cancellationFeedback.reason}</p>}</td><td><strong>{c.lessonCount}</strong> lessons<p className="text-xs text-ink-500"><strong className="text-ink-300">{c.toolUsageCount ?? 0}</strong> tool actions</p>{c.modulesUsed?.length > 0 && <p className="mt-1 max-w-52 text-[11px] text-cyan-500">{c.modulesUsed.join(' · ')}</p>}</td><td><span className={`rounded-full px-2 py-1 text-xs ${c.status === 'canceling' ? 'bg-red-500/10 text-red-400' : c.status === 'canceled' ? 'bg-orange-500/10 text-orange-400' : c.status === 'trial' ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{c.status === 'canceling' ? 'canceling soon' : c.status}</span></td><td>{c.accessEndsAt ? `Ends ${new Date(c.accessEndsAt).toLocaleDateString()}` : c.canceledAt ? `Canceled ${new Date(c.canceledAt).toLocaleDateString()}` : '—'}</td><td>{c.inactiveDays === 0 ? 'Today' : `${c.inactiveDays} days ago`}</td><td><button onClick={() => selectCustomer(c)} className="btn-secondary text-xs"><Mail size={14} /> {c.contact?.last_contacted_at ? 'Update follow-up' : 'Help customer'}</button></td></tr>)}</tbody></table>{visible.length === 0 && <p className="py-8 text-center text-sm text-ink-500">No customers match this view.</p>}</div>
    {selected && <div className="mt-5 rounded-xl border border-accent-500/25 bg-accent-500/5 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold text-ink-100">Personal outreach for {selected.name}</h3><p className="text-xs text-ink-500">Suggested because: {selected.lessonCount === 0 ? 'no lesson created yet' : selected.status === 'canceling' ? `access is scheduled to end${selected.accessEndsAt ? ` ${new Date(selected.accessEndsAt).toLocaleDateString()}` : ''}` : selected.status === 'canceled' ? `subscription canceled${selected.canceledAt ? ` ${new Date(selected.canceledAt).toLocaleDateString()}` : ''}` : `${selected.inactiveDays} inactive days`}.</p></div><button onClick={() => setSelected(null)} aria-label="Close"><XCircle size={18} /></button></div>{selected.cancellationFeedback && <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm"><p className="font-semibold text-amber-500">They told us: {REASON_LABELS[selected.cancellationFeedback.reason] ?? selected.cancellationFeedback.reason}</p>{selected.cancellationFeedback.detail && <p className="mt-1 text-ink-300">“{selected.cancellationFeedback.detail}”</p>}</div>}{selected.status === 'canceling' && <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3"><p className="text-sm font-semibold text-red-400">Cancellation recovery</p><p className="mt-1 text-xs text-ink-400">The email introduces you as the teacher who created PlansK12, asks what went wrong, and links them back to Settings before access ends.</p>{selected.recoveryEmailAt || recoverySent ? <p className="mt-2 text-xs font-semibold text-emerald-400">Recovery email sent{selected.recoveryEmailAt ? ` ${new Date(selected.recoveryEmailAt).toLocaleDateString()}` : ''}.</p> : <button type="button" onClick={sendRecoveryEmail} disabled={sendingRecovery} className="btn-primary mt-3 !bg-red-500 hover:!bg-red-600">{sendingRecovery ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Review confirmation &amp; send save email</button>}{recoveryError && <p className="mt-2 text-xs text-red-400">{recoveryError}</p>}</div>}{selected.contact?.last_contacted_at && <p className="mt-3 text-xs text-ink-500">Last personally contacted {new Date(selected.contact.last_contacted_at).toLocaleDateString()}.</p>}{selected.automaticEmailAt && <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-500">Automated activation email sent {new Date(selected.automaticEmailAt).toLocaleDateString()}. Consider the timing before personal outreach.</p>}<DraftActions customer={selected} copied={copied} copy={copy} /><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-500">Outcome<select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="input-field mt-1"><option value="contacted">Contacted</option><option value="replied">Replied</option><option value="returned">Returned</option><option value="still_inactive">Not returning now</option><option value="canceled">Cancellation confirmed</option></select></label><label className="text-xs font-semibold text-ink-500">Follow up on<input type="date" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} className="input-field mt-1" /></label></div><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note: what they needed, what you offered, or what to improve" className="input-field mt-3 min-h-20" /><button onClick={saveFollowUp} disabled={saving} className="btn-primary mt-3">{saving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Save outreach &amp; follow-up</button></div>}
  </section>
}

function DraftActions({ customer, copied, copy }) {
  const draft = draftFor(customer)
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customer.email)}&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
  return <div className="mt-4 space-y-2"><div className="rounded-lg bg-ink-900 p-3"><p className="text-xs font-semibold text-ink-500">Subject</p><p className="mt-1 text-sm">{draft.subject}</p><p className="mt-3 whitespace-pre-wrap text-sm text-ink-400">{draft.body}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => copy(draft.subject, 'subject')} className="btn-secondary text-xs"><Copy size={13} /> {copied === 'subject' ? 'Copied' : 'Copy subject'}</button><button onClick={() => copy(draft.body, 'body')} className="btn-secondary text-xs"><Copy size={13} /> {copied === 'body' ? 'Copied' : 'Copy message'}</button><a href={gmail} target="_blank" rel="noreferrer" className="btn-primary text-xs"><Mail size={13} /> Open draft in Gmail</a></div></div>
}
