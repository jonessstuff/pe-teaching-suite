import { useState } from 'react'
import { Copy, Check, Info, Target, MessageCircle, Headphones, Presentation } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

const MODES = [
  { key: 'interpersonal', label: 'Interpersonal', blurb: 'Two-way, spontaneous conversation', icon: MessageCircle },
  { key: 'interpretive', label: 'Interpretive', blurb: 'Listening / reading / viewing comprehension', icon: Headphones },
  { key: 'presentational', label: 'Presentational', blurb: 'Speaking / writing / signing production', icon: Presentation },
]

export default function WorldLanguagesRenderer({ lesson }) {
  if (!lesson) return null
  const bands = lesson.grade_bands ?? []
  const comm = lesson.communication ?? {}
  const vocab = lesson.vocabulary ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-jade-500/15 text-ink-50">
            World Languages{lesson.target_language ? ` · ${lesson.target_language}` : ''}
            {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {lesson.proficiency_level && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-jade-500/20 text-ink-50">{lesson.proficiency_level}</span>
          )}
          {lesson.band_label && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-200">{lesson.band_label}</span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.theme}
          {lesson.session_length_minutes ? ` · ${lesson.session_length_minutes} min` : ''}
        </p>
      </header>

      {/* Can-Do learning target */}
      {lesson.can_do_statement && (
        <div className="flex items-start gap-2.5 rounded-lg border border-jade-500/30 bg-jade-500/5 px-4 py-3">
          <Target size={15} className="mt-0.5 shrink-0 text-jade-400" />
          <p className="text-sm text-ink-200"><span className="font-semibold text-ink-100">Can-Do target: </span>{lesson.can_do_statement}</p>
        </div>
      )}

      {/* Communication — the three modes */}
      <section className="space-y-3">
        <div className="lesson-section-rule">
          <h3 className="lesson-section-title text-ink-200">Communication · three modes</h3>
        </div>
        <div className="space-y-3">
          {MODES.map(({ key, label, blurb, icon: Icon }) => {
            const m = comm[key]
            if (!m) return null
            return (
              <div key={key} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon size={15} className="shrink-0 text-jade-400" />
                  <p className="text-sm font-semibold text-ink-100">{label}</p>
                  <span className="text-xs text-ink-500">· {blurb}</span>
                </div>
                {m.activity && <p className="text-sm text-ink-300 whitespace-pre-line">{m.activity}</p>}
                {(m.example_language ?? []).length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {m.example_language.map((ex, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium text-jade-300">{ex.target}</span>
                        {ex.gloss && <span className="text-ink-400"> — {ex.gloss}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {m.teacher_notes && <p className="mt-2 text-xs text-ink-500"><span className="font-medium text-ink-400">Teacher notes: </span>{m.teacher_notes}</p>}
              </div>
            )
          })}
        </div>
      </section>

      {/* The other four Cs */}
      <CText title="Cultures" text={lesson.cultures} />
      <CText title="Connections" text={lesson.connections} />
      <CText title="Comparisons" text={lesson.comparisons} />
      <CText title="Communities" text={lesson.communities} />

      {/* Vocabulary */}
      {vocab.length > 0 && (
        <Section
          title="Key Vocabulary"
          copyText={vocab.map((v) => `${v.target} — ${v.gloss}${v.notes ? ` (${v.notes})` : ''}`).join('\n')}
        >
          <div className="overflow-hidden rounded-lg border border-ink-800">
            <table className="w-full text-sm">
              <tbody>
                {vocab.map((v, i) => (
                  <tr key={i} className={i % 2 ? 'bg-ink-900/40' : ''}>
                    <td className="px-3 py-1.5 font-medium text-jade-300 align-top whitespace-nowrap">{v.target}</td>
                    <td className="px-3 py-1.5 text-ink-300 align-top">{v.gloss}</td>
                    <td className="px-3 py-1.5 text-ink-500 align-top text-xs">{v.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <BulletSection title="Materials" items={lesson.materials} />

      {lesson.assessment_check && (
        <Section title="Assessment Check" copyText={lesson.assessment_check}>
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
                <span className="rounded bg-jade-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">— {s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Accuracy note — always prominent */}
      {lesson.accuracy_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Verify target-language content: </span>{lesson.accuracy_note}</p>
        </div>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function CText({ title, text }) {
  if (!text) return null
  return (
    <Section title={title} copyText={text}>
      <p className="text-ink-300 whitespace-pre-line">{text}</p>
    </Section>
  )
}

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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-jade-300 transition-colors print:hidden"
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
