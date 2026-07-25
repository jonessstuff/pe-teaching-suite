import { useState } from 'react'
import { Copy, Check, ShieldAlert, Info, Lightbulb } from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function TestPrepRenderer({ lesson }) {
  if (!lesson) return null
  const isState = lesson.path === 'state'
  const review = lesson.content_review ?? []
  const strategies = lesson.strategies ?? []
  const questions = lesson.practice_questions ?? []
  const snapshot = lesson.format_snapshot ?? []

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-steel-500/15 text-ink-50">
            Test Prep · {isState ? 'State Assessment' : 'SAT / ACT'}
          </span>
          {lesson.assessment_label && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-steel-500/20 text-ink-50">{lesson.assessment_label}</span>
          )}
          {lesson.session_format && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-200">{lesson.session_format}</span>
          )}
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.focus}
          {lesson.session_length_minutes ? ` · ${lesson.session_length_minutes} min` : ''}
        </p>
      </header>

      {/* State disclaimer — prominent, at the top for the state path */}
      {isState && lesson.state_verification_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-200"><span className="font-semibold">Verify against your state's official blueprint: </span>{lesson.state_verification_note}</p>
        </div>
      )}

      {snapshot.length > 0 && (
        <Section title="Format Snapshot" copyText={snapshot.map((s) => `- ${s}`).join('\n')}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {snapshot.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Section>
      )}

      {lesson.overview && (
        <Section title="Overview" copyText={lesson.overview}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.overview}</p>
        </Section>
      )}

      {/* Content review */}
      {review.length > 0 && (
        <Section
          title="Content Review"
          copyText={review.map((r) => `${r.concept}\n${r.mini_lesson}`).join('\n\n')}
        >
          <div className="space-y-3">
            {review.map((r, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <p className="text-sm font-semibold text-ink-100 mb-1">{r.concept}</p>
                {r.mini_lesson && <p className="text-sm text-ink-300 whitespace-pre-line">{r.mini_lesson}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Strategies */}
      {strategies.length > 0 && (
        <Section
          title="Strategies & Pacing"
          copyText={strategies.map((s) => `${s.strategy}: ${s.how_to_use_it}`).join('\n')}
        >
          <div className="space-y-1.5">
            {strategies.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-ink-300">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-steel-400" />
                <p><span className="font-medium text-ink-200">{s.strategy}: </span>{s.how_to_use_it}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Practice questions — original content */}
      {questions.length > 0 && (
        <Section
          title="Original Practice Questions"
          copyText={questions.map((q, i) => {
            const opts = (q.options ?? []).map((o, j) => `${LETTERS[j]}. ${o}`).join('\n')
            return `${i + 1}. [${q.skill}${q.difficulty ? ` · ${q.difficulty}` : ''}] ${q.question}\n${opts}${opts ? '\n' : ''}Answer: ${q.answer}\nWhy: ${q.explanation}`
          }).join('\n\n')}
        >
          <p className="mb-3 text-xs text-ink-500">Original practice — modeled on the test's skills &amp; format, not reproduced official items.</p>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-steel-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  {q.skill && <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-xs font-medium text-ink-200">{q.skill}</span>}
                  {q.difficulty && <span className="text-xs text-ink-500">{q.difficulty}</span>}
                </div>
                {q.question && <p className="text-sm text-ink-200 whitespace-pre-line">{q.question}</p>}
                {(q.options ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {q.options.map((o, j) => (
                      <li key={j} className="text-sm text-ink-300">
                        <span className="font-medium text-ink-400">{LETTERS[j]}.</span> {o}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 border-t border-ink-800 pt-2">
                  {q.answer && <p className="text-sm text-ink-200"><span className="font-medium text-steel-400">Answer: </span>{q.answer}</p>}
                  {q.explanation && <p className="mt-0.5 text-sm text-ink-400"><span className="font-medium text-ink-300">Why: </span>{q.explanation}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <BulletSection title="Test-Day Logistics & Anxiety" items={lesson.test_day_logistics} />

      {lesson.session_flow && (
        <Section title="Session Flow" copyText={lesson.session_flow}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.session_flow}</p>
        </Section>
      )}

      {lesson.next_steps && (
        <Section title="Next Steps / Homework" copyText={lesson.next_steps}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.next_steps}</p>
        </Section>
      )}

      {/* Originality note — copyright boundary */}
      {lesson.originality_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-steel-500/25 bg-steel-500/5 px-4 py-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-steel-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Original content: </span>{lesson.originality_note}</p>
        </div>
      )}

      {/* State disclaimer also repeated at the foot for print/export completeness */}
      {isState && lesson.state_verification_note && (
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-steel-400 transition-colors print:hidden"
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
