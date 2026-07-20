import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function LibraryPlanRenderer({ lesson }) {
  if (!lesson) return null

  const gradeBands = lesson.grade_bands ?? []

  const standardsText = gradeBands
    .map((grade) => {
      const lines = (lesson.standards ?? [])
        .filter((s) => s.grade === grade)
        .map((s) => `${s.code} — ${s.text}`)
        .join('\n')
      return `Grade ${formatGrade(grade)}\n${lines}`
    })
    .join('\n\n')

  const learningTargetsText = gradeBands
    .map((grade) => `Grade ${formatGrade(grade)}\n${lesson.learning_targets?.[grade] ?? ''}`)
    .join('\n\n')

  const successCriteriaText = gradeBands
    .map((grade) => {
      const bullets = (lesson.success_criteria?.[grade] ?? [])
        .map((b) => `- ${b}`)
        .join('\n')
      return `Grade ${formatGrade(grade)}: I know I have learned it when...\n${bullets}`
    })
    .join('\n\n')

  const instructionText = [
    `Connection / Hook\n${lesson.warm_up ?? ''}`,
    `Read-Aloud or Book Introduction\n${lesson.fitness_activities ?? ''}`,
    `Direct Instruction\n${lesson.whole_group_instruction ?? ''}`,
    `Practice Activity\n${lesson.independent_practice ?? ''}`,
    `Closure & Reflection\n${lesson.closure ?? ''}`,
  ].join('\n\n')

  const modificationsText = gradeBands
    .map((grade) => `Grade ${formatGrade(grade)}\n${lesson.modifications?.[grade] ?? ''}`)
    .join('\n\n')

  const materialsText = [
    `Materials & Resources:\n${(lesson.equipment_needed ?? []).map((item) => `- ${item}`).join('\n')}`,
    lesson.equipment_alternatives?.length
      ? `Alternatives:\n${(lesson.equipment_alternatives ?? []).map((item) => `- ${item}`).join('\n')}`
      : '',
    `Library Space Setup:\n${lesson.location ?? ''}`,
    lesson.setup_diagram ? `Room Notes:\n${lesson.setup_diagram}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const vocabularyText = [
    `Words they should know: ${(lesson.known_vocabulary ?? []).join(', ')}`,
    `Words they will learn: ${(lesson.new_vocabulary ?? []).join(', ')}`,
  ].join('\n')

  const routinesText = [
    ...(lesson.routines ?? []),
    ...(lesson.behavior_notes ?? []),
  ]
    .map((r) => `- ${r}`)
    .join('\n')

  const safetyText = (lesson.safety_notes ?? []).map((s) => `- ${s}`).join('\n')

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
          <span>{lesson.scheduled_date ?? 'Date TBD'}</span>
          <span>{lesson.period_label ?? ''}</span>
          <span className="label-eyebrow rounded px-2 py-0.5 bg-blue-500/15 text-blue-400">
            Library/Media
            {gradeBands.length > 0
              ? ` · Grade${gradeBands.length > 1 ? 's' : ''} ${gradeBands.map(formatGrade).join('/')}`
              : ''}
          </span>
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        {lesson.unit && <p className="text-sm text-ink-400">{lesson.unit}</p>}
        {(lesson.skill_focus ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(lesson.skill_focus ?? []).map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-ink-800 px-2.5 py-0.5 text-xs text-ink-300"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Standards */}
      <Section title="Standards" copyText={standardsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`standards-${grade}`} grade={grade}>
            <ul className="list-disc list-inside space-y-1">
              {(lesson.standards ?? [])
                .filter((s) => s.grade === grade)
                .map((s, i) => (
                  <li key={i}>
                    <span className="font-semibold text-blue-400">{s.code}</span>
                    {' — '}
                    {s.text}
                  </li>
                ))}
            </ul>
          </GradeBandBlock>
        ))}
      </Section>

      {/* Learning Target */}
      <Section title="Learning Target" copyText={learningTargetsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`target-${grade}`} grade={grade}>
            {lesson.learning_targets?.[grade] ?? ''}
          </GradeBandBlock>
        ))}
      </Section>

      {/* Success Criteria */}
      <Section title="Success Criteria" copyText={successCriteriaText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock
            key={`success-${grade}`}
            grade={grade}
            subtitle="I know I have learned it when..."
          >
            <ul className="list-disc list-inside space-y-1">
              {(lesson.success_criteria?.[grade] ?? []).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </GradeBandBlock>
        ))}
      </Section>

      {/* Lesson Flow */}
      <Section title="Lesson Flow" copyText={instructionText}>
        <InstructionBlock label="Connection / Hook" text={lesson.warm_up} />
        <InstructionBlock
          label="Read-Aloud or Book Introduction"
          text={lesson.fitness_activities}
        />
        <InstructionBlock label="Direct Instruction" text={lesson.whole_group_instruction} />
        <InstructionBlock label="Practice Activity" text={lesson.independent_practice} />
        <InstructionBlock label="Closure & Reflection" text={lesson.closure} />
      </Section>

      {/* Differentiation */}
      <Section title="Differentiation / Accommodations" copyText={modificationsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`mods-${grade}`} grade={grade}>
            {lesson.modifications?.[grade] ?? ''}
          </GradeBandBlock>
        ))}
      </Section>

      {/* Materials */}
      <Section title="Materials & Resources" copyText={materialsText}>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-ink-200 mb-1">Materials & Resources</p>
            <ul className="list-disc list-inside space-y-1 text-ink-300">
              {(lesson.equipment_needed ?? []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          {(lesson.equipment_alternatives ?? []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Lower-tech alternatives</p>
              <ul className="list-disc list-inside space-y-1 text-ink-300">
                {(lesson.equipment_alternatives ?? []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-ink-200 mb-1">Library Space Setup</p>
            <p className="text-ink-300">{lesson.location}</p>
            {lesson.setup_diagram && (
              <p className="mt-1 text-ink-400 text-xs italic">{lesson.setup_diagram}</p>
            )}
          </div>
        </div>
      </Section>

      {/* Vocabulary */}
      <Section title="Vocabulary" copyText={vocabularyText}>
        <div className="space-y-2 text-ink-300">
          <p>
            <span className="font-semibold text-ink-200">Words they should know: </span>
            {(lesson.known_vocabulary ?? []).join(', ')}
          </p>
          <p>
            <span className="font-semibold text-ink-200">Words they will learn: </span>
            {(lesson.new_vocabulary ?? []).join(', ')}
          </p>
        </div>
      </Section>

      {/* Routines & Procedures */}
      {([...(lesson.routines ?? []), ...(lesson.behavior_notes ?? [])]).length > 0 && (
        <Section title="Library Routines & Procedures" copyText={routinesText}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {[...(lesson.routines ?? []), ...(lesson.behavior_notes ?? [])].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Digital Safety */}
      {(lesson.safety_notes ?? []).length > 0 && (
        <Section title="Information Literacy & Digital Safety" copyText={safetyText}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.safety_notes ?? []).map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
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

      {/* Suggested Videos */}
      {(lesson.suggested_video_searches ?? []).length > 0 && (
        <Section
          title="Suggested Videos"
          copyText={(lesson.suggested_video_searches ?? []).join('\n')}
        >
          <ul className="space-y-2">
            {(lesson.suggested_video_searches ?? []).map((query, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-ink-500">▶</span>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  {query}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
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
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-blue-400 transition-colors print:hidden"
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

function GradeBandBlock({ grade, subtitle, children }) {
  return (
    <div className="mb-2">
      <p className="font-semibold text-ink-50">
        Grade {formatGrade(grade)}
        {subtitle ? `: ${subtitle}` : ''}
      </p>
      <div className="mt-0.5 whitespace-pre-line">{children}</div>
    </div>
  )
}

function InstructionBlock({ label, text }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-semibold text-ink-200">{label}</p>
      <p className="mt-0.5 text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}
