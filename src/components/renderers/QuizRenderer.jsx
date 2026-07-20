import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D']

function gradeLabel(grade) {
  return grade === 0 ? 'K' : String(grade)
}

function QuestionTypeBadge({ type }) {
  const labels = {
    multiple_choice: 'Multiple choice',
    true_false: 'True / False',
    short_answer: 'Short answer',
  }
  return (
    <span className="text-xs font-normal text-ink-500 ml-2">
      ({labels[type] ?? type})
    </span>
  )
}

export default function QuizRenderer({ quiz_questions }) {
  const [showAnswers, setShowAnswers] = useState(false)

  const bands = Object.values(quiz_questions ?? {})
    .sort((a, b) => (a.grade === 0 ? -1 : b.grade === 0 ? 1 : a.grade - b.grade))

  if (bands.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* One card per grade band — each starts on its own printed page */}
      {bands.map((band, idx) => (
        <section
          key={band.grade}
          className="card p-8 space-y-6"
          style={idx > 0 ? { breakBefore: 'page' } : undefined}
        >
          <div className="border-b border-ink-900 pb-4">
            <h2 className="text-xl font-semibold text-ink-50">
              Grade {gradeLabel(band.grade)} Quiz
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {band.questions?.length ?? 0} questions
            </p>
          </div>

          <ol className="space-y-6">
            {(band.questions ?? []).map((q, qi) => (
              <li key={qi}>
                <p className="text-sm font-medium text-ink-100 leading-snug">
                  {qi + 1}.&nbsp;{q.question}
                  <QuestionTypeBadge type={q.type} />
                </p>

                {q.type === 'multiple_choice' && (
                  <ul className="mt-2 space-y-1.5 pl-5">
                    {(q.options ?? []).map((opt, oi) => (
                      <li key={oi} className="text-sm text-ink-300">
                        <span className="font-medium text-ink-400">{LETTERS[oi]}.</span> {opt}
                      </li>
                    ))}
                  </ul>
                )}

                {q.type === 'true_false' && (
                  <div className="mt-2 flex gap-4 pl-5">
                    {['True', 'False'].map((label) => (
                      <span key={label} className="text-sm text-ink-400">
                        ○ {label}
                      </span>
                    ))}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="mt-2 ml-5 h-14 rounded-lg border border-ink-800 border-dashed" />
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}

      {/* Answer key — collapsible, hidden on print */}
      <div className="card p-8 space-y-4 no-print">
        <button
          onClick={() => setShowAnswers((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="label-eyebrow text-ink-400">Answer Key</h2>
          {showAnswers
            ? <ChevronUp size={16} className="text-ink-500" />
            : <ChevronDown size={16} className="text-ink-500" />}
        </button>

        {showAnswers && (
          <div className="space-y-6 border-t border-ink-900 pt-4">
            {bands.map((band) => (
              <div key={band.grade} className="space-y-2">
                <p className="text-sm font-semibold text-ink-200">
                  Grade {gradeLabel(band.grade)}
                </p>
                <ol className="space-y-2">
                  {(band.questions ?? []).map((q, qi) => (
                    <li key={qi} className="flex gap-2 text-sm">
                      <span className="shrink-0 font-medium text-ink-400 w-5">{qi + 1}.</span>
                      <span>
                        {q.type === 'multiple_choice' ? (
                          <>
                            <span className="font-semibold text-accent-400">{q.answer}</span>
                            {q.options?.[LETTERS.indexOf(q.answer)] && (
                              <span className="text-ink-400">
                                {' '}— {q.options[LETTERS.indexOf(q.answer)]}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-ink-300">
                            {q.answer}
                            {q.type === 'short_answer' && (
                              <span className="ml-1 text-xs text-ink-500">(model answer)</span>
                            )}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
