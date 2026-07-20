/**
 * Observation/Evaluation Prep renderer.
 *
 * Produces a concise one-page summary for a principal or evaluator
 * walkthrough. Designed to be professional and print-ready — the toolbar
 * buttons hide on print, and the layout is clean enough to hand off.
 *
 * Sections:
 *   - Lesson header (title, grade, subject, duration, location)
 *   - Standards (pulled verbatim from lesson data, not regenerated)
 *   - Lesson overview (AI-synthesized 2-3 sentence arc)
 *   - Differentiation & Accommodations in Action (2-3 evaluator-friendly bullets)
 *   - Look For (2-3 specific observable indicators)
 *
 * @param {{ lesson: import("../../types/lessonObject").LessonObject }} props
 */

import { useState } from 'react'
import { ClipboardCheck, Copy, Check, Printer } from 'lucide-react'
import { gradeLabel, gradeBandsLabel } from '../../types/lessonObject'
import { useTrial } from '../../context/TrialContext'

export default function ObservationSummaryRenderer({ lesson }) {
  const { requestExport } = useTrial()
  if (!lesson) return null

  const overview = lesson.obs_overview ?? ''
  const differentiation = lesson.obs_differentiation ?? []
  const lookFor = lesson.obs_look_for ?? []
  const standards = lesson.standards ?? []
  const grades = gradeBandsLabel(lesson.grade_bands)

  function buildPlainText() {
    const lines = []

    lines.push(`OBSERVATION/EVALUATION PREP`)
    lines.push(`${lesson.title ?? ''}`)
    if (lesson.unit) lines.push(`Unit: ${lesson.unit}`)
    lines.push(`Grade ${grades} · ${lesson.subject ?? ''} · ${lesson.duration_minutes ?? 45} min`)
    if (lesson.location) lines.push(`Location: ${lesson.location}`)
    lines.push('')

    if (standards.length > 0) {
      lines.push('STANDARDS')
      standards.forEach(({ grade, code, text }) =>
        lines.push(`Grade ${gradeLabel(grade)}: ${code} — ${text}`)
      )
      lines.push('')
    }

    if (overview) {
      lines.push('LESSON OVERVIEW')
      lines.push(overview)
      lines.push('')
    }

    if (differentiation.length > 0) {
      lines.push('DIFFERENTIATION & ACCOMMODATIONS IN ACTION')
      differentiation.forEach((item) => lines.push(`• ${item}`))
      lines.push('')
    }

    if (lookFor.length > 0) {
      lines.push('LOOK FOR')
      lookFor.forEach((item) => lines.push(`• ${item}`))
    }

    return lines.join('\n').trim()
  }

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6 print:shadow-none print:border-0">
      {/* Header */}
      <header className="space-y-4 border-b border-ink-900 pb-6 print:border-ink-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 print:bg-violet-100">
              <ClipboardCheck size={18} className="text-violet-400 print:text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 print:text-violet-600">
                Observation / Evaluation Prep
              </p>
              <p className="text-xs text-ink-500 mt-0.5 print:hidden">
                For principal or evaluator walkthrough reference.
              </p>
            </div>
          </div>

          {/* Print + Copy actions — hidden in print */}
          <div className="flex items-center gap-2 print:hidden">
            <CopyButton buildPlainText={buildPlainText} />
            <button
              type="button"
              onClick={async () => { if (await requestExport()) window.print() }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 bg-ink-900 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-ink-700 hover:text-ink-100"
            >
              <Printer size={13} />
              Print
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-display font-semibold text-ink-50 print:text-ink-50">
            {lesson.title}
          </h2>
          {lesson.unit && (
            <p className="mt-0.5 text-sm text-ink-400 print:text-ink-400">{lesson.unit}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-400">
          {grades && <span>Grade {grades}</span>}
          {lesson.subject && <span>{lesson.subject}</span>}
          {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
          {lesson.class_size > 0 && <span>{lesson.class_size} students</span>}
          {lesson.location && <span>{lesson.location}</span>}
        </div>
      </header>

      {/* Standards — passed through verbatim, not regenerated */}
      {standards.length > 0 && (
        <Section title="Standards">
          <ul className="space-y-2">
            {standards.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-ink-200">
                  Grade {gradeLabel(s.grade)}: {s.code}
                </span>
                {s.text && (
                  <span className="ml-2 text-ink-400">{s.text}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Lesson overview */}
      {overview && (
        <Section title="Lesson Overview">
          <p className="text-sm text-ink-200 leading-relaxed whitespace-pre-line">{overview}</p>
        </Section>
      )}

      {/* Differentiation in action */}
      {differentiation.length > 0 && (
        <Section title="Differentiation & Accommodations in Action">
          <ul className="space-y-2">
            {differentiation.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 print:bg-violet-600" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Look for */}
      {lookFor.length > 0 && (
        <Section title="Look For">
          <ul className="space-y-3">
            {lookFor.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 text-sm text-ink-200 leading-relaxed print:border-ink-300 print:bg-transparent"
              >
                <ClipboardCheck size={15} className="mt-0.5 shrink-0 text-violet-400 print:text-violet-600" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Footer note */}
      <div className="rounded-lg border border-ink-900 bg-ink-950/50 px-5 py-3 print:border-ink-300 print:bg-transparent">
        <p className="text-xs text-ink-500 print:text-ink-400">
          Generated from lesson plan data · Standards shown are from the original lesson and have not been modified
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="label-eyebrow border-b border-ink-900 pb-1 text-ink-400 print:border-ink-300 print:text-ink-500">
        {title}
      </h3>
      <div className="leading-relaxed">{children}</div>
    </section>
  )
}

function CopyButton({ buildPlainText }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable; fail silently
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 bg-ink-900 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-ink-700 hover:text-ink-100"
    >
      {copied ? <Check size={13} className="text-violet-400" /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
