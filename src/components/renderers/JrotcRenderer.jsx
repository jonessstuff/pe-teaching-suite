import { useState } from 'react'
import { Copy, Check, Info, Award, ShieldCheck } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function JrotcRenderer({ lesson }) {
  if (!lesson) return null
  const bands = lesson.grade_bands ?? []
  const letStandards = lesson.let_standards ?? []
  const flow = lesson.lesson_flow ?? []

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-denim-500/15 text-ink-50 flex items-center gap-1">
            <Award size={12} /> JROTC · LET
            {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {lesson.let_level && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-denim-500/20 text-ink-50">
              {lesson.let_level}
            </span>
          )}
          {lesson.content_area && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-300">
              {lesson.content_area}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.topic}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
          {' · Citizenship & leadership'}
        </p>
      </header>

      {lesson.essential_question && (
        <div className="rounded-lg border border-denim-500/25 bg-denim-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Essential question</p>
          <p className="text-sm italic text-ink-200">{lesson.essential_question}</p>
        </div>
      )}

      {lesson.lesson_objective && (
        <Section title="Lesson Objective" copyText={lesson.lesson_objective}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.lesson_objective}</p>
        </Section>
      )}

      {letStandards.length > 0 && (
        <Section title="LET Competencies" copyText={letStandards.map((s) => `${s.code}: ${s.text}`).join('\n')}>
          <ul className="space-y-1.5 text-ink-300">
            {letStandards.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-denim-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.code}</span>
                <span className="ml-1">{s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Leadership & citizenship throughline */}
      {lesson.leadership_citizenship_focus && (
        <div className="flex items-start gap-2.5 rounded-lg border border-denim-500/25 bg-denim-500/5 px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-denim-400" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Leadership &amp; citizenship focus</p>
            <p className="text-sm text-ink-200">{lesson.leadership_citizenship_focus}</p>
          </div>
        </div>
      )}

      <BulletSection title="Key Terms" items={lesson.key_terms} />
      <BulletSection title="Materials" items={lesson.materials} />

      {/* Lesson flow */}
      {flow.length > 0 && (
        <Section title="Lesson Flow" copyText={flow.map((s, i) => `${i + 1}. ${s.phase}: ${s.what_happens}`).join('\n')}>
          <ol className="space-y-2">
            {flow.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-denim-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{s.phase}</p>
                </div>
                <p className="text-sm text-ink-300">{s.what_happens}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {lesson.core_activity && (
        <Section title="Core Activity" copyText={lesson.core_activity}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.core_activity}</p>
        </Section>
      )}

      {/* Cadet leadership opportunity */}
      {lesson.cadet_leadership_opportunity && (
        <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3">
          <Award size={16} className="mt-0.5 shrink-0 text-denim-400" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Cadet leadership opportunity</p>
            <p className="text-sm text-ink-300 whitespace-pre-line">{lesson.cadet_leadership_opportunity}</p>
          </div>
        </div>
      )}

      <BulletSection title="Reflection Questions" items={lesson.reflection_questions} />

      {lesson.differentiation && (
        <Section title="Differentiation" copyText={lesson.differentiation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.differentiation}</p>
        </Section>
      )}

      {lesson.assessment_check && (
        <Section title="Formative Check" copyText={lesson.assessment_check}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.assessment_check}</p>
        </Section>
      )}

      {/* Standards */}
      {(lesson.standards_alignment ?? []).length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={(lesson.standards_alignment ?? []).map((s) => `[${s.framework}] ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {(lesson.standards_alignment ?? []).map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-denim-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">— {s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Scope note — citizenship/leadership only */}
      {lesson.scope_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-amber-400" />
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
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-denim-400 transition-colors print:hidden"
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
