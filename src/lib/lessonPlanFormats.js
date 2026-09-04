export const LESSON_FORMAT_SECTIONS = [
  { key: 'standards', label: 'Standards', description: 'Applicable state or national standards' },
  { key: 'learning_targets', label: 'Learning targets', description: 'What students are expected to learn' },
  { key: 'success_criteria', label: 'Success criteria', description: 'What successful learning will look like' },
  { key: 'lesson_sequence', label: 'Lesson sequence', description: 'A clear, logically organized flow' },
  { key: 'instructional_practices', label: 'Instructional practices', description: 'School-approved practices evident in this lesson' },
  { key: 'mtss_tier_1', label: 'MTSS: Tier 1 supports', description: 'Whole-class supports planned from the start' },
  { key: 'mtss_tier_2', label: 'MTSS: Tier 2 evidence', description: 'Targeted need, grouping, strategy, or progress check when needed' },
  { key: 'evidence_of_learning', label: 'Evidence of learning', description: 'How learning will be checked and used for next steps' },
  { key: 'notes', label: 'Teacher notes', description: 'Vocabulary, safety, accommodations, and reminders' },
  { key: 'attachments', label: 'Attachments & resources', description: 'Materials, printables, equipment, and links' },
  { key: 'assignments', label: 'Assignments', description: 'Independent practice or follow-up work' },
  { key: 'assessments', label: 'Assessments', description: 'Checks, rubrics, quizzes, or exit tickets' },
]

export function normalizeMtssGoalNumber(value = '') {
  const match = String(value).trim().match(/^T([12])-\s*0*(\d+)$/i)
  return match ? `T${match[1]}-${String(Number(match[2])).padStart(3, '0')}` : String(value).trim().toUpperCase()
}

export function starterSections(kind = 'brief-review') {
  const core = new Set(['standards', 'learning_targets', 'success_criteria', 'lesson_sequence', 'mtss_tier_1', 'mtss_tier_2', 'evidence_of_learning'])
  return LESSON_FORMAT_SECTIONS.map((section) => ({
    ...section,
    enabled: kind === 'complete' || core.has(section.key),
    required: core.has(section.key),
  }))
}

export function starterFormat(kind = 'brief-review') {
  return {
    name: kind === 'complete' ? 'My detailed school format' : 'My brief school format',
    detail_level: kind === 'complete' ? 'detailed' : 'brief',
    sections: starterSections(kind),
    mtss_goal_bank: [],
    instructional_practice_bank: [],
    requirement_notes: '',
    is_default: true,
  }
}

export function parseMtssGoalBank(rawText = '') {
  const lines = String(rawText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const goals = []
  const duplicates = []
  const incomplete = []
  const seen = new Set()

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^T([12])-\s*0*(\d+)\s*(.*)$/i)
    if (!match) continue
    const tier = match[1] === '2' ? 'tier_2' : 'tier_1'
    const number = normalizeMtssGoalNumber(`T${match[1]}-${match[2]}`)
    let label = match[3].trim().replace(/^[-:\s]+/, '')
    if (!label && lines[index + 1] && !/^T[12]-/i.test(lines[index + 1])) {
      label = lines[index + 1]
      index += 1
    }
    if (seen.has(number)) {
      duplicates.push(number)
      continue
    }
    seen.add(number)
    if (!label || !/[.!?)]$/.test(label)) incomplete.push(number)
    goals.push({ tier, number, label })
  }

  return { goals, duplicates, incomplete: [...new Set(incomplete)] }
}
