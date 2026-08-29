import { useEffect, useState } from 'react'
import { Activity, BarChart3, CreditCard, DollarSign, Eye, Loader2, MousePointerClick, RefreshCw, TrendingDown, TrendingUp, UserCheck, Users, UserX, XCircle } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import { getOwnerAnalytics } from '../services/ownerAnalyticsService'

const REASON_LABELS = { seasonal: 'Seasonal / summer', price: 'Price', not_using: 'Not using it enough', missing_feature: 'Missing feature', confusing: 'Confusing', output_quality: 'Output quality', technical: 'Technical problem', other: 'Other' }

function Metric({ icon: Icon, label, value, note, color = 'text-accent-400' }) {
  return <div className="card p-5"><Icon size={21} className={color} /><p className="mt-4 text-2xl font-bold text-ink-50">{value}</p><p className="mt-1 text-sm font-semibold text-ink-300">{label}</p>{note && <p className="mt-1 text-xs text-ink-500">{note}</p>}</div>
}

export default function OwnerDashboard() {
  const { isOwner, loaded } = useTrial()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

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
    {a && <section><div className="mb-3"><h2 className="font-semibold text-ink-200">Customer activation &amp; inactivity</h2><p className="mt-1 text-xs text-ink-500">Private aggregate signals only. “Activated” means the customer has created at least one lesson.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric icon={UserCheck} label="Activated customers" value={a.activated} note={`${a.activationRate}% of matched customers`} color="text-emerald-400" /><Metric icon={UserX} label="Never activated" value={a.neverActivated} note="No lesson created yet" color="text-amber-400" /><Metric icon={Activity} label="Inactive 7+ days" value={a.inactive7d} note="No recent sign-in or lesson" color="text-orange-400" /><Metric icon={TrendingDown} label="Inactive 30+ days" value={a.inactive30d} note="Highest re-engagement priority" color="text-red-400" /><Metric icon={Users} label="Matched customers" value={a.customers} note="Current Stripe customers linked to accounts" /></div></section>}
    <section><h2 className="mb-3 font-semibold text-ink-200">Demo funnel · last 30 days</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Eye} label="Demo visits" value={f.demoViews} /><Metric icon={MousePointerClick} label="Trial clicks" value={f.trialClicks} note={f.demoViews ? `${Math.round(f.trialClicks / f.demoViews * 100)}% of demo visits` : 'Collecting data'} color="text-emerald-400" /><Metric icon={Users} label="New accounts" value={f.newSignups} color="text-violet-400" /><Metric icon={BarChart3} label="Lessons created" value={data.product.lessons30d} note={`${data.product.totalLessons} all time`} color="text-amber-400" /></div></section>
    <div className="grid gap-5 lg:grid-cols-2"><section className="card p-6"><h2 className="font-semibold text-ink-100">Demo sections viewed</h2><div className="mt-5 space-y-4">{Object.entries(f.sections).map(([name, count]) => <div key={name}><div className="flex justify-between text-sm"><span className="capitalize text-ink-300">{name}</span><strong>{count}</strong></div><div className="mt-1.5 h-2 rounded-full bg-ink-800"><div className="h-full rounded-full bg-accent-500" style={{ width: `${count / maxSection * 100}%` }} /></div></div>)}</div></section>
      <section className="card p-6"><h2 className="font-semibold text-ink-100">Cancellation reasons</h2>{reasons.length ? <div className="mt-5 space-y-3">{reasons.map(([reason, count]) => <div key={reason} className="flex justify-between rounded-lg bg-ink-900 p-3 text-sm"><span>{REASON_LABELS[reason] ?? reason}</span><strong>{count}</strong></div>)}</div> : <p className="mt-4 text-sm text-ink-500">No cancellation surveys submitted yet. New responses will appear here.</p>}</section></div>
    {data.cancellation.recent.length > 0 && <section className="card p-6"><h2 className="font-semibold text-ink-100">Recent cancellation feedback</h2><div className="mt-4 space-y-3">{data.cancellation.recent.slice(0, 10).map((row, i) => <div key={i} className="border-b border-ink-800 pb-3 last:border-0"><p className="text-sm font-semibold">{REASON_LABELS[row.reason] ?? row.reason}</p>{row.detail && <p className="mt-1 text-sm text-ink-400">{row.detail}</p>}<p className="mt-1 text-xs text-ink-600">{new Date(row.created_at).toLocaleDateString()}</p></div>)}</div></section>}
  </div>
}
