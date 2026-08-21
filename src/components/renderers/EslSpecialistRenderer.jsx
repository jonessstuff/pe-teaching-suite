import { useState } from 'react'
import { Copy, Check, Info, Target, Languages, Headphones, Mic, BookOpen, PenLine } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

const DOMAIN_META = [
  { key: 'listening', label: 'Listening', icon: Headphones },
  { key: 'speaking', label: 'Speaking', icon: Mic },
  { key: 'reading', label: 'Reading', icon: BookOpen },
  { key: 'writing', label: 'Writing', icon: PenLine },
]

export default function EslSpecialistRenderer({ lesson }) {
  if (!lesson) return null
  const bands = lesson.grade_bands ?? []
  const domains = lesson.language_domains ?? {}
  const vocab = lesson.key_vocabulary ?? []
  const flow = lesson.lesson_flow ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-fuchsia-500/15 text-ink-50">
            ESL/ELL · WIDA
            {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {lesson.proficiency_level && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-fuchsia-500/20 text-ink-50">
              {lesson.proficiency_level_number ? `Level ${lesson.proficiency_level_number} · ` : ''}{lesson.proficiency_level}
            </span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.content_area, lesson.topic].filter(Boolean).join(' · ')}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
          {lesson.key_language_use ? ` · ${lesson.key_language_use}` : ''}
        </p>
      </header>

      {/* SIOP: content + language objectives, separate and side-by-side */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3">
          <div className="mb-1 flex items-center gap-2">
            <Target size={14} className="text-ink-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Content objective</p>
          </div>
          <p className="text-sm text-ink-200">{lesson.content_objective}</p>
        </div>
        <div className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/5 px-4 py-3">
          <div className="mb-1 flex items-center gap-2">
            <Languages size={14} className="text-fuchsia-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">Language objective</p>
          </div>
          <p className="text-sm text-ink-200">{lesson.language_objective}</p>
        </div>
      </div>

      {/* Vocabulary with cognates */}
      {vocab.length > 0 && (
        <Section
          title="Key Vocabulary (pre-teach)"
          copyText={vocab.map((v) => `${v.term} — ${v.student_friendly_definition}${v.cognate_note ? ` [${v.cognate_note}]` : ''}`).join('\n')}
        >
          <div className="space-y-2">
            {vocab.map((v, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-2.5">
                <p className="text-sm"><span className="font-semibold text-ink-300">{v.term}</span> <span className="text-ink-300">— {v.student_friendly_definition}</span></p>
                {v.cognate_note && v.cognate_note.toLowerCase() !== 'no common cognate' && (
                  <p className="mt-0.5 text-xs text-ink-500">Cognate: {v.cognate_note}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* All four language domains */}
      <Section
        title="Four Language Domains"
        copyText={DOMAIN_META.map((d) => `${d.label}: ${domains[d.key] ?? ''}`).join('\n\n')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {DOMAIN_META.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-lg bg-ink-900 px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <Icon size={14} className="text-fuchsia-400" />
                <p className="text-sm font-semibold text-ink-100">{label}</p>
              </div>
              <p className="text-sm text-ink-300">{domains[key] || <span className="text-ink-600 italic">—</span>}</p>
            </div>
          ))}
        </div>
      </Section>

      <BulletSection title="Sentence Frames" items={lesson.sentence_frames} />
      <BulletSection title="Scaffolds & Visual Supports" items={lesson.scaffolds_and_visual_supports} />

      {/* SIOP lesson flow */}
      {flow.length > 0 && (
        <Section title="Lesson Flow (SIOP)" copyText={flow.map((s, i) => `${i + 1}. ${s.phase}: ${s.what_happens}`).join('\n')}>
          <ol className="space-y-2">
            {flow.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{s.phase}</p>
                </div>
                <p className="text-sm text-ink-300">{s.what_happens}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {lesson.formative_assessment && (
        <Section title="Formative Assessment (content + language)" copyText={lesson.formative_assessment}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.formative_assessment}</p>
        </Section>
      )}

      {lesson.level_up_down_note && (
        <Section title="If a Level Up or Down" copyText={lesson.level_up_down_note}>
          <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-3">
            <p className="text-sm text-ink-300">{lesson.level_up_down_note}</p>
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
                <span className="rounded bg-fuchsia-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-fuchsia-400 transition-colors print:hidden"
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
