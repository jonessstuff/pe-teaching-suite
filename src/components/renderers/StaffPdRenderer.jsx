import { useState } from 'react'
import { Copy, Check, Info, Presentation, Clock } from 'lucide-react'

export default function StaffPdRenderer({ lesson }) {
  if (!lesson) return null
  const sections = lesson.sections ?? []
  const standards = lesson.standards_alignment ?? []

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-gold-500/15 text-gold-400 flex items-center gap-1">
            <Presentation size={12} /> Staff PD &amp; Meeting Planning
          </span>
          {lesson.content_area && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-gold-500/20 text-gold-300">
              {lesson.content_area}
            </span>
          )}
          {lesson.meta && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-300">
              {lesson.meta}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        {lesson.focus && <p className="text-sm text-ink-400">{lesson.focus}</p>}
      </header>

      {lesson.overview && (
        <div className="rounded-lg border border-gold-500/25 bg-gold-500/5 px-4 py-3">
          <p className="text-sm italic text-ink-200">{lesson.overview}</p>
        </div>
      )}

      {/* Sections */}
      {sections.map((s, i) => (
        <SectionBlock key={i} section={s} />
      ))}

      {/* Standards */}
      {standards.length > 0 && (
        <Section
          title="Learning Forward Standards"
          copyText={standards.map((s) => `[${s.standard}] ${s.note}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {standards.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-gold-500/15 px-1.5 py-0.5 text-xs font-semibold text-gold-400">{s.standard}</span>
                <span className="ml-1">{s.note}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Scope note */}
      {lesson.facilitator_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 print:border-ink-300">
          <Info size={15} className="mt-0.5 shrink-0 text-ink-500" />
          <p className="text-xs text-ink-400"><span className="font-medium text-ink-300">Scope: </span>{lesson.facilitator_note}</p>
        </div>
      )}
    </div>
  )
}

// Renders one section by whichever content field(s) it carries.
function SectionBlock({ section }) {
  const { heading, body, items, steps, pairs, templates } = section
  const copyText = [
    body,
    (items ?? []).map((i) => `- ${i}`).join('\n'),
    (steps ?? []).map((st) => `${st.label}${st.minutes ? ` (${st.minutes} min)` : ''}: ${st.detail}`).join('\n'),
    (pairs ?? []).map((p) => `${p.term} — ${p.detail}`).join('\n'),
    (templates ?? []).map((t) => `[${t.audience}]${t.subject ? ` ${t.subject}` : ''}\n${t.body}`).join('\n\n'),
  ].filter(Boolean).join('\n')

  return (
    <Section title={heading} copyText={copyText}>
      {body && <p className="text-ink-300 whitespace-pre-line">{body}</p>}

      {(items ?? []).length > 0 && (
        <ul className="list-disc list-inside space-y-1 text-ink-300">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}

      {(steps ?? []).length > 0 && (
        <ol className="space-y-2">
          {steps.map((st, i) => (
            <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/25 text-xs font-semibold text-gold-300">{i + 1}</span>
                <p className="text-sm font-semibold text-ink-100">{st.label}</p>
                {st.minutes ? (
                  <span className="flex items-center gap-0.5 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-ink-400">
                    <Clock size={11} /> {st.minutes} min
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-ink-300">{st.detail}</p>
            </li>
          ))}
        </ol>
      )}

      {(pairs ?? []).length > 0 && (
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={i} className="rounded-lg bg-ink-900 px-4 py-2.5">
              <p className="text-sm font-semibold text-ink-100">{p.term}</p>
              <p className="text-sm text-ink-400">{p.detail}</p>
            </div>
          ))}
        </div>
      )}

      {(templates ?? []).length > 0 && (
        <div className="space-y-3">
          {templates.map((t, i) => <TemplateBlock key={i} template={t} />)}
        </div>
      )}
    </Section>
  )
}

function TemplateBlock({ template }) {
  const [copied, setCopied] = useState(false)
  const text = `${template.subject ? `Subject: ${template.subject}\n\n` : ''}${template.body ?? ''}`
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-gold-500/15 px-2 py-0.5 text-xs font-semibold text-gold-400">{template.audience}</span>
        <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-xs text-ink-400 hover:text-gold-400 transition-colors print:hidden">
          {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {template.subject && <p className="mb-1 text-sm font-semibold text-ink-100">{template.subject}</p>}
      <p className="text-sm text-ink-300 whitespace-pre-line">{template.body}</p>
    </div>
  )
}

function Section({ title, copyText, children }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(copyText ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400">{title}</h3>
        {copyText && (
          <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-xs text-ink-400 hover:text-gold-400 transition-colors print:hidden" title="Copy this section">
            {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="text-sm text-ink-200 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
