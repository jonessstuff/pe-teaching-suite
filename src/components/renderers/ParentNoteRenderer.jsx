/**
 * Parent Note renderer.
 *
 * Displays a warm, jargon-free communication for parents/guardians.
 * Sections: intro paragraph, "What we're learning" skills bullets,
 * "New words" vocabulary with kid-friendly definitions, and
 * "Ask your child" conversation starters.
 *
 * The "Copy full note" button assembles all sections into plain text
 * suitable for pasting into an email or newsletter.
 *
 * @param {{ lesson: import("../../types/lessonObject").LessonObject }} props
 */

import { useState } from 'react'
import { Mail, Copy, Check } from 'lucide-react'

export default function ParentNoteRenderer({ lesson }) {
  if (!lesson) return null

  const intro = lesson.parent_note_intro ?? ''
  const skills = lesson.parent_note_skills ?? []
  const vocabulary = lesson.parent_note_vocabulary ?? []
  const ask = lesson.parent_note_ask ?? []

  function buildPlainText() {
    const lines = []

    if (intro) {
      lines.push(intro)
      lines.push('')
    }

    if (skills.length > 0) {
      lines.push("What we're learning:")
      skills.forEach((s) => lines.push(`• ${s}`))
      lines.push('')
    }

    if (vocabulary.length > 0) {
      lines.push('New words:')
      vocabulary.forEach(({ word, definition }) =>
        lines.push(`• ${word}: ${definition}`)
      )
      lines.push('')
    }

    if (ask.length > 0) {
      ask.forEach((q) => lines.push(q))
    }

    return lines.join('\n').trim()
  }

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-3 border-b border-ink-900 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
            <Mail size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Parent Note</p>
            <p className="text-xs text-ink-500 mt-0.5">Share with families via email or newsletter.</p>
          </div>
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        {lesson.unit && <p className="text-sm text-ink-400">{lesson.unit}</p>}
      </header>

      {/* Intro paragraph */}
      {intro && (
        <section className="space-y-3">
          <p className="text-ink-200 leading-relaxed whitespace-pre-line">{intro}</p>
        </section>
      )}

      {/* What we're learning */}
      {skills.length > 0 && (
        <Section title="What we're learning">
          <ul className="space-y-1.5">
            {skills.map((skill, i) => (
              <li key={i} className="flex items-start gap-2 text-ink-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {skill}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* New words */}
      {vocabulary.length > 0 && (
        <Section title="New words">
          <ul className="space-y-3">
            {vocabulary.map(({ word, definition }, i) => (
              <li key={i}>
                <span className="text-sm font-semibold text-ink-100">{word}</span>
                <span className="text-ink-400"> — </span>
                <span className="text-sm text-ink-300">{definition}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Ask your child */}
      {ask.length > 0 && (
        <Section title="Ask your child">
          <ul className="space-y-3">
            {ask.map((q, i) => (
              <li key={i} className="rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 text-sm text-ink-200 leading-relaxed">
                {q}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Copy full note */}
      <div className="border-t border-ink-900 pt-4">
        <CopyFullNote buildPlainText={buildPlainText} />
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="label-eyebrow border-b border-ink-900 pb-1 text-ink-400">{title}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function CopyFullNote({ buildPlainText }) {
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
      className="inline-flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-900 px-4 py-2 text-sm font-medium text-ink-300 transition-colors hover:border-ink-700 hover:text-ink-100 print:hidden"
    >
      {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
      {copied ? 'Copied to clipboard' : 'Copy full note'}
    </button>
  )
}
