import { useState } from 'react'
import { Copy, Check, Info, ShieldAlert, Target, HelpCircle } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function DanceRenderer({ lesson }) {
  if (!lesson) return null
  const bands = lesson.grade_bands ?? []
  const activities = lesson.main_activities ?? []
  const objectives = lesson.learning_objectives ?? []
  const vocab = lesson.vocabulary ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-olive-500/15 text-ink-50">
            Dance · {lesson.artistic_process || 'Artistic Process'}
            {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {lesson.band_label && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-olive-500/20 text-ink-50">{lesson.band_label}</span>
          )}
          {lesson.hs_tier && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-200">{lesson.hs_tier}</span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.focus}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
        </p>
      </header>

      {/* Enduring understanding + essential question */}
      {(lesson.enduring_understanding || lesson.essential_question) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {lesson.enduring_understanding && (
            <div className="rounded-lg border border-olive-500/25 bg-olive-500/5 px-4 py-3">
              <p className="text-xs font-semibold text-olive-400 mb-0.5">Enduring understanding</p>
              <p className="text-sm text-ink-300">{lesson.enduring_understanding}</p>
            </div>
          )}
          {lesson.essential_question && (
            <div className="flex items-start gap-2 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3">
              <HelpCircle size={14} className="mt-0.5 shrink-0 text-ink-500" />
              <div>
                <p className="text-xs font-semibold text-ink-300 mb-0.5">Essential question</p>
                <p className="text-sm text-ink-300">{lesson.essential_question}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {objectives.length > 0 && (
        <Section title="Learning Objectives" copyText={objectives.map((o) => `- ${o}`).join('\n')}>
          <ul className="space-y-1 text-ink-300">
            {objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Target size={14} className="mt-0.5 shrink-0 text-olive-400" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {lesson.warm_up && (
        <Section title="Warm-Up" copyText={lesson.warm_up}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.warm_up}</p>
        </Section>
      )}

      {/* Main activities */}
      {activities.length > 0 && (
        <Section
          title="Main Activities"
          copyText={activities.map((a, i) => `${i + 1}. ${a.name}\nHow: ${a.how_to_run}\nWhy: ${a.why_it_works}`).join('\n\n')}
        >
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-olive-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{a.name}</p>
                </div>
                {a.how_to_run && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">How: </span>{a.how_to_run}</p>}
                {a.why_it_works && <p className="mt-1 text-sm text-ink-400"><span className="font-medium text-ink-300">Why it works: </span>{a.why_it_works}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {lesson.process_focus_note && (
        <Section title="Artistic Process Focus" copyText={lesson.process_focus_note}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.process_focus_note}</p>
        </Section>
      )}

      {lesson.differentiation && (
        <Section title="Differentiation" copyText={lesson.differentiation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.differentiation}</p>
        </Section>
      )}

      <BulletSection title="Materials" items={lesson.materials} />

      {lesson.assessment && (
        <Section title="Assessment" copyText={lesson.assessment}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.assessment}</p>
        </Section>
      )}

      {/* Vocabulary */}
      {vocab.length > 0 && (
        <Section
          title="Dance Vocabulary"
          copyText={vocab.map((v) => `${v.term} — ${v.meaning}`).join('\n')}
        >
          <div className="overflow-hidden rounded-lg border border-ink-800">
            <table className="w-full text-sm">
              <tbody>
                {vocab.map((v, i) => (
                  <tr key={i} className={i % 2 ? 'bg-ink-900/40' : ''}>
                    <td className="px-3 py-1.5 font-medium text-olive-300 align-top whitespace-nowrap">{v.term}</td>
                    <td className="px-3 py-1.5 text-ink-300 align-top">{v.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Body-safety note — always prominent */}
      {lesson.safety_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Body safety: </span>{lesson.safety_note}</p>
        </div>
      )}

      {/* Standards */}
      {(lesson.standards_alignment ?? []).length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={(lesson.standards_alignment ?? []).map((s) => `[${s.framework} ${s.code}] ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {(lesson.standards_alignment ?? []).map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-olive-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}{s.code ? ` ${s.code}` : ''}</span>
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-olive-300 transition-colors print:hidden"
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
