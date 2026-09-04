import { useEffect, useState } from 'react'
import { CheckCircle2, HeartPulse, Loader2, Send } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getPublicStaffWellnessChallenge, submitStaffWellnessCheckIn } from '../services/staffWellnessService'

const ACTIVITIES = ['Challenge progress', 'Movement or active minutes', 'Mobility or stretching', 'Strength activity', 'Outdoor activity', 'Mindfulness or stress reset', 'Recovery or rest routine', 'Connection or kindness', 'Wellness bingo squares', 'Inclusive alternative']

export default function StaffWellnessCheckIn() {
  const { token } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [form, setForm] = useState({ name: '', team: '', amount: 1, activity: 'Challenge progress' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getPublicStaffWellnessChallenge(token).then(setChallenge).catch((err) => setError(err.message)) }, [token])

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try { await submitStaffWellnessCheckIn(token, form); setSuccess(true); setForm((current) => ({ ...current, amount: 1, activity: 'Challenge progress' })) } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  if (!challenge && !error) return <div className="flex min-h-screen items-center justify-center bg-ink-950"><Loader2 className="animate-spin text-emerald-400" /></div>

  return <main className="min-h-screen bg-gradient-to-br from-ink-950 via-ink-900 to-emerald-950 px-4 py-10 sm:px-6"><div className="mx-auto max-w-xl"><div className="mb-6 flex items-center justify-center gap-2 text-lg font-black text-white"><HeartPulse className="text-emerald-400" /> PlansK12</div>{error && !challenge ? <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200"><h1 className="text-xl font-black">Check-in unavailable</h1><p className="mt-2 text-sm">{error}</p></section> : <section className="overflow-hidden rounded-3xl border border-emerald-500/25 bg-ink-950/80 shadow-2xl"><header className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-400">Staff wellness check-in</p><h1 className="mt-2 text-3xl font-black text-white">{challenge.title}</h1><p className="mt-3 text-sm leading-relaxed text-ink-400">{challenge.settings.blurb}</p><p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-200">{challenge.settings.alternative}</p></header>{success ? <div className="p-8 text-center"><CheckCircle2 size={48} className="mx-auto text-emerald-400" /><h2 className="mt-4 text-2xl font-black text-white">Progress submitted!</h2><p className="mt-2 text-sm text-ink-400">The challenge organizer will review it before totals update.</p><button onClick={() => setSuccess(false)} className="btn-primary mt-6">Submit another check-in</button></div> : <form onSubmit={submit} className="space-y-5 p-6 sm:p-8"><label className="block text-sm font-bold text-ink-200">Name, initials, or staff ID<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input-field mt-2" placeholder="Use the format your organizer requested" /></label><label className="block text-sm font-bold text-ink-200">Team or department<select value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })} className="input-field mt-2"><option value="">Choose team</option>{(challenge.teams ?? []).map((team) => <option key={team}>{team}</option>)}</select></label><label className="block text-sm font-bold text-ink-200">Type of progress<select value={form.activity} onChange={(event) => setForm({ ...form, activity: event.target.value })} className="input-field mt-2">{ACTIVITIES.map((activity) => <option key={activity}>{activity}</option>)}</select></label><label className="block text-sm font-bold text-ink-200">Amount ({challenge.settings.unit})<input required type="number" min="0.01" max="100000" step="any" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="input-field mt-2" /></label>{error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<button disabled={saving} className="btn-primary w-full">{saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit progress</button><div className="rounded-xl border border-ink-800 p-3 text-xs leading-relaxed text-ink-500"><strong className="text-ink-300">Privacy:</strong> This form tracks challenge progress only. Do not enter weight, BMI, diagnoses, injuries, medications, sleep totals, calories, or other private health information.</div></form>}</section>}<p className="mt-5 text-center text-xs text-ink-600">Progress is reviewed by your challenge organizer.</p></div></main>
}
