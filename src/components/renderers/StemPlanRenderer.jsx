import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import Tier1SupportsBlock from './Tier1SupportsBlock'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

const PHASE_LABELS = {
  engineering: ['Challenge Introduction', 'Research & Brainstorm', 'Design', 'Build & Test', 'Share & Reflect'],
  coding:      ['Concept Introduction', 'Unplugged Activity', 'Guided Coding', 'Independent Practice', 'Debug & Share'],
  science:     ['Question & Hypothesis', 'Materials & Procedure', 'Investigation', 'Data & Observations', 'Conclusions'],
  maker:       ['Inspiration', 'Materials Exploration', 'Free Create', 'Refine', 'Gallery Share'],
}

const FOCUS_LABELS = {
  engineering: 'Engineering Design',
  coding:      'Coding & CT',
  science:     'Science Investigation',
  maker:       'Maker & Tinkering',
}

export default function StemPlanRenderer({ lesson }) {
  if (!lesson) return null

  const gradeBands = lesson.grade_bands ?? []
  const focusArea = lesson.focus_area ?? 'engineering'
  const phaseLabels = PHASE_LABELS[focusArea] ?? PHASE_LABELS.engineering
  const focusLabel = FOCUS_LABELS[focusArea] ?? 'STEM'

  const standardsText = gradeBands
    .map((grade) => {
      const lines = (lesson.standards ?? [])
        .filter((s) => s.grade === grade)
        .map((s) => `${s.code} (${s.framework}) — ${s.text}`)
        .join('\n')
      return `Grade ${formatGrade(grade)}\n${lines}`
    })
    .join('\n\n')

  const learningTargetsText = gradeBands
    .map((grade) => `Grade ${formatGrade(grade)}\n${lesson.learning_targets?.[grade] ?? ''}`)
    .join('\n\n')

  const successCriteriaText = gradeBands
    .map((grade) => {
      const bullets = (lesson.success_criteria?.[grade] ?? []).map((b) => `- ${b}`).join('\n')
      return `Grade ${formatGrade(grade)}: I know I have learned it when...\n${bullets}`
    })
    .join('\n\n')

  const instructionText = [
    lesson.warm_up && `${phaseLabels[0]}\n${lesson.warm_up}`,
    `${phaseLabels[1]}\n${lesson.whole_group_instruction ?? ''}`,
    `${phaseLabels[2]}\n${lesson.fitness_activities ?? ''}`,
    `${phaseLabels[3]}\n${lesson.independent_practice ?? ''}`,
    lesson.closure && `${phaseLabels[4]}\n${lesson.closure}`,
  ].filter(Boolean).join('\n\n')

  const modificationsText = gradeBands
    .map((grade) => `Grade ${formatGrade(grade)}\n${lesson.modifications?.[grade] ?? ''}`)
    .join('\n\n')

  const materialsText = [
    `Materials:\n${(lesson.equipment_needed ?? []).map((item) => `- ${item}`).join('\n')}`,
    (lesson.equipment_alternatives ?? []).length
      ? `Alternatives:\n${(lesson.equipment_alternatives ?? []).map((item) => `- ${item}`).join('\n')}`
      : '',
    `Room Setup:\n${lesson.location ?? ''}`,
    lesson.setup_diagram ? `Layout Notes:\n${lesson.setup_diagram}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const toolsText = (lesson.tools_and_platforms ?? []).map((t) => `- ${t}`).join('\n')
  const vocabularyText = [
    `Words they should know: ${(lesson.known_vocabulary ?? []).join(', ')}`,
    `Words they will learn: ${(lesson.new_vocabulary ?? []).join(', ')}`,
  ].join('\n')
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
        <div className="flex items-center justify-between text-sm text-ink-400 flex-wrap gap-2">
          <span>{lesson.scheduled_date ?? 'Unscheduled'}</span>
          <span>{lesson.period_label ?? ''}</span>
          <div className="flex items-center gap-2 flex-wrap">
            {lesson.stage_label && (
              <span className="label-eyebrow rounded px-2 py-0.5 bg-cyan-500/15 text-ink-50">
                {lesson.stage_label}
              </span>
            )}
            <span className="label-eyebrow rounded px-2 py-0.5 bg-cyan-500/15 text-ink-50">
              {focusLabel}
            </span>
            <span className="label-eyebrow rounded px-2 py-0.5 bg-cyan-500/15 text-ink-50">
              STEM
              {gradeBands.length > 0
                ? ` · Grade${gradeBands.length > 1 ? 's' : ''} ${gradeBands.map(formatGrade).join('/')}`
                : ''}
            </span>
          </div>
        </div>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        {lesson.unit && <p className="text-sm text-ink-400">{lesson.unit}</p>}
        {(lesson.skill_focus ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(lesson.skill_focus ?? []).map((s, i) => (
              <span key={i} className="rounded-full bg-ink-800 px-2.5 py-0.5 text-xs text-ink-300">
                {s}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Teacher Prep */}
      {lesson.teacher_prep && (
        <Section title="Teacher Prep" copyText={lesson.teacher_prep}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.teacher_prep}</p>
        </Section>
      )}

      {/* Standards */}
      <Section title="Standards" copyText={standardsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`standards-${grade}`} grade={grade}>
            <ul className="list-disc list-inside space-y-1">
              {(lesson.standards ?? [])
                .filter((s) => s.grade === grade)
                .map((s, i) => (
                  <li key={i}>
                    <span className="font-semibold text-cyan-400">{s.code}</span>
                    {s.framework && (
                      <span className="ml-1 text-xs text-ink-500">({s.framework})</span>
                    )}
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
        <InstructionBlock label={phaseLabels[0]} text={lesson.warm_up} />
        <InstructionBlock label={phaseLabels[1]} text={lesson.whole_group_instruction} />
        <InstructionBlock label={phaseLabels[2]} text={lesson.fitness_activities} />
        <InstructionBlock label={phaseLabels[3]} text={lesson.independent_practice} />
        <InstructionBlock label={phaseLabels[4]} text={lesson.closure} />
      </Section>

      {/* Differentiation */}
      <Section title="Differentiation / Accommodations" copyText={modificationsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`mods-${grade}`} grade={grade}>
            {lesson.modifications?.[grade] ?? ''}
          </GradeBandBlock>
        ))}
      </Section>

      {/* Materials & Setup */}
      <Section title="Materials & Setup" copyText={materialsText}>
        <div className="space-y-3">
          {(lesson.equipment_needed ?? []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Materials needed</p>
              <ul className="list-disc list-inside space-y-1 text-ink-300">
                {(lesson.equipment_needed ?? []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {(lesson.equipment_alternatives ?? []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Lower-supply alternatives</p>
              <ul className="list-disc list-inside space-y-1 text-ink-300">
                {(lesson.equipment_alternatives ?? []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {lesson.location && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Room Setup</p>
              <p className="text-ink-300">{lesson.location}</p>
              {lesson.setup_diagram && (
                <p className="mt-1 text-ink-400 text-xs italic">{lesson.setup_diagram}</p>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Tools & Platforms */}
      {(lesson.tools_and_platforms ?? []).length > 0 && (
        <Section title="Tools, Apps & Platforms" copyText={toolsText}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.tools_and_platforms ?? []).map((tool, i) => (
              <li key={i}>{tool}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Safety Notes */}
      {(lesson.safety_notes ?? []).length > 0 && (
        <Section title="Safety Notes" copyText={safetyText}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.safety_notes ?? []).map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </Section>
      )}

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

      <Tier1SupportsBlock supports={lesson.tier1_udl_ef} />

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
          title="Suggested Videos & Resources"
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
                  className="text-cyan-400 hover:text-ink-300 underline underline-offset-2"
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-cyan-400 transition-colors print:hidden"
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
  // Hide a section with no content — e.g. warm_up/closure in Core Activity Only mode.
  if (!text || !String(text).trim()) return null
  return (
    <div className="phase-block mb-4">
      <p className="text-sm font-semibold text-ink-200">{label}</p>
      <p className="mt-0.5 text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}
