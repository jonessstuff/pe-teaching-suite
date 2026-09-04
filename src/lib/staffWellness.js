export const WELLNESS_TEMPLATES = [
  { id: 'move-10', title: 'Move for 10', category: 'Movement', level: 'Beginner', blurb: 'Add any comfortable 10-minute movement break each workday.', metric: 'days', goal: 20, unit: 'days', alternative: 'Seated movement, stretching, or physical-therapy-approved activity counts.' },
  { id: 'movement-snacks', title: 'Movement Snack Streak', category: 'Movement', level: 'All levels', blurb: 'Complete three short movement breaks during the day.', metric: 'days', goal: 15, unit: 'days', alternative: 'Choose standing, seated, mobility, or breathing-based breaks.' },
  { id: 'active-minutes', title: 'Active Minutes Month', category: 'Movement', level: 'Moderate', blurb: 'Accumulate active minutes in any activity you enjoy.', metric: 'minutes', goal: 600, unit: 'minutes', alternative: 'Use personal effort rather than speed or distance.' },
  { id: 'miles-any-way', title: 'Miles Any Way', category: 'Movement', level: 'All levels', blurb: 'Walk, roll, cycle, swim, paddle, or use an equivalent activity.', metric: 'miles', goal: 30, unit: 'miles/equivalents', alternative: 'Ten active minutes may equal one mile.' },
  { id: 'step-ladder', title: 'Personal Step Ladder', category: 'Movement', level: 'All levels', blurb: 'Improve from your own baseline instead of competing on totals.', metric: 'percent', goal: 10, unit: '% improvement', alternative: 'Track active minutes instead of steps.' },
  { id: 'stair-or-strength', title: 'Stairs or Strength', category: 'Strength', level: 'Moderate', blurb: 'Choose stair bouts or a short strength routine.', metric: 'sessions', goal: 12, unit: 'sessions', alternative: 'Seated resistance, bands, or wall exercises count.' },
  { id: 'strong-week', title: 'Two Strong Days', category: 'Strength', level: 'Beginner', blurb: 'Complete two strength sessions each week.', metric: 'sessions', goal: 8, unit: 'sessions', alternative: 'Use bodyweight, bands, light weights, or adaptive resistance.' },
  { id: 'mobility', title: 'Mobility Minutes', category: 'Mobility & recovery', level: 'Beginner', blurb: 'Create a daily mobility, stretching, or gentle range-of-motion habit.', metric: 'minutes', goal: 200, unit: 'minutes', alternative: 'Only pain-free, personally appropriate movements count.' },
  { id: 'recovery', title: 'Recovery Counts', category: 'Mobility & recovery', level: 'All levels', blurb: 'Earn credit for mobility, rest routines, and recovery practices.', metric: 'points', goal: 30, unit: 'points', alternative: 'Designed to reward recovery rather than intensity.' },
  { id: 'sleep-routine', title: 'Wind-Down Routine', category: 'Rest & stress', level: 'Beginner', blurb: 'Practice a screen-light, calming bedtime routine.', metric: 'days', goal: 15, unit: 'days', alternative: 'Focus on a routine, never personal sleep or medical data.' },
  { id: 'mindful-minutes', title: 'Mindful Minutes', category: 'Rest & stress', level: 'All levels', blurb: 'Log breathing, reflection, prayer, meditation, or quiet reset time.', metric: 'minutes', goal: 150, unit: 'minutes', alternative: 'Any culturally and personally comfortable calming practice counts.' },
  { id: 'stress-reset', title: 'Five-Minute Reset', category: 'Rest & stress', level: 'Beginner', blurb: 'Take one intentional five-minute reset on workdays.', metric: 'days', goal: 18, unit: 'days', alternative: 'Quiet, music, outdoors, breathing, or social connection can count.' },
  { id: 'water-cues', title: 'Hydration Cues', category: 'Everyday wellness', level: 'Beginner', blurb: 'Pair water breaks with three predictable moments in the school day.', metric: 'days', goal: 15, unit: 'days', alternative: 'Follow personal or medical guidance; no required volume.' },
  { id: 'colorful-plate', title: 'Colorful Choices', category: 'Everyday wellness', level: 'All levels', blurb: 'Notice variety by adding a fruit or vegetable when appropriate.', metric: 'choices', goal: 20, unit: 'choices', alternative: 'No calorie, weight, body-size, or restrictive food tracking.' },
  { id: 'screen-break', title: 'Screen-Break Streak', category: 'Everyday wellness', level: 'Beginner', blurb: 'Take an eye and posture break during long screen blocks.', metric: 'days', goal: 20, unit: 'days', alternative: 'A visual-rest or sensory reset counts.' },
  { id: 'outside', title: 'Outside for Five', category: 'Outdoor', level: 'Beginner', blurb: 'Spend five intentional minutes outside on workdays.', metric: 'days', goal: 15, unit: 'days', alternative: 'A window, garden view, or indoor nature connection counts when needed.' },
  { id: 'nature-quest', title: 'Nature Quest', category: 'Outdoor', level: 'All levels', blurb: 'Complete outdoor prompts such as sunrise, birds, trees, or new routes.', metric: 'quests', goal: 12, unit: 'quests', alternative: 'Indoor nature observations and accessible routes count.' },
  { id: 'team-bingo', title: 'School Wellness Bingo', category: 'Bingo', level: 'All levels', blurb: 'Complete a varied 5×5 bingo card individually or with a team.', metric: 'squares', goal: 24, unit: 'squares', alternative: 'Every square includes or permits a lower-impact substitution.' },
  { id: 'department-bingo', title: 'Department Bingo Relay', category: 'Bingo', level: 'All levels', blurb: 'Teams work together to cover one shared wellness card.', metric: 'squares', goal: 24, unit: 'squares', alternative: 'Contributions may be movement, recovery, connection, or mindfulness.' },
  { id: 'kindness-bingo', title: 'Kindness & Connection Bingo', category: 'Bingo', level: 'All levels', blurb: 'Build staff morale through gratitude, encouragement, and connection.', metric: 'squares', goal: 24, unit: 'squares', alternative: 'Private or anonymous acts count.' },
  { id: 'consistency', title: 'Consistency Over Intensity', category: 'Consistency', level: 'All levels', blurb: 'Choose one personal habit and practice it regularly.', metric: 'days', goal: 20, unit: 'days', alternative: 'Each person defines an accessible, realistic habit.' },
  { id: 'personal-best', title: 'Personal Best Month', category: 'Consistency', level: 'Advanced', blurb: 'Work toward an individual performance goal without public comparison.', metric: 'sessions', goal: 16, unit: 'sessions', alternative: 'The goal may focus on endurance, strength, mobility, or consistency.' },
  { id: 'team-points', title: 'Team Wellness Points', category: 'Team', level: 'All levels', blurb: 'Departments earn points from a menu of inclusive wellness actions.', metric: 'points', goal: 250, unit: 'team points', alternative: 'Cap daily points so intensity cannot dominate participation.' },
  { id: 'school-journey', title: 'Around-the-World School Journey', category: 'Team', level: 'All levels', blurb: 'Combine movement equivalents toward a schoolwide destination.', metric: 'miles', goal: 1000, unit: 'school miles', alternative: 'Use ten active minutes, one mobility session, or one mile equivalently.' },
  { id: 'choose-your-own', title: 'Choose-Your-Own Wellness', category: 'Custom', level: 'All levels', blurb: 'Offer movement, recovery, mindfulness, and connection pathways.', metric: 'points', goal: 40, unit: 'points', alternative: 'Participants select the pathway that fits them.' },
]

export const BINGO_PROMPTS = [
  'Take a 10-minute walk or roll', 'Stretch for five minutes', 'Try a seated mobility break', 'Invite a coworker to move with you', 'Take the scenic route',
  'Spend five minutes outside', 'Notice three things in nature', 'Try a new accessible route', 'Enjoy a screen-free break', 'Stand or change position during a task',
  'Complete a short strength routine', 'Use resistance bands or wall exercises', 'Practice balance with support', 'Do a movement you enjoy', 'Dance to one song',
  'Drink water at three routine cues', 'Add a colorful food when appropriate', 'Pack a satisfying snack', 'Take an unrushed lunch break', 'Try a new nourishing recipe',
  'Practice two minutes of breathing', 'Write down one good thing', 'Listen to a calming song', 'Take a five-minute quiet reset', 'Set one healthy boundary',
  'Begin a wind-down routine', 'Put screens away a little earlier', 'Choose a recovery activity', 'Take a guilt-free rest break', 'Do gentle range-of-motion work',
  'Thank a coworker', 'Share an encouraging note', 'Check in with someone', 'Celebrate another person’s win', 'Do one anonymous kind act',
  'Declutter one small space', 'Take an eye break from screens', 'Prepare tomorrow’s wellness cue', 'Try a new hobby for ten minutes', 'Spend time with a pet or loved one',
  'Complete your personal wellness choice', 'Swap intensity for consistency today', 'Choose the lower-impact option you need', 'Try something new without judging performance', 'Record one personal win',
  'Join a team activity', 'Cheer for your department', 'Share an inclusive wellness idea', 'Complete a square with a coworker', 'Help someone adapt an activity',
]

export function makeBingoCard(offset = 0) {
  const rotated = BINGO_PROMPTS.map((_, index) => BINGO_PROMPTS[(index + offset * 7) % BINGO_PROMPTS.length])
  const card = rotated.slice(0, 24)
  card.splice(12, 0, 'FREE: Choose what supports you today')
  return card
}

export function parseStaffList(raw = '') {
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [name, team = 'Schoolwide'] = (line.includes('|') ? line.split('|') : line.split(',')).map((part) => part.trim())
    return { id: `staff-${index + 1}`, name, team: team || 'Schoolwide' }
  }).filter((item) => item.name)
}

export function challengeMessages(challenge) {
  return {
    launch: `Subject: Join our ${challenge.title}!\n\nWe’re launching an inclusive staff wellness challenge from ${challenge.startsOn} through ${challenge.endsOn}. ${challenge.blurb}\n\nParticipate at the level that fits you. ${challenge.alternative}\n\nOur goal is ${challenge.goal} ${challenge.unit}. Individual results stay private${challenge.leaderboard === 'off' ? ', and there is no individual leaderboard' : ''}. Let’s encourage consistency, choice, and one another!`,
    reminder: `Quick ${challenge.title} check-in: every personally appropriate action counts. Log what you completed, try a bingo square, or choose a lower-impact alternative. Progress—not perfection!`,
    results: `We completed ${challenge.title}! Together we practiced movement, recovery, connection, and everyday wellness. Thank you for participating in the way that worked for you. Our shared progress deserves celebrating!`,
  }
}

export function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
