import { useState } from 'react'
import { Copy, Check, Info, MessageSquare } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function SpecialEducationRenderer({ lesson }) {
  if (!lesson) return null
  if (lesson.mode === 'functional') return <FunctionalPlan lesson={lesson} />
  if (lesson.mode === 'coteaching') return <CoTeachingPlan lesson={lesson} />
  return <MultiTierPlan lesson={lesson} />
}

// ─── Mode 1: Multi-tier self-contained ───────────────────────────────────────
function MultiTierPlan({ lesson }) {
  const tiers = lesson.tiers ?? []
  const udl = lesson.udl_supports ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      <PlanHeader
        badge="Special Education · Multi-Tier Lesson"
        gradeBands={lesson.grade_bands}
        title={lesson.title}
        subtitle={[lesson.content_area, lesson.topic].filter(Boolean).join(' · ')}
      />

      {lesson.shared_objective && (
        <Section title="Shared Objective (all tiers)" copyText={lesson.shared_objective}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.shared_objective}</p>
        </Section>
      )}

      {udl.length > 0 && (
        <Section title="UDL Supports" copyText={udl.map((u) => `${u.principle}: ${u.how}`).join('\n')}>
          <div className="space-y-2">
            {udl.map((u, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-2.5">
                <p className="text-xs font-semibold text-violet-400 mb-0.5">{u.principle}</p>
                <p className="text-sm text-ink-300">{u.how}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tiers.length > 0 && (
        <Section
          title="Access Tiers (one lesson, run together)"
          copyText={tiers.map((t) => `${t.tier_name} — ${t.who_it_serves}\nTarget: ${t.learning_target}\nTask: ${t.task}`).join('\n\n')}
        >
          <div className="space-y-3">
            {tiers.map((t, i) => (
              <div key={i} className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{t.tier_name}</p>
                </div>
                {t.who_it_serves && <p className="text-xs text-ink-500 mb-1.5 italic">{t.who_it_serves}</p>}
                {t.learning_target && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">Target: </span>{t.learning_target}</p>}
                {t.task && <p className="mt-1 text-sm text-ink-300"><span className="font-medium text-ink-200">Task: </span>{t.task}</p>}
                <ModalityList modalities={t.response_modalities} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {lesson.functional_tie_in && (
        <Section title="Functional / Life-Skills Tie-In" copyText={lesson.functional_tie_in}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.functional_tie_in}</p>
        </Section>
      )}

      <BulletSection title="Materials & Supports" items={lesson.materials_supports} />

      {lesson.running_it_together && (
        <Section title="Running All Tiers Together" copyText={lesson.running_it_together}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.running_it_together}</p>
        </Section>
      )}

      <StandardsBlock items={lesson.standards_alignment} />
      <SupportNote text={lesson.instructional_support_note} />
    </div>
  )
}

// ─── Mode 2: Secondary functional / life-skills ──────────────────────────────
function FunctionalPlan({ lesson }) {
  const seq = lesson.instructional_sequence ?? []
  return (
    <div className="card lesson-doc p-8 space-y-6">
      <PlanHeader
        badge="Special Education · Functional / Life Skills"
        gradeBands={lesson.grade_bands}
        title={lesson.title}
        subtitle={[lesson.skill_area, lesson.focus].filter(Boolean).join(' · ')}
      />

      {lesson.real_world_purpose && (
        <Section title="Real-World Purpose" copyText={lesson.real_world_purpose}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.real_world_purpose}</p>
        </Section>
      )}

      {lesson.functional_objective && (
        <Section title="Functional Objective" copyText={lesson.functional_objective}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.functional_objective}</p>
        </Section>
      )}

      {seq.length > 0 && (
        <Section title="Instructional Sequence" copyText={seq.map((s, i) => `${i + 1}. ${s.step}\n${s.what_students_do}`).join('\n\n')}>
          <ol className="space-y-2">
            {seq.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{s.step}</p>
                </div>
                <p className="text-sm text-ink-300">{s.what_students_do}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {lesson.community_or_vocational_extension && (
        <Section title="Community / Vocational Extension" copyText={lesson.community_or_vocational_extension}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.community_or_vocational_extension}</p>
        </Section>
      )}

      {lesson.generalization && (
        <Section title="Generalization to Real Settings" copyText={lesson.generalization}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.generalization}</p>
        </Section>
      )}

      <ModalitySection modalities={lesson.response_modalities} />
      <BulletSection title="Materials & Supports (age-appropriate)" items={lesson.materials_supports} />

      {lesson.age_respect_note && (
        <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3">
          <p className="text-xs font-semibold text-ink-300 mb-0.5">Age &amp; dignity</p>
          <p className="text-sm text-ink-300">{lesson.age_respect_note}</p>
        </div>
      )}

      {lesson.informal_check && (
        <Section title="Informal Check for Understanding" copyText={lesson.informal_check}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.informal_check}</p>
        </Section>
      )}

      <StandardsBlock items={lesson.standards_alignment} />
      <SupportNote text={lesson.instructional_support_note} />
    </div>
  )
}

// ─── Mode 3: Push-in / co-teaching ───────────────────────────────────────────
function CoTeachingPlan({ lesson }) {
  const models = lesson.co_teaching_models ?? []
  return (
    <div className="card lesson-doc p-8 space-y-6">
      <PlanHeader
        badge="Special Education · Push-In / Co-Teaching"
        gradeBands={lesson.grade_bands}
        title={lesson.title}
        subtitle={[lesson.content_area, lesson.gen_ed_topic].filter(Boolean).join(' · ')}
      />

      {lesson.quick_summary && (
        <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3">
          <p className="text-sm text-ink-200">{lesson.quick_summary}</p>
        </div>
      )}

      <BulletSection title="Universal Accommodations (plug-in, no lesson change)" items={lesson.universal_accommodations} />

      {models.length > 0 && (
        <Section
          title="By Co-Teaching Model (Friend)"
          copyText={models.map((m) => `${m.model}\nHow it works: ${m.how_this_topic_works}\nYour role: ${m.sped_teacher_role}`).join('\n\n')}
        >
          <div className="space-y-3">
            {models.map((m, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <p className="text-sm font-semibold text-ink-300 mb-1">{m.model}</p>
                {m.how_this_topic_works && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">How this topic works: </span>{m.how_this_topic_works}</p>}
                {m.sped_teacher_role && <p className="mt-1 text-sm text-ink-300"><span className="font-medium text-ink-200">Your role: </span>{m.sped_teacher_role}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <BulletSection title="Modifications (deeper changes, adapt per student)" items={lesson.modifications} />
      <ModalitySection modalities={lesson.response_modalities} />
      <BulletSection title="Quick Wins (walk-in-ready)" items={lesson.quick_wins} />

      <StandardsBlock items={lesson.standards_alignment} />
      <SupportNote text={lesson.instructional_support_note} />
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function PlanHeader({ badge, gradeBands, title, subtitle }) {
  const bands = gradeBands ?? []
  return (
    <header className="space-y-2 border-b border-ink-900 pb-4">
      <span className="label-eyebrow rounded px-2 py-0.5 bg-violet-500/15 text-ink-50">
        {badge}
        {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
      </span>
      <h2 className="lesson-title text-ink-50">{title}</h2>
      {subtitle && <p className="text-sm text-ink-400">{subtitle}</p>}
    </header>
  )
}

function ModalityList({ modalities }) {
  const list = modalities ?? []
  if (list.length === 0) return null
  return (
    <div className="mt-2 space-y-1 border-t border-violet-500/10 pt-2">
      <p className="text-xs font-semibold text-ink-400">Response options</p>
      {list.map((m, i) => (
        <p key={i} className="text-sm text-ink-300">
          <span className="font-medium text-ink-200">{m.modality}: </span>{m.how}
        </p>
      ))}
    </div>
  )
}

function ModalitySection({ modalities }) {
  const list = modalities ?? []
  if (list.length === 0) return null
  return (
    <Section title="Response Modalities" copyText={list.map((m) => `${m.modality}: ${m.how}`).join('\n')}>
      <div className="space-y-1.5">
        {list.map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-ink-300">
            <MessageSquare size={14} className="mt-0.5 shrink-0 text-violet-400" />
            <p><span className="font-medium text-ink-200">{m.modality}: </span>{m.how}</p>
          </div>
        ))}
      </div>
    </Section>
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

function StandardsBlock({ items }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section title="Standards Alignment" copyText={list.map((s) => `[${s.framework}] ${s.text}`).join('\n')}>
      <ul className="space-y-1.5 text-ink-300">
        {list.map((s, i) => (
          <li key={i} className="text-sm">
            <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
            <span className="ml-1">— {s.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function SupportNote({ text }) {
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-violet-400 transition-colors print:hidden"
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
