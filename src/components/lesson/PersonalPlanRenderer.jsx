import { CheckCircle2, CircleAlert, CircleMinus, CircleX, ClipboardCheck } from 'lucide-react'
import { displayLines, inspectLessonFormat } from '../../lib/personalPlanContent'

const STATUS = {
  evident: { label: 'Evident', Icon: CheckCircle2, className: 'text-emerald-500' },
  partial: { label: 'Partial', Icon: CircleAlert, className: 'text-amber-500' },
  not_yet: { label: 'Not yet', Icon: CircleX, className: 'text-red-400' },
  na: { label: 'N/A', Icon: CircleMinus, className: 'text-ink-500' },
}

function lessonTitle(lo) {
  return lo?.title || lo?.lesson_title || lo?.session_title || lo?.activity_title || 'Lesson plan'
}

export function RequirementCheck({ lesson, format, formatValues, compact = false }) {
  const check = inspectLessonFormat(lesson, format, formatValues)
  return <section className={`rounded-2xl border border-teal-500/25 bg-teal-500/5 ${compact ? 'p-4' : 'p-5'}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="label-eyebrow text-teal-400">Requirement check</p><h3 className="mt-1 text-lg font-black text-ink-50">{check.overall} planning evidence</h3></div>
      <span className="rounded-full bg-teal-500/15 px-3 py-1 text-xs font-bold text-teal-400">{check.met} of {check.required} required sections ready</span>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {check.rows.filter((row) => row.required).map((row) => {
        const status = STATUS[row.status]
        return <div key={row.key} className="flex items-center justify-between gap-2 rounded-lg border border-ink-800 bg-ink-950/35 px-3 py-2"><span className="text-xs font-semibold text-ink-300">{row.label}</span><span className={`flex items-center gap-1 text-xs font-bold ${status.className}`}><status.Icon size={13} />{status.label}</span></div>
      })}
    </div>
    {!compact && <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-emerald-500/8 p-3"><p className="text-xs font-bold text-emerald-400">One strength</p><p className="mt-1 text-sm text-ink-300">{check.strength}</p></div><div className="rounded-xl bg-amber-500/8 p-3"><p className="text-xs font-bold text-amber-400">One actionable next step</p><p className="mt-1 text-sm text-ink-300">{check.nextStep}</p></div></div>}
  </section>
}

export default function PersonalPlanRenderer({ lesson: lo, format, formatValues }) {
  if (!lo || !format) return null
  const check = inspectLessonFormat(lo, format, formatValues)
  const meta = [lo.subject, lo.grade_label || lo.grade_band, lo.duration_minutes ? `${lo.duration_minutes} min` : lo.duration].filter(Boolean).join(' · ')
  return <article className="card overflow-hidden bg-white text-slate-900 print:border-0 print:shadow-none">
    <header className="border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50 px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">{format.name}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{lessonTitle(lo)}</h2>{meta && <p className="mt-1 text-sm text-slate-500">{meta}</p>}</div><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm"><ClipboardCheck size={14} />{format.detail_level[0].toUpperCase() + format.detail_level.slice(1)} view</span></div>
    </header>
    <div className="divide-y divide-slate-200">
      {check.rows.map((row) => {
        const lines = displayLines(row.content, format.detail_level)
        return <section key={row.key} className="grid gap-2 px-5 py-4 sm:grid-cols-[190px_1fr] sm:px-7 print:break-inside-avoid">
          <div><h3 className="text-sm font-black text-slate-900">{row.label}{row.required && <span className="ml-1 text-teal-700">*</span>}</h3></div>
          <div>{lines.length ? <ul className="space-y-1.5">{lines.map((line, index) => <li key={index} className="text-sm leading-6 text-slate-700">{line}</li>)}</ul> : row.key === 'mtss_tier_2' ? <p className="text-sm italic text-slate-500">N/A — no Tier 2 need is identified for this lesson.</p> : <p className="text-sm italic text-amber-700">Not yet visible in this lesson.</p>}</div>
        </section>
      })}
    </div>
    {format.requirement_notes && <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7"><p className="text-xs font-black uppercase tracking-wide text-slate-500">My school reminders</p><p className="mt-1 text-sm text-slate-700">{format.requirement_notes}</p></footer>}
  </article>
}
