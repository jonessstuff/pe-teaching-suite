import { useState } from 'react'
import { Copy, Check, Info, ShieldCheck, Unplug } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function ElementaryTechRenderer({ lesson }) {
  if (!lesson) return null
  const bands = lesson.grade_bands ?? []
  const iste = lesson.iste_standards ?? []
  const flow = lesson.lesson_flow ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-saffron-500/15 text-ink-50">
            Elementary Technology · ISTE
            {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {lesson.content_area && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-saffron-500/20 text-ink-50">
              {lesson.content_area}
            </span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.topic}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
          {' · Self-contained weekly tech-class session'}
        </p>
      </header>

      {lesson.essential_question && (
        <div className="rounded-lg border border-saffron-500/25 bg-saffron-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Essential question</p>
          <p className="text-sm italic text-ink-200">{lesson.essential_question}</p>
        </div>
      )}

      {lesson.lesson_objective && (
        <Section title="Lesson Objective" copyText={lesson.lesson_objective}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.lesson_objective}</p>
        </Section>
      )}

      {iste.length > 0 && (
        <Section
          title="ISTE Standards for Students"
          copyText={iste.map((s) => `${s.code} ${s.name}: ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {iste.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-saffron-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">
                  {s.code}{s.name ? ` ${s.name}` : ''}
                </span>
                {s.text && <span className="ml-1">— {s.text}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Digital citizenship — woven into every lesson */}
      {lesson.digital_citizenship_focus && (
        <div className="flex items-start gap-2.5 rounded-lg border border-saffron-500/25 bg-saffron-500/5 px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-saffron-400" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Digital citizenship focus</p>
            <p className="text-sm text-ink-200">{lesson.digital_citizenship_focus}</p>
          </div>
        </div>
      )}

      <BulletSection title="Key Vocabulary" items={lesson.key_vocabulary} />
      <BulletSection title="Materials & Lab Setup" items={lesson.materials_and_setup} />

      {/* Lesson flow */}
      {flow.length > 0 && (
        <Section title="Lesson Flow" copyText={flow.map((s, i) => `${i + 1}. ${s.phase}: ${s.what_happens}`).join('\n')}>
          <ol className="space-y-2">
            {flow.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
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

      {/* Unplugged / no-device backup */}
      {lesson.unplugged_option && (
        <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3">
          <Unplug size={16} className="mt-0.5 shrink-0 text-saffron-400" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Unplugged / no-device option</p>
            <p className="text-sm text-ink-300 whitespace-pre-line">{lesson.unplugged_option}</p>
          </div>
        </div>
      )}

      <BulletSection title="Discussion Questions" items={lesson.discussion_questions} />

      {lesson.differentiation && (
        <Section title="Differentiation" copyText={lesson.differentiation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.differentiation}</p>
        </Section>
      )}

      {lesson.assessment_check && (
        <Section title="Formative Check (whole-class)" copyText={lesson.assessment_check}>
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
                <span className="rounded bg-saffron-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">— {s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Teacher note — scope / self-contained framing */}
      {lesson.teacher_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Note: </span>{lesson.teacher_note}</p>
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
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="lesson-section-title text-ink-400">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-saffron-400 transition-colors print:hidden"
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
