import { useState } from 'react'
import { Copy, Check, Info, ShieldAlert, Users } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function SstActivityRenderer({ lesson }) {
  if (!lesson) return null
  const bands = lesson.grade_bands ?? []
  const act = lesson.core_activity ?? {}

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-plum-500/15 text-ink-50">
            Student Support Team
            {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {lesson.role && (
            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-plum-500/20 text-ink-50">
              <Users size={11} /> {lesson.role}
            </span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.skill_area, lesson.focus].filter(Boolean).join(' · ')}
          {lesson.session_length_minutes ? ` · ${lesson.session_length_minutes} min` : ''}
          {lesson.group_size_label ? ` · ${lesson.group_size_label}` : ''}
        </p>
      </header>

      {lesson.skill_objective && (
        <Section title="Skill Objective" copyText={lesson.skill_objective}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.skill_objective}</p>
        </Section>
      )}

      {lesson.opening && (
        <Section title="Opening / Check-In" copyText={lesson.opening}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.opening}</p>
        </Section>
      )}

      <BulletSection title="Group Agreements" items={lesson.group_agreements} />

      {/* Core activity */}
      {(act.name || act.how_to_run) && (
        <Section
          title="Core Activity"
          copyText={[act.name, act.how_to_run ? `How: ${act.how_to_run}` : '', act.why_it_works ? `Why: ${act.why_it_works}` : ''].filter(Boolean).join('\n\n')}
        >
          <div className="rounded-lg bg-ink-900 px-4 py-3">
            {act.name && <p className="text-sm font-semibold text-ink-300 mb-1">{act.name}</p>}
            {act.how_to_run && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">How to run: </span>{act.how_to_run}</p>}
            {act.why_it_works && <p className="mt-1 text-sm text-ink-400"><span className="font-medium text-ink-300">Why it works: </span>{act.why_it_works}</p>}
          </div>
        </Section>
      )}

      {lesson.practice_and_processing && (
        <Section title="Practice & Processing" copyText={lesson.practice_and_processing}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.practice_and_processing}</p>
        </Section>
      )}

      <BulletSection title="Discussion Questions" items={lesson.discussion_questions} />

      {lesson.closing && (
        <Section title="Closing / Takeaway" copyText={lesson.closing}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.closing}</p>
        </Section>
      )}

      {/* Facilitation tips — the core value of the module */}
      {(lesson.facilitation_tips ?? []).length > 0 && (
        <Section title="Facilitation Tips (running the group)" copyText={(lesson.facilitation_tips ?? []).map((t) => `- ${t}`).join('\n')}>
          <div className="rounded-lg border border-plum-500/25 bg-plum-500/5 px-4 py-3">
            <ul className="list-disc list-inside space-y-1 text-sm text-ink-300">
              {(lesson.facilitation_tips ?? []).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </Section>
      )}

      <BulletSection title="Materials" items={lesson.materials} />

      {lesson.differentiation && (
        <Section title="Differentiation" copyText={lesson.differentiation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.differentiation}</p>
        </Section>
      )}

      {lesson.generalization && (
        <Section title="Generalization / Carryover" copyText={lesson.generalization}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.generalization}</p>
        </Section>
      )}

      {/* Standards — role-layered */}
      {(lesson.standards_alignment ?? []).length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={(lesson.standards_alignment ?? []).map((s) => `[${s.framework}] ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {(lesson.standards_alignment ?? []).map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-plum-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">— {s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Scope boundaries */}
      {lesson.role_scope_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Role scope: </span>{lesson.role_scope_note}</p>
        </div>
      )}

      {lesson.scope_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Scope: </span>{lesson.scope_note}</p>
        </div>
      )}

      {lesson.state_verification_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 print:border-ink-300">
          <Info size={15} className="mt-0.5 shrink-0 text-ink-500" />
          <p className="text-xs text-ink-400">{lesson.state_verification_note}</p>
        </div>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function BulletSection({ title, items }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section title={title} copyText={list.map((i) => `- ${i}`).join('\n')}>
      <ul className="list-disc list-inside space-y-1 text-ink-300">
        {list.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </Section>
  )
}

function Section({ title, copyText, children }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable; ignore.
    }
  }
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between lesson-section-rule">
        <h3 className="lesson-section-title text-ink-200">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-plum-400 transition-colors print:hidden"
            title="Copy this section to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="lesson-body text-ink-200">{children}</div>
    </section>
  )
}
