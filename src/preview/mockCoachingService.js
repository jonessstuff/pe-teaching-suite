import { DEFAULT_COMMENT_TAGS, DEFAULT_RUBRIC } from '../lib/tryoutScoring'

let workspaces = [{
  id: 'tryout-preview-1', teacher_id: 'preview-user', team_name: 'Falcons Volleyball', sport: 'Volleyball',
  season: 'Fall 2026', status: 'tryouts', rubric: DEFAULT_RUBRIC, comment_tags: DEFAULT_COMMENT_TAGS,
  comments_affect_score: true, updated_at: new Date().toISOString(),
  tryout_days: [
    { id: 'day-1', label: 'Day 1', date: '2026-08-27' },
    { id: 'day-2', label: 'Day 2', date: '2026-08-29' },
  ],
  candidates: [
    { id: 'candidate-1', name: 'Avery M.', number: '12', position: 'Setter', evaluations: { 'day-1': { scores: { skill: 4, effort: 5, coachability: 5, teamwork: 4, 'decision-making': 4 }, commentTagIds: ['communicator'], notes: 'Communicated early and adjusted after feedback.' }, 'day-2': { scores: { skill: 5, effort: 5, coachability: 5, teamwork: 4, 'decision-making': 5 }, commentTagIds: ['communicator', 'hustle'], notes: 'Sees the court and communicates early.' } }, selected: true, status: 'active' },
    { id: 'candidate-2', name: 'Jordan R.', number: '8', position: 'Outside hitter', evaluations: { 'day-1': { scores: { skill: 4, effort: 4, coachability: 4, teamwork: 5, 'decision-making': 4 }, commentTagIds: ['hustle'], notes: 'Reliable serve receive.' }, 'day-2': { scores: { skill: 4, effort: 5, coachability: 4, teamwork: 5, 'decision-making': 4 }, commentTagIds: ['hustle', 'fundamentals'], notes: 'Strong serve receive.' } }, selected: true, status: 'active' },
    { id: 'candidate-3', name: 'Casey L.', number: '21', position: 'Middle', evaluations: { 'day-1': { scores: { skill: 3, effort: 4, coachability: 5, teamwork: 4, 'decision-making': 3 }, commentTagIds: ['position-fit'], notes: 'Good reach; watch lateral footwork.' }, 'day-2': { scores: { skill: 4, effort: 4, coachability: 5, teamwork: 4, 'decision-making': 3 }, commentTagIds: ['position-fit'], notes: 'Footwork improved from Day 1.' } }, selected: false, status: 'active' },
    { id: 'candidate-4', name: 'Riley S.', number: '4', position: 'Libero', evaluations: { 'day-1': { scores: { skill: 3, effort: 5, coachability: 5, teamwork: 5, 'decision-making': 4 }, commentTagIds: ['communicator', 'hustle'], notes: 'High energy and steady communication.' }, 'day-2': { scores: { skill: 4, effort: 5, coachability: 5, teamwork: 5, 'decision-making': 4 }, commentTagIds: ['communicator', 'hustle'], notes: 'More controlled passing today.' } }, selected: false, status: 'active' },
  ],
  team_tools: {
    practices: [{ id: 'practice-1', title: 'Serve receive + rotations', date: '2026-09-02', notes: 'Finish with six-on-six.' }],
    plays: [{ id: 'play-1', title: 'Free-ball transition', notes: 'Setter releases from right back.' }],
    events: [{ id: 'event-1', title: 'Home vs. East Ridge', date: '2026-09-10', time: '5:30 PM', location: 'Main gym' }],
  },
}]

export async function listCoachingWorkspaces() { return structuredClone(workspaces) }
export async function createCoachingWorkspace(values) {
  const row = { id: `tryout-${Date.now()}`, team_name: values.teamName, sport: values.sport, season: values.season, status: 'tryouts', rubric: values.rubric, comment_tags: values.commentTags, comments_affect_score: values.commentsAffectScore, tryout_days: values.tryoutDays, candidates: values.candidates ?? [], team_tools: { practices: [], plays: [], events: [] }, updated_at: new Date().toISOString() }
  workspaces = [row, ...workspaces]
  return structuredClone(row)
}
export async function updateCoachingWorkspace(id, updates) {
  const row = workspaces.find((item) => item.id === id)
  const mapping = { teamName: 'team_name', commentTags: 'comment_tags', commentsAffectScore: 'comments_affect_score', tryoutDays: 'tryout_days', teamTools: 'team_tools' }
  for (const [key, value] of Object.entries(updates)) row[mapping[key] ?? key] = structuredClone(value)
  row.updated_at = new Date().toISOString()
  return structuredClone(row)
}
export async function deleteCoachingWorkspace(id) { workspaces = workspaces.filter((item) => item.id !== id) }
