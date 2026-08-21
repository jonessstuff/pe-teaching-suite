import { useState } from 'react'
import { Copy, Check, Info } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function GiftedTalentedRenderer({ lesson }) {
  if (!lesson) return null
  if (lesson.mode === 'enrich') return <EnrichPlan lesson={lesson} />
  if (lesson.mode === 'support') return <SupportGuide lesson={lesson} />
  return <DifferentiatePlan lesson={lesson} />
}

// ─── Mode: Differentiate (Depth & Complexity) ────────────────────────────────
function DifferentiatePlan({ lesson }) {
  const gradeBands = lesson.grade_bands ?? []
  const dc = lesson.depth_complexity ?? []
  const tiers = lesson.tiered_assignments ?? {}

  const dcText = dc.map((d) => `${d.dimension}\nPrompt: ${d.prompt}\nTask: ${d.task}`).join('\n\n')
  const tiersText = [
    `On grade level: ${tiers.on_grade_level ?? ''}`,
    `Advanced: ${tiers.advanced ?? ''}`,
    `Highly advanced: ${tiers.highly_advanced ?? ''}`,
  ].join('\n\n')

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      <PlanHeader
        badge="Gifted & Talented · Depth & Complexity"
        gradeBands={gradeBands}
        title={lesson.title}
        subtitle={[lesson.content_area, lesson.topic].filter(Boolean).join(' · ')}
      />

      {lesson.learning_target && (
        <Section title="Learning Target" copyText={lesson.learning_target}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.learning_target}</p>
        </Section>
      )}

      {dc.length > 0 && (
        <Section title="Depth & Complexity (Kaplan)" copyText={dcText}>
          <div className="space-y-3">
            {dc.map((d, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <p className="text-xs font-semibold text-amber-400 mb-1">{d.dimension}</p>
                {d.prompt && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">Prompt: </span>{d.prompt}</p>}
                {d.task && <p className="mt-1 text-sm text-ink-300"><span className="font-medium text-ink-200">Task: </span>{d.task}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(tiers.on_grade_level || tiers.advanced || tiers.highly_advanced) && (
        <Section title="Tiered Assignments" copyText={tiersText}>
          <div className="space-y-2">
            <TierRow label="On grade level" text={tiers.on_grade_level} />
            <TierRow label="Advanced" text={tiers.advanced} />
            <TierRow label="Highly advanced" text={tiers.highly_advanced} />
          </div>
        </Section>
      )}

      {lesson.curriculum_compacting && (
        <Section title="Curriculum Compacting" copyText={lesson.curriculum_compacting}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.curriculum_compacting}</p>
        </Section>
      )}

      <BulletSection title="Higher-Order Questions" items={lesson.higher_order_questions} />
      <BulletSection title="Extension Products" items={lesson.extension_products} />

      {lesson.flexible_grouping && (
        <Section title="Flexible Grouping" copyText={lesson.flexible_grouping}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.flexible_grouping}</p>
        </Section>
      )}

      {lesson.assessment && (
        <Section title="Assessment" copyText={lesson.assessment}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.assessment}</p>
        </Section>
      )}

      <SocialEmotionalNote text={lesson.social_emotional_note} />
      <StandardsBlock items={lesson.standards_alignment} />
      <StateNote text={lesson.state_verification_note} />
    </div>
  )
}

// ─── Mode: Enrich vs Accelerate ──────────────────────────────────────────────
function EnrichPlan({ lesson }) {
  const gradeBands = lesson.grade_bands ?? []
  const enrich = lesson.enrichment_options ?? []
  const accel = lesson.acceleration_options ?? []

  const enrichText = enrich.map((e) => `[${e.renzulli_type}] ${e.title}\n${e.description}`).join('\n\n')
  const accelText = accel.map((a) => `${a.type}: ${a.description}`).join('\n\n')

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      <PlanHeader
        badge="Gifted & Talented · Enrichment & Acceleration"
        gradeBands={gradeBands}
        title={lesson.title}
        subtitle={[lesson.content_area, lesson.topic].filter(Boolean).join(' · ')}
      />

      {enrich.length > 0 && (
        <Section title="Enrichment Options (Renzulli Triad)" copyText={enrichText}>
          <div className="space-y-3">
            {enrich.map((e, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{e.renzulli_type}</span>
                  <p className="text-sm font-semibold text-ink-100">{e.title}</p>
                </div>
                <p className="text-sm text-ink-300">{e.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {accel.length > 0 && (
        <Section title="Acceleration Options" copyText={accelText}>
          <div className="space-y-2">
            {accel.map((a, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <p className="text-xs font-semibold text-amber-400 mb-1">{a.type}</p>
                <p className="text-sm text-ink-300">{a.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {lesson.acceleration_vs_enrichment && (
        <Section title="Acceleration vs. Enrichment — How to Decide" copyText={lesson.acceleration_vs_enrichment}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.acceleration_vs_enrichment}</p>
        </Section>
      )}

      {lesson.flexible_grouping && (
        <Section title="Flexible Grouping" copyText={lesson.flexible_grouping}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.flexible_grouping}</p>
        </Section>
      )}

      <BulletSection title="Recommended Products" items={lesson.recommended_products} />
      <SocialEmotionalNote text={lesson.social_emotional_note} />
      <StandardsBlock items={lesson.standards_alignment} />
      <StateNote text={lesson.state_verification_note} />
    </div>
  )
}

// ─── Mode: Support (2e / underachievement / asynchronous) ────────────────────
function SupportGuide({ lesson }) {
  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <span className="label-eyebrow rounded px-2 py-0.5 bg-amber-500/15 text-ink-50">
          Gifted & Talented · Student Support Guidance
        </span>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.focus, lesson.grade_band_label ? `Grades ${lesson.grade_band_label}` : ''].filter(Boolean).join(' · ')}
        </p>
      </header>

      {lesson.overview && (
        <Section title="Overview" copyText={lesson.overview}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.overview}</p>
        </Section>
      )}

      <BulletSection title="What to Look For (indicators to explore, not proof)" items={lesson.identification_indicators} />
      <BulletSection title="Common Misconceptions to Avoid" items={lesson.common_misconceptions} />
      <BulletSection title="Support Strategies" items={lesson.support_strategies} />

      {lesson.asynchronous_development_note && (
        <Section title="Asynchronous Development" copyText={lesson.asynchronous_development_note}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.asynchronous_development_note}</p>
        </Section>
      )}

      {lesson.perfectionism_note && (
        <Section title="Perfectionism" copyText={lesson.perfectionism_note}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.perfectionism_note}</p>
        </Section>
      )}

      <BulletSection title="Social-Emotional Supports" items={lesson.social_emotional_supports} />

      {lesson.collaboration_note && (
        <Section title="Collaboration & When to Loop In Others" copyText={lesson.collaboration_note}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.collaboration_note}</p>
        </Section>
      )}

      <StandardsBlock items={lesson.standards_alignment} />
      <StateNote text={lesson.state_verification_note} />
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function PlanHeader({ badge, gradeBands, title, subtitle }) {
  return (
    <header className="space-y-2 border-b border-ink-900 pb-4">
      <span className="label-eyebrow rounded px-2 py-0.5 bg-amber-500/15 text-ink-50">
        {badge}
        {gradeBands.length > 0
          ? ` · Grade${gradeBands.length > 1 ? 's' : ''} ${gradeBands.map(formatGrade).join('/')}`
          : ''}
      </span>
      <h2 className="lesson-title text-ink-50">{title}</h2>
      {subtitle && <p className="text-sm text-ink-400">{subtitle}</p>}
    </header>
  )
}

function TierRow({ label, text }) {
  if (!text) return null
  return (
    <div className="rounded-lg bg-ink-900 px-4 py-3">
      <p className="text-xs font-semibold text-amber-400 mb-1">{label}</p>
      <p className="text-sm text-ink-300">{text}</p>
    </div>
  )
}

function BulletSection({ title, items }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section title={title} copyText={list.map((i) => `- ${i}`).join('\n')}>
      <ul className="list-disc list-inside space-y-1 text-ink-300">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </Section>
  )
}

function SocialEmotionalNote({ text }) {
  if (!text) return null
  return (
    <Section title="Social-Emotional Note" copyText={text}>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-ink-300 whitespace-pre-line">{text}</p>
      </div>
    </Section>
  )
}

function StandardsBlock({ items }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section
      title="Standards Alignment"
      copyText={list.map((s) => `[${s.framework}] ${s.text}`).join('\n')}
    >
      <ul className="space-y-1.5 text-ink-300">
        {list.map((s, i) => (
          <li key={i} className="text-sm">
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>{' '}
            {s.text}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function StateNote({ text }) {
  if (!text) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 print:border-ink-300">
      <Info size={15} className="mt-0.5 shrink-0 text-ink-500" />
      <p className="text-xs text-ink-400">{text}</p>
    </div>
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
      // Clipboard API unavailable; fail silently
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-amber-400 transition-colors print:hidden"
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
