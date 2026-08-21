import { useState } from 'react'
import { Copy, Check, ShieldAlert, Info, Lightbulb, Clock, Eye, EyeOff, FileText, GraduationCap } from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function TestPrepRenderer({ lesson }) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [viewMode, setViewMode] = useState('session') // 'session' | 'quiz'
  if (!lesson) return null
  const isState = lesson.path === 'state'
  const review = lesson.content_review ?? []
  const strategies = lesson.strategies ?? []
  const questions = lesson.practice_questions ?? []
  const snapshot = lesson.format_snapshot ?? []

  // View switcher — never prints. Lets a teacher flip between the full tutoring
  // session and a clean, student-facing quiz-only sheet.
  const viewToggle = (
    <div className="flex rounded-lg bg-ink-900 p-1 w-fit print:hidden">
      {[
        { v: 'session', l: 'Full session', icon: FileText },
        { v: 'quiz', l: 'Quiz only (student)', icon: GraduationCap },
      ].map(({ v, l, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => setViewMode(v)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            viewMode === v ? 'bg-ink-700 text-ink-50 shadow-sm' : 'text-ink-400 hover:text-ink-200'
          }`}
        >
          <Icon size={14} />
          {l}
        </button>
      ))}
    </div>
  )

  // Shared quiz + answer-key blocks (used by both views).
  const quizBlock = questions.length > 0 && (
    <div className="rounded-xl border border-steel-500/30 bg-steel-500/5 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-steel-500/20 pb-3">
        <div>
          <h3 className="text-lg font-display font-semibold text-ink-50">{lesson.quiz_header || 'Practice Quiz'}</h3>
          <p className="mt-0.5 text-xs text-ink-400">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · original practice
          </p>
        </div>
        {lesson.time_limit_minutes ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-steel-500/15 px-3 py-1.5 text-sm text-ink-100 print:border print:border-ink-300">
            <Clock size={14} className="text-steel-400" />
            <span className="font-medium">Suggested time: {lesson.time_limit_minutes} min</span>
          </div>
        ) : null}
      </div>
      {lesson.pacing_note && <p className="-mt-1 text-xs text-ink-500">{lesson.pacing_note}</p>}

      <ol className="space-y-5">
        {questions.map((q, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-0.5 font-semibold text-ink-200">{i + 1}.</span>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink-100 whitespace-pre-line">{q.question}</p>
                {q.skill && (
                  <span className="hidden sm:inline shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-400 print:hidden">{q.skill}</span>
                )}
              </div>
              {(q.options ?? []).length > 0 ? (
                <ul className="space-y-1">
                  {q.options.map((o, j) => (
                    <li key={j} className="text-sm text-ink-300">
                      <span className="font-medium text-ink-400">{LETTERS[j]})</span> {o}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-ink-500">Student-produced response — write your answer.</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )

  const answerKeyBlock = questions.length > 0 && (
    <div className={`rounded-xl border border-ink-800 bg-ink-900/40 p-5 ${showAnswers ? '' : 'print:hidden'}`}>
      <div className="flex items-center justify-between">
        <h3 className="lesson-section-title text-ink-200">Answer Key</h3>
        <button
          type="button"
          onClick={() => setShowAnswers((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:border-steel-400/50 print:hidden"
        >
          {showAnswers ? <EyeOff size={13} /> : <Eye size={13} />}
          {showAnswers ? 'Hide answers' : 'Show answers'}
        </button>
      </div>
      {showAnswers ? (
        <ol className="mt-3 space-y-2.5">
          {questions.map((q, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-steel-400">{i + 1}. {q.answer}</span>
              {q.difficulty && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-600">{q.difficulty}</span>}
              {q.explanation && <p className="mt-0.5 text-ink-400">{q.explanation}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-xs text-ink-500">
          Hidden for a clean student-facing copy. Click <span className="font-medium text-ink-300">Show answers</span> to reveal the key and explanations (it prints only when shown).
        </p>
      )}
    </div>
  )

  // ── QUIZ-ONLY (student) VIEW — just the header + timed numbered questions +
  //    the answer-key toggle; all tutor-facing scaffolding stripped. ──
  if (viewMode === 'quiz') {
    return (
      <div className="card lesson-doc p-8 space-y-4">
        {viewToggle}
        <header className="space-y-2 border-b border-ink-900 pb-3">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-steel-500/15 text-ink-50">
            {lesson.assessment_label || 'Test Prep'} · Practice Quiz
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-1 pt-1 text-sm text-ink-400">
            <span>Name: <span className="text-ink-700">____________________________</span></span>
            <span>Date: <span className="text-ink-700">________________</span></span>
          </div>
        </header>
        <section className="space-y-3">
          {quizBlock}
          {answerKeyBlock}
        </section>
      </div>
    )
  }

  // ── FULL TUTORING-SESSION VIEW ──
  return (
    <div className="card lesson-doc p-8 space-y-6">
      {viewToggle}

      {/* Header */}
      <header className="lesson-header-band space-y-2">
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
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.focus}
          {lesson.session_length_minutes ? ` · ${lesson.session_length_minutes} min session` : ''}
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

      {/* Practice quiz + answer key */}
      {questions.length > 0 && (
        <section className="space-y-3">
          {quizBlock}
          {answerKeyBlock}
        </section>
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
    <section className="space-y-3">
      <div className="flex items-center justify-between lesson-section-rule">
        <h3 className="lesson-section-title text-ink-200">{title}</h3>
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
      <div className="lesson-body text-ink-200">{children}</div>
    </section>
  )
}
