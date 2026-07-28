import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const PHASE_LABELS = {
  hospitality: ['Industry Hook', 'Direct Instruction', 'Skill Demonstration', 'Hands-On Service Application', 'Debrief & Industry Connection'],
  finance:     ['Financial Bell-Ringer', 'Concept Instruction', 'Guided Worked Example', 'Applied Finance Task', 'Reflection & Real-World Connection'],
  marketing:   ['Marketing Hook', 'Concept Instruction', 'Example Analysis', 'Applied Marketing Task', 'Present & Debrief'],
  human_services: ['Real-Life Hook', 'Concept Instruction', 'Skill Demonstration', 'Hands-On Application', 'Reflection & Life/Career Connection'],
  health_science: ['Clinical Hook', 'Concept Instruction', 'Skill Demonstration', 'Hands-On Clinical Application', 'Reflection & Career Connection'],
  education: ['Classroom Scenario Hook', 'Concept Instruction', 'Teaching Skill Demonstration', 'Hands-On Teaching Application', 'Reflection & Profession Connection'],
  career_readiness: ['Career Hook', 'Direct Instruction', 'Skill Model / Guided Practice', 'Hands-On Career Application', 'Reflection & Next-Steps Connection'],
  information_technology: ['Tech Hook', 'Concept Instruction', 'Guided Build / Demonstration', 'Hands-On Build', 'Reflection & Career Connection'],
  transportation: ['Shop Hook', 'Concept Instruction', 'Skill Demonstration', 'Hands-On Shop Application', 'Reflection & Career Connection'],
  manufacturing: ['Shop-Floor Hook', 'Concept Instruction', 'Skill Demonstration', 'Hands-On Production Application', 'Reflection & Career Connection'],
  engineering_tech: ['Engineering Challenge Hook', 'Concept Instruction', 'Guided Design / Build Demonstration', 'Hands-On Engineering Application', 'Reflection & Career Connection'],
  business_mgmt: ['Business Hook', 'Concept Instruction', 'Applied Example / Guided Practice', 'Hands-On Business Application', 'Reflection & Career Connection'],
  agriculture: ['Ag Hook', 'Concept Instruction', 'Skill Demonstration', 'Hands-On Ag Application', 'Reflection & Career Connection'],
  construction: ['Jobsite Hook', 'Concept Instruction', 'Skill Demonstration', 'Hands-On Construction Application', 'Reflection & Career Connection'],
  arts_av: ['Creative Hook', 'Concept Instruction', 'Guided Create / Demonstration', 'Hands-On Production', 'Reflection & Career Connection'],
  government: ['Civic Hook', 'Concept Instruction', 'Applied Example / Guided Practice', 'Hands-On Civic Application', 'Reflection & Career Connection'],
  law_safety: ['Case / Scenario Hook', 'Concept Instruction', 'Applied Example / Guided Practice', 'Hands-On Exploration Application', 'Reflection & Career Connection'],
  cosmetology: ['Client / Scenario Hook', 'Concept Instruction', 'Skill Demonstration', 'Hands-On Application (Supervised)', 'Reflection & Career / Licensing Connection'],
  business_law: ['Case / Scenario Hook', 'Concept Instruction', 'Applied Example / Guided Practice', 'Hands-On Case Analysis', 'Reflection & Career Connection'],
  sports_entertainment: ['Industry Hook', 'Concept Instruction', 'Applied Example / Guided Practice', 'Hands-On Marketing Application', 'Reflection & Career Connection'],
  exercise_science: ['Scenario Hook', 'Concept Instruction', 'Skill Demonstration / Guided Practice', 'Hands-On Application (Supervised)', 'Reflection & Career Connection'],
}

const PATHWAY_LABELS = {
  hospitality: 'Hospitality & Tourism',
  finance:     'Finance',
  marketing:   'Marketing',
  human_services: 'Human Services / Family & Consumer Sciences',
  health_science: 'Health Science',
  education: 'Education & Training',
  career_readiness: 'Career Readiness',
  information_technology: 'Information Technology',
  transportation: 'Transportation, Distribution & Logistics',
  manufacturing: 'Manufacturing',
  engineering_tech: 'STEM / Engineering & Technology',
  business_mgmt: 'Business Management & Administration',
  agriculture: 'Agriculture, Food & Natural Resources',
  construction: 'Architecture & Construction',
  arts_av: 'Arts, A/V Technology & Communications',
  government: 'Government & Public Administration',
  law_safety: 'Law, Public Safety, Corrections & Security',
  cosmetology: 'Cosmetology / Personal Care Services',
  business_law: 'Business Law',
  sports_entertainment: 'Sports & Entertainment Marketing',
  exercise_science: 'Exercise Science / Sports Medicine',
}

const LEVEL_LABELS = {
  introductory: 'Introductory',
  concentrator: 'Concentrator',
  completer:    'Completer',
}

function tierLabel(lesson) {
  if (lesson.tier_label) return lesson.tier_label
  if (lesson.tier === 'ms') return 'Middle School (Exploratory)'
  return `High School (Pathway) — ${LEVEL_LABELS[lesson.level] ?? 'Introductory'}`
}

export default function CtePlanRenderer({ lesson }) {
  if (!lesson) return null

  const pathway = lesson.pathway ?? 'hospitality'
  const phaseLabels = PHASE_LABELS[pathway] ?? PHASE_LABELS.hospitality
  const pathwayLabel = lesson.pathway_label ?? PATHWAY_LABELS[pathway] ?? 'CTE'

  const competencies = lesson.competencies ?? []
  const competenciesText = competencies
    .map((c) => `${c.code ? `${c.code} ` : ''}(${c.framework}) — ${c.text}`)
    .join('\n')

  const successCriteriaText = (lesson.success_criteria ?? []).map((b) => `- ${b}`).join('\n')

  const instructionText = [
    `${phaseLabels[0]}\n${lesson.warm_up ?? ''}`,
    `${phaseLabels[1]}\n${lesson.whole_group_instruction ?? ''}`,
    `${phaseLabels[2]}\n${lesson.fitness_activities ?? ''}`,
    `${phaseLabels[3]}\n${lesson.independent_practice ?? ''}`,
    `${phaseLabels[4]}\n${lesson.closure ?? ''}`,
  ].join('\n\n')

  const materialsText = [
    `Equipment / materials:\n${(lesson.equipment_needed ?? []).map((item) => `- ${item}`).join('\n')}`,
    (lesson.equipment_alternatives ?? []).length
      ? `Alternatives:\n${(lesson.equipment_alternatives ?? []).map((item) => `- ${item}`).join('\n')}`
      : '',
    `Room / Lab Setup:\n${lesson.location ?? ''}`,
    lesson.setup_diagram ? `Layout Notes:\n${lesson.setup_diagram}` : '',
  ].filter(Boolean).join('\n\n')

  const toolsText = (lesson.tools_and_platforms ?? []).map((t) => `- ${t}`).join('\n')
  const vocabularyText = [
    `Words they should know: ${(lesson.known_vocabulary ?? []).join(', ')}`,
    `Words they will learn: ${(lesson.new_vocabulary ?? []).join(', ')}`,
  ].join('\n')
  const safetyText = (lesson.safety_notes ?? []).map((s) => `- ${s}`).join('\n')

  const wbl = lesson.work_based_learning ?? null
  const wblText = wbl ? [
    (wbl.internships ?? []).length ? `Internships / Practicums:\n${(wbl.internships ?? []).map((i) => `- ${i}`).join('\n')}` : '',
    (wbl.guest_speakers ?? []).length ? `Guest Speakers:\n${(wbl.guest_speakers ?? []).map((g) => `- ${g}`).join('\n')}` : '',
    (wbl.job_shadows ?? []).length ? `Job Shadows:\n${(wbl.job_shadows ?? []).map((j) => `- ${j}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n') : ''

  const pathwayCtx = lesson.career_pathway_context ?? null
  const pathwaySeq = pathwayCtx?.sequence ?? []
  const pathwayCtxText = pathwayCtx ? [
    pathwaySeq.map((s) => `${s.is_current ? '▶ ' : '  '}${LEVEL_LABELS[s.level] ?? s.level}: ${s.course}${s.description ? ` — ${s.description}` : ''}`).join('\n'),
    pathwayCtx.note ? `\nWhere this leads: ${pathwayCtx.note}` : '',
  ].filter(Boolean).join('\n') : ''

  const ell = lesson.ell_accommodations ?? null
  const ellText = ell ? [
    (ell.language_objectives ?? []).length ? `Language Objectives:\n${(ell.language_objectives ?? []).map((o) => `- ${o}`).join('\n')}` : '',
    ell.tiered_vocabulary ? `Tiered Vocabulary:\nTier 1: ${(ell.tiered_vocabulary.tier_1 ?? []).join(', ')}\nTier 2: ${(ell.tiered_vocabulary.tier_2 ?? []).join(', ')}\nTier 3: ${(ell.tiered_vocabulary.tier_3 ?? []).join(', ')}` : '',
    (ell.sentence_frames ?? []).length ? `Sentence Frames:\n${(ell.sentence_frames ?? []).map((f) => `- ${f}`).join('\n')}` : '',
    (ell.visual_supports ?? []).length ? `Visual Supports:\n${(ell.visual_supports ?? []).map((v) => `- ${v}`).join('\n')}` : '',
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
              <span className="label-eyebrow rounded px-2 py-0.5 bg-pink-500/20 text-ink-50">
                {lesson.stage_label}
              </span>
            )}
            <span className="label-eyebrow rounded px-2 py-0.5 bg-pink-500/20 text-ink-50">
              {pathwayLabel}
            </span>
            <span className="label-eyebrow rounded px-2 py-0.5 bg-pink-500/20 text-ink-50">
              CTE · {tierLabel(lesson)}
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

      {/* Career Pathway context */}
      {pathwaySeq.length > 0 && (
        <Section title="Career Pathway" copyText={pathwayCtxText}>
          <div className="rounded-xl border border-pink-500/25 bg-pink-500/5 p-4 space-y-2">
            <p className="text-xs text-ink-500">Where this lesson sits in the {pathwayLabel} course sequence:</p>
            <ol className="space-y-2">
              {pathwaySeq.map((s, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
                    s.is_current ? 'bg-pink-500/20 ring-1 ring-pink-400/40' : 'bg-ink-900'
                  }`}
                >
                  <span className={`mt-0.5 text-xs font-semibold ${s.is_current ? 'text-ink-50' : 'text-ink-500'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${s.is_current ? 'text-ink-50' : 'text-ink-300'}`}>
                      {LEVEL_LABELS[s.level] ?? s.level}: {s.course}
                      {s.is_current && <span className="ml-2 text-xs font-normal text-ink-300">(this lesson)</span>}
                    </p>
                    {s.description && <p className="mt-0.5 text-xs text-ink-500">{s.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
            {pathwayCtx.note && (
              <p className="pt-1 text-sm text-ink-300">
                <span className="font-semibold text-pink-400">Where this leads: </span>
                {pathwayCtx.note}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Teacher Prep */}
      {lesson.teacher_prep && (
        <Section title="Teacher Prep" copyText={lesson.teacher_prep}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.teacher_prep}</p>
        </Section>
      )}

      {/* Competencies */}
      <Section title="Competencies & Tasks" copyText={competenciesText}>
        {competencies.length === 0 ? (
          <p className="text-ink-500 text-sm italic">No competencies listed.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {competencies.map((c, i) => (
              <li key={i}>
                {c.code && <span className="font-semibold text-pink-400">{c.code}</span>}
                {c.framework && (
                  <span className={`${c.code ? 'ml-1 ' : ''}text-xs text-ink-500`}>({c.framework})</span>
                )}
                {' — '}
                {c.text}
              </li>
            ))}
          </ul>
        )}
        {(lesson.credential_focus ?? []).length > 0 && (
          <div className="mt-3 rounded-lg border border-pink-500/20 bg-pink-500/5 p-3">
            <p className="text-xs font-semibold text-ink-100 mb-1">Industry credentials this pathway builds toward</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-ink-400">
              {(lesson.credential_focus ?? []).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-2 text-xs text-ink-600 italic">
          CTE competency numbering and credential alignment vary by state and course — verify against your state&rsquo;s CTE framework.
        </p>
      </Section>

      {/* Learning Target */}
      {lesson.learning_target && (
        <Section title="Learning Target" copyText={lesson.learning_target}>
          <p className="text-ink-200 whitespace-pre-line">{lesson.learning_target}</p>
        </Section>
      )}

      {/* Success Criteria */}
      <Section title="Success Criteria" copyText={successCriteriaText}>
        <p className="font-semibold text-ink-50 mb-1">I know I have learned it when…</p>
        <ul className="list-disc list-inside space-y-1 text-ink-300">
          {(lesson.success_criteria ?? []).map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </Section>

      {/* Lesson Flow */}
      <Section title="Lesson Flow" copyText={instructionText}>
        <InstructionBlock label={phaseLabels[0]} text={lesson.warm_up} />
        <InstructionBlock label={phaseLabels[1]} text={lesson.whole_group_instruction} />
        <InstructionBlock label={phaseLabels[2]} text={lesson.fitness_activities} />
        <InstructionBlock label={phaseLabels[3]} text={lesson.independent_practice} />
        <InstructionBlock label={phaseLabels[4]} text={lesson.closure} />
      </Section>

      {/* Work-Based Learning */}
      {wbl && (
        (wbl.internships ?? []).length + (wbl.guest_speakers ?? []).length + (wbl.job_shadows ?? []).length > 0
      ) && (
        <Section title="Work-Based Learning" copyText={wblText}>
          <div className="space-y-4">
            {(wbl.internships ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-pink-400 mb-1">Internships & Practicums</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(wbl.internships ?? []).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {(wbl.guest_speakers ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-pink-400 mb-1">Guest Speakers</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(wbl.guest_speakers ?? []).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {(wbl.job_shadows ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-pink-400 mb-1">Job Shadows</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(wbl.job_shadows ?? []).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Differentiation */}
      {lesson.modifications && (
        <Section title="Differentiation / Accommodations" copyText={lesson.modifications}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.modifications}</p>
        </Section>
      )}

      {/* Materials & Setup */}
      <Section title="Equipment & Setup" copyText={materialsText}>
        <div className="space-y-3">
          {(lesson.equipment_needed ?? []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Equipment / materials needed</p>
              <ul className="list-disc list-inside space-y-1 text-ink-300">
                {(lesson.equipment_needed ?? []).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
          {(lesson.equipment_alternatives ?? []).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Lower-supply alternatives</p>
              <ul className="list-disc list-inside space-y-1 text-ink-300">
                {(lesson.equipment_alternatives ?? []).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
          {lesson.location && (
            <div>
              <p className="text-sm font-semibold text-ink-200 mb-1">Room / Lab Setup</p>
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
            {(lesson.tools_and_platforms ?? []).map((tool, i) => <li key={i}>{tool}</li>)}
          </ul>
        </Section>
      )}

      {/* Safety Notes */}
      {(lesson.safety_notes ?? []).length > 0 && (
        <Section title="Safety Notes" copyText={safetyText}>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.safety_notes ?? []).map((note, i) => <li key={i}>{note}</li>)}
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

      {/* ELL Accommodations */}
      {ell && (
        <Section title="ELL Accommodations" copyText={ellText}>
          <div className="space-y-4">
            {(ell.language_objectives ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-sky-400 mb-1">Language Objectives</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(ell.language_objectives ?? []).map((obj, i) => <li key={i}>{obj}</li>)}
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
                  {(ell.sentence_frames ?? []).map((frame, i) => <li key={i}>{frame}</li>)}
                </ul>
              </div>
            )}
            {(ell.visual_supports ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-sky-400 mb-1">Visual Supports</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(ell.visual_supports ?? []).map((vs, i) => <li key={i}>{vs}</li>)}
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
                  className="text-pink-400 hover:text-ink-300 underline underline-offset-2"
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-pink-400 transition-colors print:hidden"
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
    <div className="phase-block mb-4">
      <p className="text-sm font-semibold text-ink-200">{label}</p>
      <p className="mt-0.5 text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}
