import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function AdaptivePERenderer({ lesson }) {
  if (!lesson) return null
  return lesson.mode === 'plan'
    ? <APELessonPlan lesson={lesson} />
    : <APEInclusionPlan lesson={lesson} />
}

// ─── Mode 2: Full APE Lesson Plan ────────────────────────────────────────────

function APELessonPlan({ lesson }) {
  const gradeBands = lesson.grade_bands ?? []

  const lessonFlowText = [
    `Warm-Up\n${lesson.warm_up ?? ''}`,
    `Skill Practice\n${lesson.skill_practice ?? ''}`,
    `Applied Activity\n${lesson.applied_activity ?? ''}`,
    `Cool-Down\n${lesson.cool_down ?? ''}`,
  ].join('\n\n')

  const equipmentText = [
    `Equipment:\n${(lesson.equipment_needed ?? []).map((e) => `- ${e}`).join('\n')}`,
    (lesson.equipment_adaptations ?? []).length
      ? `Adaptations:\n${(lesson.equipment_adaptations ?? []).map((e) => `- ${e}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n')

  const safetyText = (lesson.safety_considerations ?? []).map((s) => `- ${s}`).join('\n')

  const ell = lesson.ell_accommodations ?? null
  const ellText = ell ? [
    (ell.language_objectives ?? []).length ? `Language Objectives:\n${(ell.language_objectives ?? []).map(o => `- ${o}`).join('\n')}` : '',
    ell.tiered_vocabulary ? `Tiered Vocabulary:\nTier 1: ${(ell.tiered_vocabulary.tier_1 ?? []).join(', ')}\nTier 2: ${(ell.tiered_vocabulary.tier_2 ?? []).join(', ')}\nTier 3: ${(ell.tiered_vocabulary.tier_3 ?? []).join(', ')}` : '',
    (ell.sentence_frames ?? []).length ? `Sentence Frames:\n${(ell.sentence_frames ?? []).map(f => `- ${f}`).join('\n')}` : '',
    (ell.visual_supports ?? []).length ? `Visual Supports:\n${(ell.visual_supports ?? []).map(v => `- ${v}`).join('\n')}` : '',
    ell.simplified_instructions ? `Simplified Instructions:\n${ell.simplified_instructions}` : '',
  ].filter(Boolean).join('\n\n') : ''

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex items-center justify-between text-sm text-ink-400">
          <span>{lesson.scheduled_date ?? 'Unscheduled'}</span>
          <span>{lesson.period_label ?? ''}</span>
          <span className="label-eyebrow rounded px-2 py-0.5 bg-rose-500/15 text-ink-50">
            Adaptive PE
            {gradeBands.length > 0
              ? ` · Grade${gradeBands.length > 1 ? 's' : ''} ${gradeBands.map(formatGrade).join('/')}`
              : ''}
          </span>
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        {lesson.student_group_label && (
          <p className="text-sm text-ink-400">{lesson.student_group_label}</p>
        )}
      </header>

      {/* IEP Goals */}
      {(lesson.iep_goals ?? []).length > 0 && (
        <Section
          title="IEP Goals This Lesson Addresses"
          copyText={(lesson.iep_goals ?? []).map((g, i) => `${i + 1}. ${g}`).join('\n')}
        >
          <ol className="list-decimal list-inside space-y-1 text-ink-300">
            {(lesson.iep_goals ?? []).map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* Lesson Flow */}
      <Section title="Lesson Flow" copyText={lessonFlowText}>
        <InstructionBlock label="Warm-Up" text={lesson.warm_up} />
        <InstructionBlock label="Skill Practice" text={lesson.skill_practice} />
        <InstructionBlock label="Applied Activity" text={lesson.applied_activity} />
        <InstructionBlock label="Cool-Down" text={lesson.cool_down} />
      </Section>

      {/* Equipment */}
      <Section title="Equipment & Adaptations" copyText={equipmentText}>
        <div className="space-y-3">
          {(lesson.equipment_needed ?? []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Equipment needed</p>
              <ul className="list-disc list-inside space-y-1 text-ink-300">
                {(lesson.equipment_needed ?? []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {(lesson.equipment_adaptations ?? []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Equipment adaptations</p>
              <ul className="list-disc list-inside space-y-1 text-ink-300">
                {(lesson.equipment_adaptations ?? []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* Safety */}
      {(lesson.safety_considerations ?? []).length > 0 && (
        <Section title="Safety Considerations" copyText={safetyText}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.safety_considerations ?? []).map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Data Collection */}
      <Section
        title="Data Collection"
        copyText={`Method: ${lesson.data_collection_method ?? ''}\n\n${lesson.data_collection_notes ?? ''}`}
      >
        <div className="space-y-2 text-ink-300">
          <p>
            <span className="font-semibold text-ink-200">Method: </span>
            <span className="text-rose-400 font-medium">{lesson.data_collection_method}</span>
          </p>
          <p className="whitespace-pre-line">{lesson.data_collection_notes}</p>
        </div>
      </Section>

      {/* Progress Note Template */}
      {lesson.progress_notes_template && (
        <Section title="Progress Note Template" copyText={lesson.progress_notes_template}>
          <p className="text-ink-300 whitespace-pre-line italic">{lesson.progress_notes_template}</p>
        </Section>
      )}

      {/* IEP Language */}
      {lesson.suggested_iep_language && (
        <Section title="Suggested IEP Progress Note Language" copyText={lesson.suggested_iep_language}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.suggested_iep_language}</p>
        </Section>
      )}

      {/* ELL Accommodations */}
      {ell && (
        <Section title="ELL Accommodations" copyText={ellText}>
          <div className="space-y-4">
            {(ell.language_objectives ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-sky-400 mb-1">Language Objectives</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(ell.language_objectives ?? []).map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
            {ell.tiered_vocabulary && (
              <div>
                <p className="text-sm font-semibold text-sky-400 mb-1.5">Tiered Vocabulary</p>
                <div className="space-y-1 text-sm">
                  {['tier_1', 'tier_2', 'tier_3'].map((tier, ti) => {
                    const words = ell.tiered_vocabulary[tier] ?? []
                    return words.length ? (
                      <p key={tier}>
                        <span className="font-medium text-ink-200">Tier {ti + 1}: </span>
                        <span className="text-ink-400">{words.join(', ')}</span>
                      </p>
                    ) : null
                  })}
                </div>
              </div>
            )}
            {(ell.sentence_frames ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-sky-400 mb-1">Sentence Frames</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(ell.sentence_frames ?? []).map((frame, i) => (
                    <li key={i}>{frame}</li>
                  ))}
                </ul>
              </div>
            )}
            {(ell.visual_supports ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-sky-400 mb-1">Visual Supports</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(ell.visual_supports ?? []).map((vs, i) => (
                    <li key={i}>{vs}</li>
                  ))}
                </ul>
              </div>
            )}
            {ell.simplified_instructions && (
              <div>
                <p className="text-sm font-semibold text-sky-400 mb-1">Simplified Instructions</p>
                <p className="text-ink-300 italic">{ell.simplified_instructions}</p>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Mode 1: Inclusion & Accommodation Plan ───────────────────────────────────

function APEInclusionPlan({ lesson }) {
  const equipAlt = (lesson.equipment_adaptations ?? []).map((e) => `- ${e}`).join('\n')
  const positionText = (lesson.positioning_modifications ?? []).map((p) => `- ${p}`).join('\n')
  const participationText = (lesson.participation_options ?? []).map((p, i) => `Option ${i + 1}: ${p}`).join('\n\n')
  const dataText = `Method: ${lesson.data_collection_method ?? ''}\n\n${lesson.data_collection_notes ?? ''}`

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-rose-500/15 text-ink-50">
            Inclusion & Accommodation Plan
          </span>
        </div>
        <h2 className="text-xl font-display font-semibold text-ink-50">
          {lesson.current_activity || 'Accommodation Plan'}
        </h2>
        {lesson.iep_goal_category && (
          <p className="text-sm text-ink-400">
            IEP Goal Area: <span className="text-ink-200 font-medium">{lesson.iep_goal_category}</span>
          </p>
        )}
      </header>

      {/* Inclusion Strategy */}
      {lesson.inclusion_strategy && (
        <Section title="Inclusion Strategy" copyText={lesson.inclusion_strategy}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.inclusion_strategy}</p>
        </Section>
      )}

      {/* Equipment Adaptations */}
      {(lesson.equipment_adaptations ?? []).length > 0 && (
        <Section title="Equipment Adaptations" copyText={equipAlt}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.equipment_adaptations ?? []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Positioning */}
      {(lesson.positioning_modifications ?? []).length > 0 && (
        <Section title="Positioning & Environment" copyText={positionText}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.positioning_modifications ?? []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Participation Options */}
      {(lesson.participation_options ?? []).length > 0 && (
        <Section title="Participation Options" copyText={participationText}>
          <div className="space-y-3">
            {(lesson.participation_options ?? []).map((option, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <p className="text-xs font-semibold text-rose-400 mb-1">Option {i + 1}</p>
                <p className="text-ink-300 text-sm">{option}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Progress Documentation */}
      {lesson.progress_documentation && (
        <Section title="Progress Documentation" copyText={lesson.progress_documentation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.progress_documentation}</p>
        </Section>
      )}

      {/* Data Collection */}
      <Section title="Data Collection" copyText={dataText}>
        <div className="space-y-2 text-ink-300">
          <p>
            <span className="font-semibold text-ink-200">Method: </span>
            <span className="text-rose-400 font-medium">{lesson.data_collection_method}</span>
          </p>
          <p className="whitespace-pre-line">{lesson.data_collection_notes}</p>
        </div>
      </Section>

      {/* Para/Aide Note */}
      {lesson.para_communication_note && (
        <Section title="Para / Aide Communication Note" copyText={lesson.para_communication_note}>
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <p className="text-ink-300 whitespace-pre-line">{lesson.para_communication_note}</p>
          </div>
        </Section>
      )}

      {/* IEP Language */}
      {lesson.suggested_iep_language && (
        <Section title="Suggested IEP Progress Note Language" copyText={lesson.suggested_iep_language}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.suggested_iep_language}</p>
        </Section>
      )}
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

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
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-rose-400 transition-colors print:hidden"
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

function InstructionBlock({ label, text }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-ink-200">{label}</p>
      <p className="mt-0.5 text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}
