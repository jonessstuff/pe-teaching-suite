/**

 * Plan Book renderer — Renderer #1.
 *
 * Renders a LessonObject in the exact field order/structure used by
 * real district Plan Book exports. A single card spans multiple grade
 * bands; standards/learning targets/success criteria/differentiation
 * are grade-band-specific, while the lesson/instruction block is shared.
 *
 * This component performs NO AI calls — it is a pure template over
 * an existing LessonObject.
 *
 * @param {{ lesson: import("../../types/lessonObject").LessonObject & { scheduled_date?: string, period_label?: string } }} props
 */

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? "K" : String(g)
}

const SUBJECT_STYLES = {
  PE: 'bg-subject-pe/15 text-subject-pe',
  Health: 'bg-subject-health/15 text-subject-health',
  'Family Life': 'bg-subject-family/15 text-subject-family',
  "Driver's Ed": 'bg-subject-drivers/15 text-subject-drivers',
}

export default function PlanBookRenderer({ lesson }) {
  if (!lesson) return null

  const gradeBands = lesson.grade_bands ?? []
  const subjectStyle = SUBJECT_STYLES[lesson.subject] ?? 'bg-ink-700 text-ink-300'

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
    `Warm Up\n${lesson.warm_up ?? ''}`,
    `Fitness Activities\n${lesson.fitness_activities ?? ''}`,
    `Whole Group Lesson Instruction\n${lesson.whole_group_instruction ?? ''}`,
    `Independent Practice\n${lesson.independent_practice ?? ''}`,
    `Closure (Cool Down)\n${lesson.closure ?? ''}`,
  ].join('\n\n')

  const modificationsText = gradeBands
    .map((grade) => `Grade ${formatGrade(grade)}\n${lesson.modifications?.[grade] ?? ''}`)
    .join('\n\n')

  const materialsText = [
    `Equipment:\n${(lesson.equipment_needed ?? []).map((item) => `- ${item}`).join('\n')}`,
    `Location:\n${lesson.location ?? ''}`,
  ].join('\n\n')

  const vocabularyText = [
    `Words they should know: ${(lesson.known_vocabulary ?? []).join(', ')}`,
    `Words they will learn: ${(lesson.new_vocabulary ?? []).join(', ')}`,
  ].join('\n')

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
      {/* 1. Header */}
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <div className="flex items-center justify-between text-sm text-ink-400">
          <span>{lesson.scheduled_date ?? 'Unscheduled'}</span>
          <span>{lesson.period_label ?? ''}</span>
          <span className={`label-eyebrow rounded px-2 py-0.5 ${subjectStyle}`}>
            {lesson.subject}
            {gradeBands.length > 0 ? ` · Grades ${gradeBands.map(formatGrade).join('/')}` : ''}
          </span>
        </div>
        {/* 2. Lesson Title */}
        <h2 className="text-2xl font-display font-semibold text-ink-50">
          {lesson.title}
        </h2>
        {lesson.unit && <p className="text-sm text-ink-400">{lesson.unit}</p>}
      </header>

      {/* 3. Standards (per grade band) */}
      <Section title="Standards" copyText={standardsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`standards-${grade}`} grade={grade}>
            <ul className="list-disc list-inside space-y-1">
              {(lesson.standards ?? [])
                .filter((s) => s.grade === grade)
                .map((s, i) => (
                  <li key={i}>
                    <span className="font-semibold text-accent-400">{s.code}</span>
                    {' — '}
                    {s.text}
                  </li>
                ))}
            </ul>
          </GradeBandBlock>
        ))}
      </Section>

      {/* 4. Learning Target (Relevance) — per grade band */}
      <Section title="Learning Target (Relevance)" copyText={learningTargetsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`target-${grade}`} grade={grade}>
            {lesson.learning_targets?.[grade] ?? ''}
          </GradeBandBlock>
        ))}
      </Section>

      {/* 5. Success Criteria — per grade band, 3 bullets typical */}
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

      {/* 6. Lesson / Instruction (shared) */}
      <Section title="Lesson / Instruction" copyText={instructionText}>
        <InstructionBlock label="Warm Up" text={lesson.warm_up} />
        <InstructionBlock label="Fitness Activities" text={lesson.fitness_activities} />
        <InstructionBlock label="Whole Group Lesson Instruction" text={lesson.whole_group_instruction} />
        <InstructionBlock label="Independent Practice" text={lesson.independent_practice} />
        <InstructionBlock label="Closure (Cool Down)" text={lesson.closure} />
      </Section>

      {/* 7. Differentiation / Accommodations — per grade band */}
      <Section title="Differentiation / Accommodations" copyText={modificationsText}>
        {gradeBands.map((grade) => (
          <GradeBandBlock key={`mods-${grade}`} grade={grade}>
            {lesson.modifications?.[grade] ?? ''}
          </GradeBandBlock>
        ))}
      </Section>

      {/* 8. Materials / Resources / Technology */}
      <Section title="Materials / Resources / Technology" copyText={materialsText}>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-ink-200 mb-1">Equipment</p>
            <ul className="list-disc list-inside space-y-1 text-ink-300">
              {(lesson.equipment_needed ?? []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-200 mb-1">Location</p>
            <p className="text-ink-300">{lesson.location}</p>
          </div>
        </div>
      </Section>

      {/* 9. Vocabulary */}
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

      {/* 10. Suggested Videos — only rendered when present */}
      {(lesson.suggested_video_searches ?? []).length > 0 && (
        <Section title="Suggested Videos" copyText={(lesson.suggested_video_searches ?? []).join('\n')}>
          <ul className="space-y-2">
            {(lesson.suggested_video_searches ?? []).map((query, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-ink-500">▶</span>
                <span>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 hover:text-accent-300 underline underline-offset-2"
                  >
                    {query}
                  </a>
                </span>
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
        <h3 className="label-eyebrow text-ink-400">
          {title}
        </h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-accent-400 transition-colors print:hidden"
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
    <div className="phase-block mb-2">
      <p className="text-sm font-semibold text-ink-200">{label}</p>
      <p className="mt-0.5 text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}
