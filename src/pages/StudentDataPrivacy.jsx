import { Link } from 'react-router-dom'
import { ArrowLeft, Database, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'

const PRACTICES = [
  {
    icon: LockKeyhole,
    title: 'Rosters are separated by teacher account',
    text: 'PlansK12 uses account-level database rules so signed-in teachers work with their own classes, rosters, lessons, participation records, run history, and goals.',
  },
  {
    icon: EyeOff,
    title: 'Student pages are excluded from product analytics',
    text: 'Automatic page capture, heatmaps, session replay, and input capture are disabled. The Classes & Rosters area does not send product-analytics events.',
  },
  {
    icon: Sparkles,
    title: 'Supported AI tools receive an alias instead of the display name',
    text: 'When a supported documentation tool needs a student display name, PlansK12 replaces it with an alias before generation and restores the teacher-facing label afterward.',
  },
  {
    icon: Database,
    title: 'Use the minimum information you need',
    text: 'PlansK12 is designed for display names or codes and brief instructional notes—not full student records, medical histories, diagnoses, addresses, birth dates, or identification numbers.',
  },
]

export default function StudentDataPrivacy() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> Back to PlansK12</Link>

      <header className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-white to-blue-500/5 p-6 sm:p-9 dark:via-ink-900 dark:to-blue-500/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white"><ShieldCheck size={25} /></span>
        <p className="label-eyebrow mt-5 text-emerald-700 dark:text-emerald-300">Trust center</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-50 sm:text-4xl">Student Data &amp; Privacy</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-400">A plain-language explanation of how the current product is designed to handle teacher and student information. This page describes product practices; it is not a certification or a substitute for your school or district&rsquo;s approval process.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-ink-100">What PlansK12 currently does</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRACTICES.map(({ icon: Icon, title, text }) => <div key={title} className="card p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><Icon size={20} /></span><h3 className="mt-4 font-semibold text-ink-100">{title}</h3><p className="mt-2 text-sm leading-relaxed text-ink-500">{text}</p></div>)}
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <div><h2 className="text-xl font-semibold text-ink-100">Should I enter student names?</h2><p className="mt-2 text-sm leading-relaxed text-ink-400">Use the least identifying label that still works for you. A first name plus last initial, initials, or a class code such as <strong className="text-ink-200">4X-03</strong> is preferable to a full legal name.</p></div>
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4"><p className="font-semibold text-amber-600 dark:text-amber-300">Keep sensitive details out of free-text notes</p><p className="mt-1 text-sm leading-relaxed text-ink-400">Do not paste IEPs, evaluations, medical information, diagnoses, family information, student IDs, or other protected records. Automatic aliasing can protect a known display-name field, but it cannot reliably detect every name or identifying detail typed into an open note.</p></div>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-xl font-semibold text-ink-100">School and district use</h2>
        <p className="text-sm leading-relaxed text-ink-400">Teachers should follow their employer&rsquo;s approved-technology and student-data rules. Schools or districts that need a security review, data-processing agreement, retention details, or deletion assistance can contact PlansK12 before entering student information.</p>
        <a href="mailto:hello@plansk12.com?subject=PlansK12%20student%20data%20question" className="btn-primary mt-2 inline-flex">Ask a privacy or school-review question</a>
      </section>

      <p className="text-xs leading-relaxed text-ink-600">Last updated August 29, 2026. PlansK12 will update this page as its data practices and school offerings change.</p>
    </div>
  )
}
