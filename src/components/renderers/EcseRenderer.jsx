import { useState } from 'react'
import { Copy, Check, Info, Sparkles, Puzzle, Repeat, Eye, Home, MessageSquare, Hand, ShieldCheck } from 'lucide-react'

/**
 * Early Childhood Special Education (ECSE) renderer.
 *
 * Play-based / embedded-in-routines shape (like Early Childhood), plus the ECSE
 * specifics: embedded learning opportunities, specialized supports (AAC/visual/
 * motor), naturalistic prompting, response modalities, family partnership, and
 * the instructional-ideas-ONLY safeguard note carried in every plan.
 */
export default function EcseRenderer({ lesson }) {
  if (!lesson) return null

  const focus = lesson.developmental_focus ?? []
  const opportunities = lesson.embedded_learning_opportunities ?? []
  const supports = lesson.specialized_supports ?? []
  const modalities = lesson.response_modalities ?? []
  const standards = lesson.standards_alignment ?? []

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-sage-500/15 text-ink-50">
            ECSE · Play-Based & Embedded (DEC)
          </span>
          {lesson.age_band && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-sage-500/20 text-ink-50">
              {lesson.age_band}
            </span>
          )}
          {lesson.setting && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-300">
              {lesson.setting}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-ink-400">
          {lesson.focus_area && <p>Focus area: {lesson.focus_area}</p>}
          {lesson.focus_skill && <p>Skill: {lesson.focus_skill}</p>}
        </div>
      </header>

      {/* Safeguard note — surface it up top, like SPED's disclaimer */}
      {lesson.instructional_support_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sage-500/30 bg-sage-500/10 px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-sage-400" />
          <p className="text-xs text-ink-200">
            <span className="font-semibold text-ink-100">Instructional ideas only — </span>
            {lesson.instructional_support_note}
          </p>
        </div>
      )}

      {lesson.big_idea && (
        <div className="rounded-lg border border-sage-500/25 bg-sage-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Big idea</p>
          <p className="text-sm italic text-ink-200">{lesson.big_idea}</p>
        </div>
      )}

      {/* Whole-child developmental focus */}
      {focus.length > 0 && (
        <Section
          title="Whole-Child Developmental Focus"
          copyText={focus.map((f) => `${f.domain}: ${f.description}`).join('\n')}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {focus.map((f, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-3 py-2">
                <p className="text-xs font-semibold text-ink-300">{f.domain}</p>
                <p className="mt-0.5 text-sm text-ink-300">{f.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Embedded learning opportunities — the core of the ECSE shape */}
      {opportunities.length > 0 && (
        <Section
          title="Embedded Learning Opportunities"
          icon={Repeat}
          copyText={opportunities
            .map((o) => `${o.routine_or_activity}\nHow to embed: ${o.how_to_embed}\nSupports: ${(o.specialized_supports ?? []).join(', ')}`)
            .join('\n\n')}
        >
          <p className="mb-2 text-xs text-ink-500">
            Naturalistic instruction — many short chances to work the skill inside real play &amp; routines, not pull-out drill.
          </p>
          <div className="space-y-3">
            {opportunities.map((o, i) => (
              <div key={i} className="rounded-lg border border-ink-800 bg-ink-900/60 p-4">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-500/25 text-xs font-semibold text-ink-50">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-ink-100">{o.routine_or_activity}</p>
                </div>
                {o.how_to_embed && <p className="text-sm text-ink-300">{o.how_to_embed}</p>}
                {(o.specialized_supports ?? []).length > 0 && (
                  <p className="mt-2 text-xs text-ink-400">
                    <span className="font-semibold text-sage-400">Supports: </span>
                    {(o.specialized_supports ?? []).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {lesson.play_based_invitation && (
        <Section title="Play-Based Invitation" icon={Puzzle} copyText={lesson.play_based_invitation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.play_based_invitation}</p>
        </Section>
      )}

      {/* Specialized supports (AAC / visual / motor / sensory) */}
      {supports.length > 0 && (
        <Section
          title="Specialized Supports"
          icon={Hand}
          copyText={supports.map((s) => `${s.support}: ${s.how}`).join('\n')}
        >
          <ul className="space-y-2">
            {supports.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-3 py-2">
                <p className="text-sm font-semibold text-ink-100">{s.support}</p>
                <p className="mt-0.5 text-sm text-ink-300">{s.how}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {lesson.prompting_and_scaffolding && (
        <Section title="Prompting & Scaffolding" copyText={lesson.prompting_and_scaffolding}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.prompting_and_scaffolding}</p>
        </Section>
      )}

      {/* Response modalities */}
      {modalities.length > 0 && (
        <Section
          title="Ways to Participate & Respond"
          icon={MessageSquare}
          copyText={modalities.map((m) => `${m.modality}: ${m.how}`).join('\n')}
        >
          <ul className="space-y-1.5">
            {modalities.map((m, i) => (
              <li key={i} className="text-sm text-ink-300">
                <span className="rounded bg-sage-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{m.modality}</span>
                <span className="ml-1.5">{m.how}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {lesson.family_partnership && (
        <Section title="Family Partnership" icon={Home} copyText={lesson.family_partnership}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.family_partnership}</p>
        </Section>
      )}

      {/* Authentic observation */}
      {(lesson.observation_look_fors ?? []).length > 0 && (
        <Section
          title="Observation Look-Fors"
          icon={Eye}
          copyText={(lesson.observation_look_fors ?? []).map((i) => `- ${i}`).join('\n')}
        >
          <p className="mb-2 text-xs text-ink-500">
            Strengths-based authentic observation in play &amp; routines — notice &amp; document, never test.
          </p>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.observation_look_fors ?? []).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </Section>
      )}

      {/* Standards stack */}
      {standards.length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={standards.map((s) => `[${s.framework}] ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {standards.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-sage-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1.5">{s.text}</span>
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
function Section({ title, icon: Icon, copyText, children }) {
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
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400 flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-sage-400" />}
          <span>{title}</span>
        </h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-sage-400 transition-colors print:hidden"
            title="Copy this section to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="text-sm text-ink-200 leading-relaxed">{children}</div>
    </section>
  )
}
