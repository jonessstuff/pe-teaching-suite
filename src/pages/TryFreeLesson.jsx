import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Sparkles, ArrowRight, Check, Mail } from 'lucide-react'
import { leadStart, leadFinalize } from '../services/leadMagnetService'
import {
  generateLesson, generateArtLesson, generateMusicLesson,
  generateStemLesson, generateLibraryLesson,
} from '../services/generationService'
import FreeLessonRenderer from '../components/FreeLessonRenderer'

const CHECKOUT_URL = 'https://buy.stripe.com/5kQ5kveUR2xWh0tcoi0kE05'

const SUBJECTS = [
  { value: 'PE', label: 'PE' },
  { value: 'Health', label: 'Health' },
  { value: 'Art', label: 'Art' },
  { value: 'Music', label: 'Music' },
  { value: 'STEM', label: 'STEM' },
  { value: 'Library', label: 'Library & Media' },
]
const GRADES = [
  { value: 0, label: 'Kindergarten' },
  { value: 1, label: 'Grade 1' },
  { value: 2, label: 'Grade 2' },
  { value: 3, label: 'Grade 3' },
  { value: 4, label: 'Grade 4' },
  { value: 5, label: 'Grade 5' },
  { value: 6, label: 'Grade 6' },
  { value: 7, label: 'Grade 7' },
  { value: 8, label: 'Grade 8' },
]
const STEM_FOCUS = [
  { value: 'science', label: 'Science investigation' },
  { value: 'engineering', label: 'Engineering challenge' },
  { value: 'coding', label: 'Coding' },
  { value: 'maker', label: 'Maker project' },
]

function Topbar() {
  return (
    <div className="border-b border-ink-200 bg-white px-6 py-3 print:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link to="/" className="font-display font-bold text-lg text-ink-950">PlansK12</Link>
        <a href={CHECKOUT_URL} className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors">
          Start free trial →
        </a>
      </div>
    </div>
  )
}

export default function TryFreeLesson() {
  const [step, setStep] = useState('email') // email | form | generating | result | claimed
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(null)
  const [claimedToken, setClaimedToken] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const [subject, setSubject] = useState('PE')
  const [grade, setGrade] = useState(3)
  const [topic, setTopic] = useState('')
  const [stemFocus, setStemFocus] = useState('science')
  const [lesson, setLesson] = useState(null)

  async function handleEmail(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const res = await leadStart(email.trim())
      if (res.status === 'already_claimed') {
        setClaimedToken(res.token)
        setStep('claimed')
      } else {
        setToken(res.token)
        setStep('form')
      }
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    setBusy(true); setError(null); setStep('generating')
    try {
      const gradeBands = [grade]
      let lo
      if (subject === 'PE' || subject === 'Health') {
        lo = await generateLesson({ gradeBands, subject, topic, classSize: 28, durationMinutes: 45 })
      } else if (subject === 'Art') {
        lo = await generateArtLesson({ gradeBands, topic, classSize: 25, durationMinutes: 45 })
      } else if (subject === 'Music') {
        lo = await generateMusicLesson({ gradeBands, topic, classSize: 25, durationMinutes: 45 })
      } else if (subject === 'STEM') {
        lo = await generateStemLesson({ focusArea: stemFocus, gradeBands, topic, classSize: 25, durationMinutes: 45 })
      } else if (subject === 'Library') {
        lo = await generateLibraryLesson({ gradeBands, topic, classSize: 25, durationMinutes: 40 })
      }
      if (!lo?.title) throw new Error('The lesson came back empty — please try again.')

      const gradeLabel = GRADES.find((g) => g.value === grade)?.label
      await leadFinalize({ token, subject: lo?.subject ?? subject, topic, gradeLabel, lessonObject: lo })
      setLesson(lo)
      setStep('result')
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
      setStep('form')
    } finally {
      setBusy(false)
    }
  }

  const isStem = subject === 'STEM'

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 print:bg-white">
      <Topbar />
      <div className="mx-auto max-w-2xl px-6 py-10 print:max-w-none print:py-0">

        {/* ── Step: email ─────────────────────────────────────────────── */}
        {step === 'email' && (
          <div className="print:hidden">
            <p className="label-eyebrow text-accent-600 mb-2">Free lesson · no signup</p>
            <h1 className="text-3xl font-display font-bold text-ink-950">Try a full PlansK12 lesson, free.</h1>
            <p className="mt-3 text-ink-600">
              Enter your email, pick a subject and topic, and we'll generate one complete, standards-aligned
              lesson — no account, no credit card. We'll email you the link so you always have it.
            </p>
            <form onSubmit={handleEmail} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.org"
                  className="w-full rounded-lg border border-ink-300 bg-white px-9 py-3 text-ink-950 placeholder-ink-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary justify-center px-6 py-3 disabled:opacity-50">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <p className="mt-4 text-xs text-ink-400">One free lesson per email. We'll add you to occasional PlansK12 updates — unsubscribe anytime.</p>
          </div>
        )}

        {/* ── Step: form ──────────────────────────────────────────────── */}
        {step === 'form' && (
          <div className="print:hidden">
            <h1 className="text-2xl font-display font-bold text-ink-950">Build your free lesson</h1>
            <p className="mt-1.5 text-sm text-ink-600">Pick a subject, grade, and topic. It generates in under a minute.</p>
            <form onSubmit={handleGenerate} className="mt-6 space-y-5 rounded-xl border border-ink-200 bg-white p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-950 focus:border-accent-500 focus:outline-none">
                    {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">Grade</label>
                  <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-950 focus:border-accent-500 focus:outline-none">
                    {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              {isStem && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700">STEM focus</label>
                  <select value={stemFocus} onChange={(e) => setStemFocus(e.target.value)} className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-950 focus:border-accent-500 focus:outline-none">
                    {STEM_FOCUS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Underhand throwing, Watercolor resist, Rhythm patterns, Simple machines, Digital citizenship"
                  className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-950 placeholder-ink-400 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button type="submit" disabled={busy} className="btn-primary w-full justify-center gap-2 py-3 text-base disabled:opacity-50">
                <Sparkles size={18} /> Generate my free lesson
              </button>
            </form>
          </div>
        )}

        {/* ── Step: generating ────────────────────────────────────────── */}
        {step === 'generating' && (
          <div className="flex flex-col items-center gap-3 py-24 text-center print:hidden">
            <Loader2 size={28} className="animate-spin text-accent-500" />
            <p className="text-lg font-medium text-ink-800">Building your lesson…</p>
            <p className="text-sm text-ink-500">This usually takes 30–60 seconds. Don't close this tab.</p>
          </div>
        )}

        {/* ── Step: result ────────────────────────────────────────────── */}
        {step === 'result' && lesson && (
          <div>
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 print:hidden">
              <p className="flex items-center gap-2 font-semibold text-emerald-700">
                <Check size={18} /> Your free lesson is ready
              </p>
              <p className="mt-1 text-sm text-emerald-800/90">
                We emailed a link to <b>{email}</b> so you can always find it. This is the complete lesson — the same
                thing PlansK12 builds across 20+ modules.
              </p>
              <a href={CHECKOUT_URL} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700">
                <Sparkles size={15} /> Start your 7-day free trial
              </a>
            </div>

            <div className="rounded-xl border border-ink-200 bg-white p-6 print:border-0 print:p-0">
              <FreeLessonRenderer lesson={lesson} />
            </div>
          </div>
        )}

        {/* ── Step: already claimed ───────────────────────────────────── */}
        {step === 'claimed' && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 print:hidden">
            <h1 className="text-xl font-semibold text-amber-800">You've already used your free lesson</h1>
            <p className="mt-1.5 text-sm text-amber-800/90">
              Each email gets one free lesson. You can re-open the one you generated, or start a 7-day free trial
              to unlock unlimited lessons across every module.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {claimedToken && (
                <Link to={`/free-lesson/${claimedToken}`} className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-500/10">
                  View my free lesson
                </Link>
              )}
              <a href={CHECKOUT_URL} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700">
                Start free trial
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Print-only watermark on any exported/printed copy. */}
      <div className="trial-watermark">Free lesson from PlansK12 · Start your free trial at plansk12.com</div>
    </div>
  )
}
