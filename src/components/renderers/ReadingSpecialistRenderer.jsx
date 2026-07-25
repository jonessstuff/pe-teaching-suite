import { useState } from 'react'
import { Copy, Check, Info, Search } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function ReadingSpecialistRenderer({ lesson }) {
  if (!lesson) return null
  const gradeBands = lesson.grade_bands ?? []
  const seq = lesson.instructional_sequence ?? []
  const dw = lesson.dyslexia_watch ?? null

  const seqText = seq
    .map((s, i) => `${i + 1}. ${s.step}${s.duration ? ` (${s.duration})` : ''}\nPurpose: ${s.purpose}\nTeacher: ${s.teacher_does}\nStudents: ${s.students_do}`)
    .join('\n\n')

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <span className="label-eyebrow rounded px-2 py-0.5 bg-sky-500/15 text-ink-50">
          Reading Specialists · Structured Literacy
          {gradeBands.length > 0
            ? ` · Grade${gradeBands.length > 1 ? 's' : ''} ${gradeBands.map(formatGrade).join('/')}`
            : ''}
        </span>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.skill_area, lesson.focus].filter(Boolean).join(' · ')}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
          {lesson.group_size_label ? ` · ${lesson.group_size_label}` : ''}
        </p>
      </header>

      {lesson.learning_objective && (
        <Section title="Learning Objective" copyText={lesson.learning_objective}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.learning_objective}</p>
        </Section>
      )}

      <BulletSection title="Structured Literacy Principles in This Lesson" items={lesson.structured_literacy_principles} />

      {/* Instructional sequence — the core */}
      {seq.length > 0 && (
        <Section title="Explicit, Systematic Instructional Sequence" copyText={seqText}>
          <ol className="space-y-3">
            {seq.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-ink-50">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-ink-100">{s.step}</p>
                  {s.duration && <span className="ml-auto text-xs text-ink-500">{s.duration}</span>}
                </div>
                {s.purpose && <p className="text-xs text-ink-500 mb-1.5 italic">{s.purpose}</p>}
                {s.teacher_does && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">Teacher: </span>{s.teacher_does}</p>}
                {s.students_do && <p className="mt-1 text-sm text-ink-300"><span className="font-medium text-ink-200">Students: </span>{s.students_do}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {lesson.explicit_modeling_example && (
        <Section title="Explicit Modeling (“I do”)" copyText={lesson.explicit_modeling_example}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.explicit_modeling_example}</p>
        </Section>
      )}

      {lesson.error_correction && (
        <Section title="Error Correction" copyText={lesson.error_correction}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.error_correction}</p>
        </Section>
      )}

      {lesson.cumulative_review && (
        <Section title="Cumulative Review" copyText={lesson.cumulative_review}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.cumulative_review}</p>
        </Section>
      )}

      <BulletSection title="Materials" items={lesson.materials} />

      {lesson.progress_monitoring && (
        <Section title="Progress Monitoring" copyText={lesson.progress_monitoring}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.progress_monitoring}</p>
        </Section>
      )}

      {lesson.differentiation && (
        <Section title="Differentiation" copyText={lesson.differentiation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.differentiation}</p>
        </Section>
      )}

      {/* Dyslexia watch */}
      {dw && (
        <Section
          title="Dyslexia Watch — Instructional Support, Not Diagnosis"
          copyText={[
            dw.observed_pattern ? `Observed pattern: ${dw.observed_pattern}` : '',
            `Consistent with common indicators: ${dw.consistent_with_indicators ? 'Yes' : 'No'}`,
            (dw.indicators_noted ?? []).length ? `Indicators: ${(dw.indicators_noted ?? []).join('; ')}` : '',
            dw.recommended_next_step ? `Next step: ${dw.recommended_next_step}` : '',
          ].filter(Boolean).join('\n')}
        >
          <div className={`rounded-lg border px-4 py-3 ${dw.consistent_with_indicators ? 'border-sky-500/30 bg-sky-500/5' : 'border-ink-800 bg-ink-900/50'}`}>
            <div className="mb-2 flex items-center gap-2">
              <Search size={15} className="text-sky-400" />
              <span className="text-sm font-semibold text-ink-100">
                {dw.consistent_with_indicators
                  ? 'Pattern is consistent with common indicators worth exploring'
                  : 'No dyslexia-consistent pattern flagged from what was described'}
              </span>
            </div>
            {dw.observed_pattern && (
              <p className="text-sm text-ink-400 mb-2"><span className="font-medium text-ink-300">Observed: </span>{dw.observed_pattern}</p>
            )}
            {(dw.indicators_noted ?? []).length > 0 && (
              <ul className="mb-2 list-disc list-inside space-y-1 text-sm text-ink-300">
                {(dw.indicators_noted ?? []).map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            )}
            {dw.recommended_next_step && (
              <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">Recommended next step: </span>{dw.recommended_next_step}</p>
            )}
          </div>
        </Section>
      )}

      {/* Standards */}
      {(lesson.standards_alignment ?? []).length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={(lesson.standards_alignment ?? []).map((s) => `[${s.framework}${s.domain ? ` · ${s.domain}` : ''}] ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {(lesson.standards_alignment ?? []).map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                {s.domain && <span className="ml-1 text-xs text-ink-500">{s.domain}</span>}
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

// ─── Shared helpers ───────────────────────────────────────────────────────────
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
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-sky-400 transition-colors print:hidden"
            title="Copy this section to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="text-sm text-ink-200 leading-relaxed">{children}</div>
    </section>
  )
}
