import { useState } from 'react'
import { Copy, Check, Info, Layers, Target, TrendingUp, ClipboardList, ShieldAlert, Tag, Accessibility, Brain, Scale } from 'lucide-react'

const DOMAIN_LABEL = { Reading: 'Reading', Math: 'Math', Behavior: 'Behavior' }

export default function InterventionRenderer({ lesson }) {
  if (!lesson) return null

  const iv = lesson.intervention ?? {}
  const pm = lesson.progress_monitoring ?? {}
  const steps = iv.steps ?? []
  const standards = lesson.standards_alignment ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-stone-500/15 text-ink-50">
            Intervention Planning · MTSS/RTI
          </span>
          {lesson.domain && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-stone-500/20 text-ink-50">
              {DOMAIN_LABEL[lesson.domain] ?? lesson.domain}
            </span>
          )}
          {lesson.tier && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-ink-50">
              {lesson.tier}
            </span>
          )}
          {lesson.intervention_code?.code && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-ink-50">
              {lesson.intervention_code.code}{lesson.intervention_code.name ? ` · ${lesson.intervention_code.name}` : ''}
            </span>
          )}
          {lesson.grade_band && lesson.grade_band !== 'not specified' && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-300">
              Grade {lesson.grade_band}
            </span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
      </header>

      {/* Concern + targeted skill */}
      {lesson.concern_summary && (
        <div className="rounded-lg border border-stone-500/25 bg-stone-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Concern</p>
          <p className="text-sm text-ink-200">{lesson.concern_summary}</p>
        </div>
      )}

      {lesson.targeted_skill && (
        <Section title="Targeted Skill" icon={Target} copyText={lesson.targeted_skill}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.targeted_skill}</p>
        </Section>
      )}

      {/* Tier framing */}
      {(lesson.tier || lesson.tier_rationale) && (
        <Section title="Tier Framing" icon={Layers} copyText={`${lesson.tier ?? ''} — ${lesson.tier_rationale ?? ''}`}>
          <p className="text-ink-300">
            {lesson.tier && <span className="font-semibold text-ink-300">{lesson.tier}. </span>}
            {lesson.tier_rationale}
          </p>
        </Section>
      )}

      {lesson.framework_basis && (
        <Section title="Framework Basis" copyText={lesson.framework_basis}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.framework_basis}</p>
        </Section>
      )}

      {/* MTSS taxonomy categorization */}
      {(lesson.intervention_code?.code || (lesson.also_consider ?? []).length > 0) && (
        <Section
          title="MTSS Intervention Code"
          icon={Tag}
          copyText={[
            lesson.intervention_code?.code && `${lesson.intervention_code.code} — ${lesson.intervention_code.name ?? ''}${lesson.intervention_code.tier ? ` (${lesson.intervention_code.tier})` : ''}`,
            (lesson.also_consider ?? []).length ? `Also consider: ${(lesson.also_consider ?? []).map((c) => `${c.code} ${c.name}`).join('; ')}` : '',
          ].filter(Boolean).join('\n')}
        >
          {lesson.intervention_code?.code && (
            <p className="text-ink-300">
              <span className="font-semibold text-ink-100">{lesson.intervention_code.code}</span>
              {lesson.intervention_code.name ? ` — ${lesson.intervention_code.name}` : ''}
              {lesson.intervention_code.tier ? <span className="ml-1 text-xs text-ink-500">({lesson.intervention_code.tier})</span> : null}
            </p>
          )}
          {(lesson.also_consider ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-500">Also consider:</span>
              {lesson.also_consider.map((c, i) => (
                <span key={i} className="rounded bg-ink-900 px-1.5 py-0.5 text-xs text-ink-300">
                  {c.code} — {c.name}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* UDL alignment */}
      {lesson.udl_alignment && (lesson.udl_alignment.engagement || lesson.udl_alignment.representation || lesson.udl_alignment.action_expression) && (
        <Section
          title="UDL Alignment (CAST)"
          icon={Accessibility}
          copyText={[
            lesson.udl_alignment.engagement && `Engagement: ${lesson.udl_alignment.engagement}`,
            lesson.udl_alignment.representation && `Representation: ${lesson.udl_alignment.representation}`,
            lesson.udl_alignment.action_expression && `Action & Expression: ${lesson.udl_alignment.action_expression}`,
          ].filter(Boolean).join('\n')}
        >
          <dl className="space-y-2">
            <Field label="Engagement (the why)" value={lesson.udl_alignment.engagement} />
            <Field label="Representation (the what)" value={lesson.udl_alignment.representation} />
            <Field label="Action & Expression (the how)" value={lesson.udl_alignment.action_expression} />
          </dl>
        </Section>
      )}

      {/* Executive-function supports */}
      {(lesson.executive_function_supports ?? []).length > 0 && (
        <Section
          title="Executive-Function Supports"
          icon={Brain}
          copyText={(lesson.executive_function_supports ?? []).map((e) => `${e.skill}: ${e.support}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {lesson.executive_function_supports.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-ink-100">{e.skill}: </span>{e.support}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Intervention */}
      <Section
        title="Intervention"
        icon={ClipboardList}
        copyText={[
          iv.format && `Format: ${iv.format}`,
          iv.schedule && `Schedule: ${iv.schedule}`,
          (iv.materials ?? []).length ? `Materials: ${(iv.materials ?? []).join(', ')}` : '',
          steps.length ? `Steps:\n${steps.map((s, i) => `${i + 1}. ${s.step}: ${s.detail}`).join('\n')}` : '',
          iv.teacher_moves && `Teacher moves: ${iv.teacher_moves}`,
        ].filter(Boolean).join('\n')}
      >
        <dl className="space-y-2">
          <Field label="Format" value={iv.format} />
          <Field label="Schedule" value={iv.schedule} />
          {(iv.materials ?? []).length > 0 && (
            <div>
              <dt className="text-xs font-semibold text-ink-400">Materials</dt>
              <dd className="text-sm text-ink-300">{(iv.materials ?? []).join(', ')}</dd>
            </div>
          )}
        </dl>

        {steps.length > 0 && (
          <ol className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{s.step}</p>
                </div>
                <p className="text-sm text-ink-300">{s.detail}</p>
              </li>
            ))}
          </ol>
        )}

        {iv.teacher_moves && (
          <p className="mt-3 text-sm text-ink-300">
            <span className="font-semibold text-ink-300">Teacher moves: </span>{iv.teacher_moves}
          </p>
        )}
      </Section>

      {/* Progress monitoring */}
      {(pm.what_to_watch || pm.success_indicators || pm.simple_measure || pm.recheck_frequency || pm.decision_guidance) && (
        <Section
          title="Progress Monitoring"
          icon={TrendingUp}
          copyText={[
            pm.what_to_watch && `What to watch: ${pm.what_to_watch}`,
            pm.success_indicators && `Working when: ${pm.success_indicators}`,
            pm.simple_measure && `Simple measure: ${pm.simple_measure}`,
            pm.recheck_frequency && `Re-check: ${pm.recheck_frequency}`,
            pm.decision_guidance && `Decision guidance: ${pm.decision_guidance}`,
          ].filter(Boolean).join('\n')}
        >
          <dl className="space-y-2">
            <Field label="What to watch for" value={pm.what_to_watch} />
            <Field label="It's working when" value={pm.success_indicators} />
            <Field label="Simple measure" value={pm.simple_measure} />
            <Field label="How often to re-check" value={pm.recheck_frequency} />
            <Field label="If responding / not responding" value={pm.decision_guidance} />
          </dl>
        </Section>
      )}

      {/* Data-based decision rules */}
      {lesson.decision_rules && (lesson.decision_rules.goal_aimline || lesson.decision_rules.response_criteria || lesson.decision_rules.decision || lesson.decision_rules.measure) && (
        <Section
          title="Data-Based Decision Rules"
          icon={Scale}
          copyText={[
            lesson.decision_rules.goal_aimline && `Goal / aimline: ${lesson.decision_rules.goal_aimline}`,
            lesson.decision_rules.measure && `Measure: ${lesson.decision_rules.measure}`,
            lesson.decision_rules.schedule && `Data schedule: ${lesson.decision_rules.schedule}`,
            lesson.decision_rules.response_criteria && `Response criteria: ${lesson.decision_rules.response_criteria}`,
            lesson.decision_rules.decision && `Decision: ${lesson.decision_rules.decision}`,
          ].filter(Boolean).join('\n')}
        >
          <dl className="space-y-2">
            <Field label="Goal / aimline" value={lesson.decision_rules.goal_aimline} />
            <Field label="Progress measure" value={lesson.decision_rules.measure} />
            <Field label="Data-collection schedule" value={lesson.decision_rules.schedule} />
            <Field label="Response criteria (points vs. aimline / trend)" value={lesson.decision_rules.response_criteria} />
            <Field label="Decision" value={lesson.decision_rules.decision} />
          </dl>
        </Section>
      )}

      {/* Standards */}
      {standards.length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={standards.map((s) => `[${s.framework}] ${s.note}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {standards.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-stone-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">{s.note}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Documentation note */}
      {lesson.documentation_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 print:border-ink-300">
          <Info size={15} className="mt-0.5 shrink-0 text-ink-500" />
          <p className="text-xs text-ink-400"><span className="font-medium text-ink-300">For your records: </span>{lesson.documentation_note}</p>
        </div>
      )}

      {/* Disclaimer */}
      {lesson.disclaimer && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Important: </span>{lesson.disclaimer}</p>
        </div>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-400">{label}</dt>
      <dd className="text-sm text-ink-300 whitespace-pre-line">{value}</dd>
    </div>
  )
}

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
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400 flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-stone-400" />}
          {title}
        </h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-stone-400 transition-colors print:hidden"
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
