export const DEFAULT_RUBRIC = [
  { id: 'skill', label: 'Sport skill', weight: 30, maxScore: 5 },
  { id: 'effort', label: 'Effort', weight: 20, maxScore: 5 },
  { id: 'coachability', label: 'Coachability', weight: 20, maxScore: 5 },
  { id: 'teamwork', label: 'Teamwork', weight: 15, maxScore: 5 },
  { id: 'decision-making', label: 'Decision-making', weight: 15, maxScore: 5 },
]

export const DEFAULT_COMMENT_TAGS = [
  { id: 'communicator', label: 'Strong communicator', points: 2 },
  { id: 'hustle', label: 'Consistent hustle', points: 2 },
  { id: 'fundamentals', label: 'Strong fundamentals', points: 2 },
  { id: 'position-fit', label: 'Position potential', points: 1 },
  { id: 'conditioning', label: 'Needs conditioning', points: -1 },
  { id: 'redirect', label: 'Needs repeated redirection', points: -2 },
]

export function weightedTryoutScore(candidate, rubric, commentTags, commentsAffectScore = true) {
  const categories = (rubric ?? []).filter((item) => Number(item.weight) > 0 && Number(item.maxScore) > 0)
  const totalWeight = categories.reduce((sum, item) => sum + Number(item.weight), 0)
  const completed = categories.filter((item) => Number(candidate?.scores?.[item.id]) > 0)
  const rubricPercent = totalWeight > 0
    ? categories.reduce((sum, item) => {
        const score = Math.max(0, Math.min(Number(item.maxScore), Number(candidate?.scores?.[item.id]) || 0))
        return sum + (score / Number(item.maxScore)) * Number(item.weight)
      }, 0) / totalWeight * 100
    : 0
  const commentAdjustment = commentsAffectScore
    ? (candidate?.commentTagIds ?? []).reduce((sum, id) => {
        const tag = (commentTags ?? []).find((item) => item.id === id)
        return sum + (Number(tag?.points) || 0)
      }, 0)
    : 0

  return {
    score: Math.max(0, Math.min(100, Math.round((rubricPercent + commentAdjustment) * 10) / 10)),
    rubricPercent: Math.round(rubricPercent * 10) / 10,
    commentAdjustment,
    completed: completed.length,
    total: categories.length,
  }
}

export function blankTryoutEvaluation() {
  return { scores: {}, commentTagIds: [], notes: '' }
}

export function candidateTryoutSummary(candidate, tryoutDays, rubric, commentTags, commentsAffectScore = true) {
  const days = (tryoutDays ?? []).map((day) => {
    const evaluation = candidate?.evaluations?.[day.id] ?? blankTryoutEvaluation()
    return { day, ...weightedTryoutScore(evaluation, rubric, commentTags, commentsAffectScore) }
  })
  // Only complete daily rubrics count toward the final ranking. This prevents a
  // candidate from being unfairly lowered because the coach paused mid-evaluation.
  const scoredDays = days.filter((day) => day.total > 0 && day.completed === day.total)
  const partialDays = days.filter((day) => day.completed > 0 && day.completed < day.total)
  const totalPoints = scoredDays.reduce((sum, day) => sum + day.score, 0)
  return {
    days,
    daysScored: scoredDays.length,
    partialDays: partialDays.length,
    totalDays: days.length,
    totalPoints: Math.round(totalPoints * 10) / 10,
    average: scoredDays.length ? Math.round(totalPoints / scoredDays.length * 10) / 10 : 0,
  }
}

export function blankCandidate(name, index = 0) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `candidate-${Date.now()}-${index}`,
    name: String(name ?? '').trim(),
    number: String(index + 1),
    position: '',
    evaluations: {},
    selected: false,
    status: 'active',
  }
}

export function parseCandidateNames(raw) {
  return String(raw ?? '')
    .split(/\r?\n|,|;/)
    .map((value) => value.trim())
    .filter(Boolean)
}
