import { useState } from 'react'
import { Copy, Check, Info, Users2, UserRound } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function MathSpecialistRenderer({ lesson }) {
  if (!lesson) return null
  const gradeBands = lesson.grade_bands ?? []
  const cra = lesson.cra_sequence ?? {}
  const proc = lesson.process_standards ?? []

  const craText = [
    `Concrete: ${cra.concrete ?? ''}`,
    `Representational: ${cra.representational ?? ''}`,
    `Abstract: ${cra.abstract ?? ''}`,
  ].join('\n\n')
  const procText = proc.map((p) => `${p.standard}: ${p.how_addressed}`).join('\n\n')

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <span className="label-eyebrow rounded px-2 py-0.5 bg-lime-500/15 text-ink-50">
          Math Specialists · NCTM
          {gradeBands.length > 0
            ? ` · Grade${gradeBands.length > 1 ? 's' : ''} ${gradeBands.map(formatGrade).join('/')}`
            : ''}
        </span>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.content_standard, lesson.focus].filter(Boolean).join(' · ')}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
        </p>
      </header>

      {lesson.learning_objective && (
        <Section title="Learning Objective" copyText={lesson.learning_objective}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.learning_objective}</p>
        </Section>
      )}

      <BulletSection title="NCTM Teaching Practices Enacted" items={lesson.teaching_practices_used} />

      {lesson.number_talk && (
        <Section title="Number Talk (warm-up)" copyText={lesson.number_talk}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.number_talk}</p>
        </Section>
      )}

      {/* CRA — the core */}
      {(cra.concrete || cra.representational || cra.abstract) && (
        <Section title="Concrete → Representational → Abstract" copyText={craText}>
          <div className="space-y-2">
            <CraPhase n="1" label="Concrete" text={cra.concrete} />
            <CraPhase n="2" label="Representational" text={cra.representational} />
            <CraPhase n="3" label="Abstract" text={cra.abstract} />
          </div>
        </Section>
      )}

      {proc.length > 0 && (
        <Section title="Process Standards Built" copyText={procText}>
          <div className="space-y-2">
            {proc.map((p, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <p className="text-xs font-semibold text-lime-400 mb-1">{p.standard}</p>
                <p className="text-sm text-ink-300">{p.how_addressed}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Dual role */}
      {lesson.whole_class_differentiation && (
        <Section title="Whole-Class Differentiation (co-teaching)" copyText={lesson.whole_class_differentiation}>
          <div className="flex items-start gap-2.5 rounded-lg border border-lime-500/20 bg-lime-500/5 px-4 py-3">
            <Users2 size={15} className="mt-0.5 shrink-0 text-lime-400" />
            <p className="text-ink-300 whitespace-pre-line">{lesson.whole_class_differentiation}</p>
          </div>
        </Section>
      )}

      {lesson.small_group_intervention && (
        <Section title="Small-Group Intervention (pull-out)" copyText={lesson.small_group_intervention}>
          <div className="flex items-start gap-2.5 rounded-lg border border-lime-500/20 bg-lime-500/5 px-4 py-3">
            <UserRound size={15} className="mt-0.5 shrink-0 text-lime-400" />
            <p className="text-ink-300 whitespace-pre-line">{lesson.small_group_intervention}</p>
          </div>
        </Section>
      )}

      <BulletSection title="Common Misconceptions" items={lesson.common_misconceptions} />

      {lesson.formative_assessment && (
        <Section title="Formative Assessment (evidence of thinking)" copyText={lesson.formative_assessment}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.formative_assessment}</p>
        </Section>
      )}

      <BulletSection title="Materials & Manipulatives" items={lesson.materials} />

      {/* Standards */}
      {(lesson.standards_alignment ?? []).length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={(lesson.standards_alignment ?? []).map((s) => `[${s.framework}] ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {(lesson.standards_alignment ?? []).map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-lime-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">— {s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
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
function CraPhase({ n, label, text }) {
  if (!text) return null
  return (
    <div className="rounded-lg bg-ink-900 px-4 py-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-500/20 text-xs font-semibold text-ink-50">{n}</span>
        <p className="text-sm font-semibold text-ink-100">{label}</p>
      </div>
      <p className="text-sm text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}

function BulletSection({ title, items }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section title={title} copyText={list.map((i) => `- ${i}`).join('\n')}>
      <ul className="list-disc list-inside space-y-1 text-ink-300">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
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
      // Clipboard API unavailable; fail silently
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-lime-400 transition-colors print:hidden"
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
