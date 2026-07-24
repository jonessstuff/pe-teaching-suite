import { Link } from 'react-router-dom'
import { Lock, Sparkles, Target, BookMarked, CheckCircle2 } from 'lucide-react'
import { UPGRADE_URL } from '../services/trialService'

const gradeLabel = (g) => (g === 0 ? 'K' : g)

// Soft-gate preview of a shared lesson for non-subscribers. Shows the title,
// objective, standards, success criteria, and the first section in full to
// prove quality; remaining sections are teased (blurred) behind a signup CTA.
// The full section bodies are never sent to the client — see the
// get-shared-lesson edge function.
export default function SharedLessonPreview({ data, hasSession }) {
  const {
    title,
    subject,
    grade_bands = [],
    learning_targets = {},
    success_criteria = {},
    standards = [],
    sections = [],
  } = data ?? {}

  const openSection = sections.find((s) => !s.locked)
  const lockedSections = sections.filter((s) => s.locked)

  // Objective, keyed per grade band; fall back to whatever targets exist.
  const targetEntries = (grade_bands.length
    ? grade_bands.map((g) => [g, learning_targets[g]])
    : Object.entries(learning_targets)
  ).filter(([, t]) => t)

  // Success criteria: show the first non-empty band's bullets (quality signal).
  const criteriaBullets = (Object.values(success_criteria).find(
    (v) => Array.isArray(v) && v.length
  ) ?? [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-ink-500 mb-1">
          {subject}
          {grade_bands.length > 0 && ` · Grade ${grade_bands.map(gradeLabel).join('/')}`}
        </p>
        <h1 className="text-2xl font-bold text-ink-950">{title}</h1>
      </div>

      {/* Objective / learning target */}
      {targetEntries.length > 0 && (
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <Target size={16} className="text-accent-600" /> Learning target
          </h2>
          <div className="mt-3 space-y-2">
            {targetEntries.map(([g, t]) => (
              <p key={g} className="text-sm text-ink-800 leading-relaxed">
                {grade_bands.length > 1 && (
                  <span className="font-semibold text-ink-500">Grade {gradeLabel(g)}: </span>
                )}
                {t}
              </p>
            ))}
          </div>

          {criteriaBullets.length > 0 && (
            <div className="mt-4 border-t border-ink-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Success criteria
              </p>
              <ul className="mt-2 space-y-1.5">
                {criteriaBullets.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                    <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-accent-600" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Standards alignment */}
      {standards.length > 0 && (
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <BookMarked size={16} className="text-accent-600" /> Standards alignment
          </h2>
          <div className="mt-3 space-y-3">
            {standards.map((s, i) => (
              <div key={i}>
                <p className="font-mono text-xs font-semibold text-accent-700">
                  {[s.code, s.grade ? `· Grade ${gradeLabel(s.grade)}` : ''].filter(Boolean).join(' ')}
                </p>
                {s.text && <p className="mt-0.5 text-sm text-ink-700 leading-relaxed">{s.text}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* First section — shown in full */}
      {openSection && (
        <div className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            {openSection.label}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-800 leading-relaxed">
            {openSection.body}
          </p>
        </div>
      )}

      {/* Locked remaining sections — blurred teasers behind the CTA overlay */}
      {lockedSections.length > 0 && (
        <div className="relative">
          <div
            aria-hidden
            className="space-y-6 select-none blur-[3px] [mask-image:linear-gradient(to_bottom,black_0%,black_20%,transparent_92%)]"
          >
            {lockedSections.map((s, i) => (
              <div key={i} className="rounded-xl border border-ink-200 bg-white p-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {s.label}
                </h2>
                <p className="mt-2 text-sm text-ink-800 leading-relaxed">{s.body}</p>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full rounded bg-ink-200" />
                  <div className="h-3 w-11/12 rounded bg-ink-200" />
                  <div className="h-3 w-4/5 rounded bg-ink-200" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/15 text-accent-600">
              <Lock size={22} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-950">See the full lesson plan</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
                This lesson has {lockedSections.length} more section
                {lockedSections.length !== 1 ? 's' : ''} — full instruction, practice,
                differentiation, and closure. {hasSession
                  ? 'Upgrade your account to unlock everything.'
                  : 'Create a free account to unlock everything.'}
              </p>
            </div>

            {hasSession ? (
              <a
                href={UPGRADE_URL}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
              >
                <Sparkles size={16} /> Upgrade to unlock the full lesson
              </a>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
                >
                  <Sparkles size={16} /> Sign up free to see the full lesson
                </Link>
                <p className="text-xs text-ink-400">Free trial · no credit card to start</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
