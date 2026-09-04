const PHASES = [
  ['Warm-up / opening', ['warm_up', 'opening', 'hook', 'anticipatory_set', 'circle_time', 'introduction']],
  ['Teach / model', ['whole_group_instruction', 'direct_instruction', 'mini_lesson', 'explicit_instruction', 'modeling', 'teacher_modeling', 'lesson_content']],
  ['Practice / apply', ['fitness_activities', 'guided_practice', 'independent_practice', 'main_activity', 'activity_sequence', 'session_activities', 'activities', 'learning_centers', 'centers', 'group_activity']],
  ['Closure / evidence', ['closure', 'cool_down', 'reflection', 'debrief', 'exit_prompt', 'exit_ticket', 'wrap_up']],
]

function flatten(value, depth = 0) {
  if (value == null || value === false || depth > 4) return []
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).replace(/\s+/g, ' ').trim()
    return text ? [text] : []
  }
  if (Array.isArray(value)) return value.flatMap((item) => flatten(item, depth + 1))
  if (typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => {
    const lines = flatten(item, depth + 1)
    if (!lines.length) return []
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    return lines.map((line) => depth > 0 ? `${label}: ${line}` : line)
  })
  return []
}

function values(lo, fields) {
  return fields.flatMap((field) => flatten(lo?.[field]))
}

const MATCH_STOP_WORDS = new Set([
  'about', 'after', 'also', 'and', 'are', 'available', 'based', 'before', 'can',
  'content', 'during', 'for', 'from', 'help', 'into', 'learning', 'more', 'needed',
  'provides', 'student', 'students', 'support', 'supports', 'that', 'the', 'their',
  'them', 'this', 'through', 'uses', 'using', 'when', 'while', 'with',
])

function matchToken(value) {
  let token = value.toLowerCase()
  if (token.length > 6 && token.endsWith('ing')) token = token.slice(0, -3)
  else if (token.length > 5 && token.endsWith('ed')) token = token.slice(0, -2)
  else if (token.length > 5 && token.endsWith('ly')) token = token.slice(0, -2)
  else if (token.length > 5 && token.endsWith('es')) token = token.slice(0, -2)
  else if (token.length > 4 && token.endsWith('s')) token = token.slice(0, -1)
  return token
}

function matchTokens(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .map(matchToken)
    .filter((token) => token.length > 2 && !MATCH_STOP_WORDS.has(token))
}

/**
 * Match a generated lesson's actual MTSS supports to a teacher's private,
 * numbered goal bank. This is deterministic and stays in the browser: no
 * student information or school bank is sent to another AI call.
 */
export function recommendMtssGoals(lo, goalBank = [], perTier = 3) {
  const recommendations = []
  for (const tier of ['tier_1', 'tier_2']) {
    const sectionKey = tier === 'tier_2' ? 'mtss_tier_2' : 'mtss_tier_1'
    const sourceText = contentForSection(lo, sectionKey).join(' ').trim()
    if (!sourceText) continue

    const tierGoals = goalBank.filter((goal) => (goal.tier ?? 'tier_1') === tier)
    const sourceTokenList = matchTokens(sourceText)
    const sourceTokens = new Set(sourceTokenList)
    const sourceSequence = ` ${sourceTokenList.join(' ')} `
    const documentFrequency = new Map()
    for (const goal of tierGoals) {
      for (const token of new Set(matchTokens(goal.label))) {
        documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)
      }
    }

    const scored = tierGoals.map((goal) => {
      const labelTokenList = matchTokens(goal.label)
      const labelTokens = new Set(labelTokenList)
      const titleTokens = new Set(matchTokens(String(goal.label).split(':')[0]))
      let score = 0
      let matches = 0
      for (const token of labelTokens) {
        if (!sourceTokens.has(token)) continue
        const rarity = Math.log((tierGoals.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1
        score += rarity * (titleTokens.has(token) ? 1.65 : 1)
        matches += 1
      }
      // Exact instructional phrases (for example, "checks for understanding",
      // "flexible grouping", or "progress monitoring") are stronger evidence
      // than isolated topic words such as "sequence" or "movement".
      for (let size = 2; size <= 4; size += 1) {
        for (let index = 0; index <= labelTokenList.length - size; index += 1) {
          const phrase = labelTokenList.slice(index, index + size).join(' ')
          if (sourceSequence.includes(` ${phrase} `)) score += size * 4
        }
      }
      return { goal, score, matches }
    }).filter((item) => item.matches >= 1 && item.score >= 1.25)
      .sort((a, b) => b.score - a.score || b.matches - a.matches || a.goal.number.localeCompare(b.goal.number))

    recommendations.push(...scored.slice(0, perTier).map((item) => item.goal.number))
  }
  return recommendations
}

/**
 * Select only the strongest school-approved instructional practices for the
 * generated lesson. The matching is deterministic and private in the browser;
 * the teacher's practice bank is never sent through another AI request.
 */
export function recommendInstructionalPractices(lo, practiceBank = [], limit = 3) {
  const sourceTokenList = matchTokens(flatten(lo).join(' '))
  if (!sourceTokenList.length || !practiceBank.length) return []

  const sourceTokens = new Set(sourceTokenList)
  const sourceSequence = ` ${sourceTokenList.join(' ')} `
  const subjectTokens = new Set(matchTokens([lo?.subject, lo?.title, lo?.topic, lo?.unit].filter(Boolean).join(' ')))
  const conceptGroups = [
    ['collaborat', 'partner', 'peer', 'team', 'group'],
    ['data', 'measure', 'record', 'graph', 'chart', 'score', 'quantit'],
    ['question', 'inquiry', 'ask', 'wonder'],
    ['evidence', 'claim', 'rationale', 'defend', 'conclusion'],
    ['reflect', 'revise', 'misconception', 'feedback', 'correct'],
    ['investigat', 'explor', 'research', 'phenomenon', 'experiment'],
    ['metacognit', 'strateg', 'clarify', 'persever', 'struggle'],
    ['real', 'authentic', 'career', 'community', 'life'],
  ]
  const documentFrequency = new Map()
  for (const practice of practiceBank) {
    for (const token of new Set(matchTokens(practice.label))) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)
    }
  }

  return practiceBank.map((practice) => {
    const labelTokenList = matchTokens(practice.label)
    const labelTokens = new Set(labelTokenList)
    let score = 0
    let matches = 0
    for (const token of labelTokens) {
      if (!sourceTokens.has(token)) continue
      const rarity = Math.log((practiceBank.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1
      score += rarity
      matches += 1
    }
    for (let size = 2; size <= 5; size += 1) {
      for (let index = 0; index <= labelTokenList.length - size; index += 1) {
        const phrase = labelTokenList.slice(index, index + size).join(' ')
        if (sourceSequence.includes(` ${phrase} `)) score += size * 4
      }
    }
    for (const group of conceptGroups) {
      if (group.some((token) => sourceTokens.has(token)) && group.some((token) => labelTokens.has(token))) score += 4
    }
    // Avoid choosing a text-analysis practice solely because a PE, arts, or
    // hands-on lesson happens to mention written directions or evidence.
    if (labelTokens.has('text') && !['english', 'read', 'literacy', 'library', 'research'].some((token) => subjectTokens.has(token))) score -= 10
    return { practice, score, matches }
  }).filter((item) => item.matches >= 2 && item.score >= 3)
    .sort((a, b) => b.score - a.score || b.matches - a.matches || a.practice.id.localeCompare(b.practice.id))
    .slice(0, limit)
    .map((item) => item.practice.id)
}

function sequence(lo) {
  return PHASES.flatMap(([label, fields]) => {
    const found = fields.find((field) => flatten(lo?.[field]).length)
    return found ? flatten(lo[found]).map((line) => `${label}: ${line}`) : []
  })
}

const FIELD_MAP = {
  standards: ['standards', 'standard', 'standards_alignment', 'national_standards', 'state_standards'],
  learning_targets: ['learning_targets', 'learning_target', 'objectives', 'learning_objectives', 'student_objectives', 'session_goals', 'goals'],
  success_criteria: ['success_criteria', 'look_fors', 'mastery_criteria', 'assessment_criteria', 'student_success_criteria'],
  instructional_practices: ['instructional_practices', 'teaching_strategies', 'instructional_strategies', 'pedagogical_practices'],
  evidence_of_learning: ['evidence_of_learning', 'formative_assessment', 'assessment_plan', 'checks_for_understanding', 'exit_ticket', 'closure'],
  notes: ['teacher_notes', 'notes', 'safety_notes', 'behavior_notes', 'known_vocabulary', 'new_vocabulary', 'accommodations', 'modifications'],
  attachments: ['attachments', 'resources', 'resources_needed', 'materials', 'materials_needed', 'equipment_needed', 'printables'],
  assignments: ['assignments', 'homework', 'independent_practice', 'extension_activity'],
  assessments: ['assessments', 'assessment', 'rubric', 'quiz', 'exit_ticket', 'formative_assessment'],
}

export function contentForSection(lo, key) {
  if (!lo) return []
  if (key === 'lesson_sequence') return sequence(lo)
  if (key === 'mtss_tier_1') {
    return [
      ...values(lo, ['tier1_supports', 'tier1_udl_ef', 'universal_supports', 'differentiation']),
      ...flatten(lo.mtss_supports?.tier_1 ?? lo.mtss_supports?.tier1),
      ...flatten(lo.modifications?.tier_1 ?? lo.modifications?.universal),
    ]
  }
  if (key === 'mtss_tier_2') {
    return [
      ...values(lo, ['tier2_supports', 'targeted_supports', 'progress_monitoring']),
      ...flatten(lo.mtss_supports?.tier_2 ?? lo.mtss_supports?.tier2),
      ...flatten(lo.modifications?.tier_2 ?? lo.modifications?.targeted),
    ]
  }
  return values(lo, FIELD_MAP[key] ?? [])
}

export function inspectLessonFormat(lo, format, formatValues = null) {
  const enabled = (format?.sections ?? []).filter((section) => section.enabled)
  const rows = enabled.map((section) => {
    let content = contentForSection(lo, section.key)
    if (section.key === 'instructional_practices' && formatValues?.instructional_practice_ids?.length) {
      content = formatValues.instructional_practice_ids.map((id) => {
        const practice = (format.instructional_practice_bank ?? []).find((item) => item.id === id)
        return practice ? `${practice.category} — ${practice.label}` : id
      })
    }
    if ((section.key === 'mtss_tier_1' || section.key === 'mtss_tier_2') && formatValues?.mtss_goal_numbers?.length) {
      const tier = section.key === 'mtss_tier_2' ? 'tier_2' : 'tier_1'
      const goalLines = formatValues.mtss_goal_numbers.map((number) => {
        const goal = (format.mtss_goal_bank ?? []).find((item) => item.number === number && (item.tier ?? 'tier_1') === tier)
        return goal ? `${goal.number} — ${goal.label}` : number
      }).filter((line, index) => {
        const goal = (format.mtss_goal_bank ?? []).find((item) => item.number === formatValues.mtss_goal_numbers[index])
        return (goal?.tier ?? 'tier_1') === tier
      })
      content = [...goalLines, ...(section.key === 'mtss_tier_2' && formatValues.mtss_notes ? [formatValues.mtss_notes] : [])]
    }
    const textLength = content.join(' ').length
    let status = textLength ? (textLength < 35 ? 'partial' : 'evident') : 'not_yet'
    if (section.key === 'mtss_tier_2' && !textLength) status = 'na'
    return { ...section, content, status }
  })
  const required = rows.filter((row) => row.required)
  const score = required.reduce((sum, row) => sum + (row.status === 'evident' || row.status === 'na' ? 1 : row.status === 'partial' ? 0.5 : 0), 0)
  const ratio = required.length ? score / required.length : 1
  const overall = ratio >= .95 ? 'Strong' : ratio >= .78 ? 'Clear' : ratio >= .55 ? 'Developing' : 'Revision needed'
  const strength = rows.find((row) => row.status === 'evident')
  const next = required.find((row) => row.status === 'not_yet' || row.status === 'partial')
  return {
    rows,
    overall,
    met: required.filter((row) => row.status === 'evident' || row.status === 'na').length,
    required: required.length,
    strength: strength ? `${strength.label} is clearly visible in this plan.` : 'The lesson title and core plan are saved.',
    nextStep: next ? `Strengthen ${next.label.toLowerCase()} before submitting this plan.` : 'This plan shows every required section in your saved format.',
  }
}

export function displayLines(lines, detailLevel = 'brief') {
  if (detailLevel === 'detailed') return lines
  const limit = detailLevel === 'standard' ? 6 : 3
  const max = detailLevel === 'standard' ? 520 : 280
  return lines.slice(0, limit).map((line) => line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line)
}
