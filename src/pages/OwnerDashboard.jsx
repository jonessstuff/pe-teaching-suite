import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Copy, CreditCard, DollarSign, Download, Eye, Loader2, Mail, MousePointerClick, RefreshCw, Search, TrendingDown, TrendingUp, UserCheck, Users, UserX, XCircle } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import { getOwnerAnalytics, saveOwnerContact } from '../services/ownerAnalyticsService'

const REASON_LABELS = { seasonal: 'Seasonal / summer', price: 'Price', not_using: 'Not using it enough', missing_feature: 'Missing feature', confusing: 'Confusing', output_quality: 'Output quality', technical: 'Technical problem', other: 'Other' }

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

  function openCustomers(filter) {
    setCustomerFilter(filter)
    setTimeout(() => document.getElementById('customer-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  async function load() {
    setLoading(true); setError(null)
    try { setData(await getOwnerAnalytics()) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => {
    if (!isOwner) return undefined
    let active = true
    getOwnerAnalytics()
      .then((result) => { if (active) setData(result) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isOwner])

  if (!loaded || loading) return <div className="flex items-center gap-2 text-ink-400"><Loader2 size={18} className="animate-spin" /> Loading owner dashboard…</div>
  if (!isOwner) return <div className="card border-red-500/30 p-6 text-red-400">Owner access required.</div>
  if (error) return <div className="card p-6"><p className="text-red-400">{error}</p><button onClick={load} className="btn-secondary mt-4">Try again</button></div>

  const s = data.subscriptions
  const f = data.funnel30d
  const a = data.activation
  const reasons = Object.entries(data.cancellation.reasons).sort((a, b) => b[1] - a[1])
  const maxSection = Math.max(1, ...Object.values(f.sections))
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="label-eyebrow mb-2">Private owner view</p><h1 className="text-3xl font-semibold text-ink-50">Growth &amp; Retention</h1><p className="mt-2 text-ink-400">Subscriptions are live from Stripe. Funnel activity covers the last 30 days.</p></div><button onClick={load} className="btn-secondary"><RefreshCw size={16} /> Refresh</button></div>
    <section><h2 className="mb-3 font-semibold text-ink-200">Revenue health</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={CreditCard} label="Paying subscriptions" value={s.active} color="text-emerald-400" /><Metric icon={Users} label="Trials" value={s.trialing} color="text-violet-400" /><Metric icon={DollarSign} label="Estimated MRR" value={`$${(s.mrrCents / 100).toFixed(0)}`} note="Annual plans normalized" color="text-amber-400" /><Metric icon={TrendingUp} label="Current access" value={s.current} note="Paid + trialing subscriptions" /></div></section>
    <section><h2 className="mb-3 font-semibold text-ink-200">Cancellation status</h2><div className="grid gap-4 sm:grid-cols-3"><Metric icon={XCircle} label="Scheduled to cancel" value={s.scheduledCancel} note="Still active until period end" color="text-red-400" /><Metric icon={XCircle} label="Canceled · last 30 days" value={s.canceled30d} note="Completed Stripe cancellations" color="text-orange-400" /><Metric icon={XCircle} label="Total canceled" value={s.canceledTotal} note="Historical canceled subscriptions" color="text-ink-400" /></div></section>
    {a && <section><div className="mb-3"><h2 className="font-semibold text-ink-200">Customer activation &amp; inactivity</h2><p className="mt-1 text-xs text-ink-500">Click a card to open the matching customer list. “Activated” means at least one lesson created.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric icon={UserCheck} label="Activated customers" value={a.activated} note={`${a.activationRate}% of matched customers`} color="text-emerald-400" onClick={() => openCustomers('all')} /><Metric icon={UserX} label="Never activated" value={a.neverActivated} note="No lesson created yet" color="text-amber-400" onClick={() => openCustomers('never_activated')} /><Metric icon={Activity} label="Inactive 7+ days" value={a.inactive7d} note="No recent sign-in or lesson" color="text-orange-400" onClick={() => openCustomers('inactive_7')} /><Metric icon={TrendingDown} label="Inactive 30+ days" value={a.inactive30d} note="Highest re-engagement priority" color="text-red-400" onClick={() => openCustomers('inactive_30')} /><Metric icon={Users} label="Matched customers" value={a.customers} note="Current Stripe customers linked to accounts" onClick={() => openCustomers('all')} /></div></section>}
    {data.customers && <CustomerWorkspace customers={data.customers} filter={customerFilter} setFilter={setCustomerFilter} onRefresh={load} />}
    <section><h2 className="mb-3 font-semibold text-ink-200">Demo funnel · last 30 days</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Eye} label="Demo visits" value={f.demoViews} /><Metric icon={MousePointerClick} label="Trial clicks" value={f.trialClicks} note={f.demoViews ? `${Math.round(f.trialClicks / f.demoViews * 100)}% of demo visits` : 'Collecting data'} color="text-emerald-400" /><Metric icon={Users} label="New accounts" value={f.newSignups} color="text-violet-400" /><Metric icon={BarChart3} label="Lessons created" value={data.product.lessons30d} note={`${data.product.totalLessons} all time`} color="text-amber-400" /></div></section>
    <div className="grid gap-5 lg:grid-cols-2"><section className="card p-6"><h2 className="font-semibold text-ink-100">Demo sections viewed</h2><div className="mt-5 space-y-4">{Object.entries(f.sections).map(([name, count]) => <div key={name}><div className="flex justify-between text-sm"><span className="capitalize text-ink-300">{name}</span><strong>{count}</strong></div><div className="mt-1.5 h-2 rounded-full bg-ink-800"><div className="h-full rounded-full bg-accent-500" style={{ width: `${count / maxSection * 100}%` }} /></div></div>)}</div></section>
      <section className="card p-6"><h2 className="font-semibold text-ink-100">Cancellation reasons</h2>{reasons.length ? <div className="mt-5 space-y-3">{reasons.map(([reason, count]) => <div key={reason} className="flex justify-between rounded-lg bg-ink-900 p-3 text-sm"><span>{REASON_LABELS[reason] ?? reason}</span><strong>{count}</strong></div>)}</div> : <p className="mt-4 text-sm text-ink-500">No cancellation surveys submitted yet. New responses will appear here.</p>}</section></div>
    {data.cancellation.recent.length > 0 && <section className="card p-6"><h2 className="font-semibold text-ink-100">Recent cancellation feedback</h2><div className="mt-4 space-y-3">{data.cancellation.recent.slice(0, 10).map((row, i) => <div key={i} className="border-b border-ink-800 pb-3 last:border-0"><p className="text-sm font-semibold">{REASON_LABELS[row.reason] ?? row.reason}</p>{row.detail && <p className="mt-1 text-sm text-ink-400">{row.detail}</p>}<p className="mt-1 text-xs text-ink-600">{new Date(row.created_at).toLocaleDateString()}</p></div>)}</div></section>}
  </div>
}

const FILTERS = [
  ['all', 'All customers'], ['never_activated', 'Never activated'], ['inactive_7', 'Inactive 7+'],
  ['inactive_30', 'Inactive 30+'], ['trial', 'Trials'], ['paying', 'Paying'], ['canceling', 'Canceling'],
]

function draftFor(customer) {
  const first = customer.name?.split(/\s+/)[0] || 'there'
  if (customer.status === 'canceling') return { subject: 'Can I help before your PlansK12 access ends?', body: `Hi ${first},\n\nI noticed your PlansK12 subscription is scheduled to end. I’m Stacey, the teacher who created PlansK12, and I’d genuinely appreciate knowing what would make it more useful for you.\n\nIf something was confusing or a feature was missing, reply and tell me—I read every response.\n\nThank you,\nStacey\nPlansK12` }
  if (customer.lessonCount === 0) return { subject: 'Can I help you create your first PlansK12 lesson?', body: `Hi ${first},\n\nI wanted to check in personally. I’m Stacey, the teacher who created PlansK12. It looks like you haven’t created your first lesson yet, and I’d be happy to help you get started.\n\nWhat subject and grade do you teach? Reply and I’ll point you to the best place to begin.\n\nStacey\nPlansK12` }
  return { subject: 'A quick PlansK12 check-in', body: `Hi ${first},\n\nI’m Stacey, the teacher who created PlansK12. I noticed you haven’t used the site recently and wanted to check whether there’s anything I can help with.\n\nWe’ve been improving the lesson experience and teacher tools, and I’d love to hear what would make PlansK12 more useful in your classroom.\n\nStacey\nPlansK12` }
}

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"` }

function CustomerWorkspace({ customers, filter, setFilter, onRefresh }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const visible = useMemo(() => customers.filter((c) => {
    const matchesFilter = filter === 'all' || c.segment === filter || c.status === filter || (filter === 'inactive_7' && c.inactiveDays >= 7) || (filter === 'inactive_30' && c.inactiveDays >= 30)
    const haystack = `${c.name} ${c.email} ${(c.teachingAreas ?? []).join(' ')}`.toLowerCase()
    return matchesFilter && haystack.includes(query.toLowerCase())
  }), [customers, filter, query])

  function copy(value, key) {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  function exportCsv() {
    const header = ['Name', 'Email', 'Status', 'Segment', 'Lessons', 'Inactive days', 'Joined', 'Last activity', 'Teaching areas']
    const rows = visible.map((c) => [c.name, c.email, c.status, c.segment, c.lessonCount, c.inactiveDays, c.joinedAt, c.lastActivityAt, (c.teachingAreas ?? []).join('; ')])
    const blob = new Blob([[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `plansk12-${filter}-customers.csv`; a.click(); URL.revokeObjectURL(url)
  }

  async function markContacted() {
    setSaving(true)
    try { await saveOwnerContact({ userId: selected.id, contacted: true, note, outcome: 'contacted' }); await onRefresh(); setSelected(null); setNote('') } finally { setSaving(false) }
  }

  return <section id="customer-workspace" className="card scroll-mt-24 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-ink-100">Customer follow-up workspace</h2><p className="mt-1 text-xs text-ink-500">Private owner-only contact information. Drafts open for your review and never send automatically.</p></div><button onClick={exportCsv} className="btn-secondary text-xs"><Download size={14} /> Export {visible.length} to CSV</button></div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{FILTERS.map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === key ? 'bg-accent-500 text-white' : 'bg-ink-900 text-ink-400'}`}>{label}</button>)}</div>
    <label className="mt-4 flex items-center gap-2 rounded-lg border border-ink-800 px-3"><Search size={15} className="text-ink-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, or teaching area" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-ink-600"><tr><th className="pb-2">Customer</th><th>Usage</th><th>Status</th><th>Last activity</th><th>Follow-up</th></tr></thead><tbody className="divide-y divide-ink-800">{visible.map((c) => <tr key={c.id}><td className="py-3"><p className="font-semibold text-ink-200">{c.name}</p><p className="text-xs text-ink-500">{c.email}</p></td><td><strong>{c.lessonCount}</strong> lessons</td><td><span className={`rounded-full px-2 py-1 text-xs ${c.status === 'canceling' ? 'bg-red-500/10 text-red-400' : c.status === 'trial' ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{c.status}</span></td><td>{c.inactiveDays === 0 ? 'Today' : `${c.inactiveDays} days ago`}</td><td><button onClick={() => { setSelected(c); setNote(c.contact?.note ?? '') }} className="btn-secondary text-xs"><Mail size={14} /> Help customer</button></td></tr>)}</tbody></table>{visible.length === 0 && <p className="py-8 text-center text-sm text-ink-500">No customers match this view.</p>}</div>
    {selected && <div className="mt-5 rounded-xl border border-accent-500/25 bg-accent-500/5 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold text-ink-100">Personal outreach for {selected.name}</h3><p className="text-xs text-ink-500">Suggested because: {selected.lessonCount === 0 ? 'no lesson created yet' : selected.status === 'canceling' ? 'subscription scheduled to end' : `${selected.inactiveDays} inactive days`}.</p></div><button onClick={() => setSelected(null)} aria-label="Close"><XCircle size={18} /></button></div>{selected.automaticEmailAt && <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-500">Automated activation email sent {new Date(selected.automaticEmailAt).toLocaleDateString()}. Consider the timing before personal outreach.</p>}<DraftActions customer={selected} copied={copied} copy={copy} /><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note about this customer or follow-up" className="input-field mt-3 min-h-20" /><button onClick={markContacted} disabled={saving} className="btn-primary mt-3">{saving ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} Mark contacted &amp; save note</button></div>}
  </section>
}

function DraftActions({ customer, copied, copy }) {
  const draft = draftFor(customer)
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customer.email)}&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
  return <div className="mt-4 space-y-2"><div className="rounded-lg bg-ink-900 p-3"><p className="text-xs font-semibold text-ink-500">Subject</p><p className="mt-1 text-sm">{draft.subject}</p><p className="mt-3 whitespace-pre-wrap text-sm text-ink-400">{draft.body}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => copy(draft.subject, 'subject')} className="btn-secondary text-xs"><Copy size={13} /> {copied === 'subject' ? 'Copied' : 'Copy subject'}</button><button onClick={() => copy(draft.body, 'body')} className="btn-secondary text-xs"><Copy size={13} /> {copied === 'body' ? 'Copied' : 'Copy message'}</button><a href={gmail} target="_blank" rel="noreferrer" className="btn-primary text-xs"><Mail size={13} /> Open draft in Gmail</a></div></div>
}
