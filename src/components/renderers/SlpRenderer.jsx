import { useState } from 'react'
import { Copy, Check, Info, ShieldAlert, MessageSquare, FlaskConical } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function SlpRenderer({ lesson }) {
  if (!lesson) return null
  const isAdult = lesson.tier === 'adult'
  const bands = lesson.grade_bands ?? []
  const activities = lesson.activities ?? []
  const modalities = lesson.response_modalities ?? []

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-bronze-500/15 text-ink-50">
            SLP · {lesson.content_area || 'Activity'}
            {!isAdult && bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {isAdult ? (
            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-ink-50">
              <FlaskConical size={11} /> Experimental · Adult / Rehab
            </span>
          ) : (
            lesson.band_label && (
              <span className="rounded px-2 py-0.5 text-xs font-semibold bg-bronze-500/20 text-ink-50">{lesson.band_label}</span>
            )
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.focus}
          {lesson.session_length_minutes ? ` · ${lesson.session_length_minutes} min` : ''}
        </p>
      </header>

      {/* Experimental-tier banner (adult only) */}
      {isAdult && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <FlaskConical size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-100">
            <span className="font-semibold">Experimental tier, for review.</span> Adult rehabilitation is outside the platform&rsquo;s core K-12 focus and involves a higher-stakes clinical population. Treat everything below as general activity ideas only — to be filtered entirely through the treating clinician&rsquo;s assessment, plan of care, and judgment.
          </p>
        </div>
      )}

      {lesson.target_area_summary && (
        <Section title="Target Area" copyText={lesson.target_area_summary}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.target_area_summary}</p>
        </Section>
      )}

      {lesson.warm_up && (
        <Section title="Warm-Up" copyText={lesson.warm_up}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.warm_up}</p>
        </Section>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <Section
          title="Activities"
          copyText={activities.map((a, i) => `${i + 1}. ${a.name}\nHow: ${a.how_to_run}\nWhy: ${a.why_it_works}`).join('\n\n')}
        >
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bronze-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{a.name}</p>
                </div>
                {a.how_to_run && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">How: </span>{a.how_to_run}</p>}
                {a.why_it_works && <p className="mt-1 text-sm text-ink-400"><span className="font-medium text-ink-300">Why it works: </span>{a.why_it_works}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <BulletSection title="Cueing & Scaffolding" items={lesson.cueing_and_scaffolding} />

      {modalities.length > 0 && (
        <Section title="Response Modalities" copyText={modalities.map((m) => `${m.modality}: ${m.how}`).join('\n')}>
          <div className="space-y-1.5">
            {modalities.map((m, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-ink-300">
                <MessageSquare size={14} className="mt-0.5 shrink-0 text-bronze-400" />
                <p><span className="font-medium text-ink-200">{m.modality}: </span>{m.how}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <BulletSection title="Materials" items={lesson.materials} />

      {lesson.generalization && (
        <Section title="Generalization / Carryover" copyText={lesson.generalization}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.generalization}</p>
        </Section>
      )}

      {lesson.progress_check && (
        <Section title="Informal Progress Check" copyText={lesson.progress_check}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.progress_check}</p>
        </Section>
      )}

      {lesson.age_dignity_note && (
        <div className="rounded-lg border border-bronze-500/25 bg-bronze-500/5 px-4 py-3">
          <p className="text-xs font-semibold text-ink-300 mb-0.5">Age &amp; dignity</p>
          <p className="text-sm text-ink-300">{lesson.age_dignity_note}</p>
        </div>
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
                <span className="rounded bg-bronze-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">— {s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Clinical boundary — always prominent; extra-strong for adult */}
      {lesson.clinical_boundary_note && (
        <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 ${isAdult ? 'border-amber-500/40 bg-amber-500/10' : 'border-amber-500/25 bg-amber-500/5'}`}>
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Clinical boundary: </span>{lesson.clinical_boundary_note}</p>
        </div>
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
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="lesson-section-title text-ink-400">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-bronze-400 transition-colors print:hidden"
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
