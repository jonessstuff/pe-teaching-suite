export const WORK_INTERESTS = [
  { id: 'build', label: 'Build & repair', icon: '🛠️', prompt: 'I like making, fixing, testing, or improving things.', examples: 'construction, manufacturing, automotive, engineering, energy' },
  { id: 'help', label: 'Help & care', icon: '🤝', prompt: 'I like helping people feel safe, healthy, supported, or understood.', examples: 'healthcare, education, human services, public safety' },
  { id: 'create', label: 'Create & communicate', icon: '🎨', prompt: 'I like designing, performing, telling stories, or sharing ideas.', examples: 'media, design, marketing, communications, hospitality' },
  { id: 'analyze', label: 'Analyze & solve', icon: '🔎', prompt: 'I like investigating information, finding patterns, and solving hard problems.', examples: 'data, finance, cybersecurity, laboratory science, law' },
  { id: 'lead', label: 'Lead & organize', icon: '📋', prompt: 'I like planning, persuading, coordinating, or helping a team reach a goal.', examples: 'business, entrepreneurship, management, project leadership' },
  { id: 'grow', label: 'Grow & sustain', icon: '🌱', prompt: 'I like working with food, animals, plants, land, or natural resources.', examples: 'agriculture, culinary, environmental systems, renewable energy' },
  { id: 'move', label: 'Move & deliver', icon: '🚚', prompt: 'I like keeping people, products, and systems moving efficiently.', examples: 'transportation, logistics, aviation, supply chain' },
  { id: 'protect', label: 'Protect & serve', icon: '🛡️', prompt: 'I like solving community problems, responding in emergencies, or serving the public.', examples: 'law, fire science, emergency response, government, military' },
]

export const WORK_PREFERENCES = [
  'Working with my hands', 'Working with people', 'Working with technology', 'Working outdoors',
  'Creating something original', 'Solving a difficult problem', 'Leading a team', 'Following a clear process',
]

export const FOUNDATION_UNITS = [
  { id: 'self', title: 'Know your strengths', sessions: 3, question: 'What kinds of work bring out my best?', artifact: 'Strengths & interests snapshot', activities: ['Interest corners', 'Proud moment interview', 'My work-style profile'], materials: 'Four corner signs, reflection sheet, sticky notes' },
  { id: 'world', title: 'Explore the world of work', sessions: 4, question: 'How do different careers solve real problems?', artifact: 'Career cluster road map', activities: ['Career mystery bags', 'Problem-to-pathway sort', 'Community career map', 'Career myth check'], materials: 'Career cards, local employer list, chart paper' },
  { id: 'talk', title: 'Communicate like a professional', sessions: 4, question: 'How do words, listening, and body language build trust?', artifact: 'Professional communication practice log', activities: ['Greeting challenge', 'Listen-draw-switch', 'Email repair shop', 'Customer conversation role-play'], materials: 'Scenario cards, sample messages, observation rubric' },
  { id: 'team', title: 'Work as a team', sessions: 4, question: 'What makes a team reliable and productive?', artifact: 'Team role reflection', activities: ['Silent build', 'Role rotation challenge', 'Deadline rescue', 'Team debrief'], materials: 'Low-cost build materials, role cards, timer' },
  { id: 'money', title: 'Money & adult life', sessions: 5, question: 'How do career choices connect to the life I want?', artifact: 'First-month budget simulation', activities: ['Paycheck detective', 'Needs vs. wants sprint', 'Life happens cards', 'Family budget simulation', 'Money decision reflection'], materials: 'Calculators, price cards, budget sheets, event cards' },
  { id: 'reality', title: 'Pathway reality check', sessions: 4, question: 'What does training and daily work really look like?', artifact: 'Two-pathway comparison', activities: ['A day in the work', 'Training route relay', 'Credential decoder', 'Ask an industry guest'], materials: 'Local pathway profiles, training cards, question planner' },
  { id: 'capstone', title: 'My next-step showcase', sessions: 4, question: 'What should I explore next—and why?', artifact: 'Career exploration portfolio & three-minute pitch', activities: ['Evidence sort', 'Pathway pitch builder', 'Peer question practice', 'Exploration showcase'], materials: 'Portfolio folder, pitch template, feedback cards' },
]

export const EMPLOYABILITY_SKILLS = [
  { id: 'communication', name: 'Communication', lookFors: ['Uses a clear greeting and respectful tone', 'Listens without interrupting', 'Explains ideas with relevant details', 'Chooses an appropriate format for the message'] },
  { id: 'teamwork', name: 'Teamwork', lookFors: ['Completes an agreed role', 'Invites and uses others’ ideas', 'Disagrees respectfully', 'Helps the team recover when a plan changes'] },
  { id: 'problem-solving', name: 'Problem solving', lookFors: ['Defines the problem before acting', 'Uses evidence or asks useful questions', 'Tries more than one reasonable approach', 'Explains why the final choice makes sense'] },
  { id: 'reliability', name: 'Reliability', lookFors: ['Starts promptly with needed materials', 'Follows through on commitments', 'Meets the deadline or communicates early', 'Checks work before calling it complete'] },
  { id: 'professionalism', name: 'Professionalism', lookFors: ['Responds appropriately to feedback', 'Uses safe and ethical work habits', 'Takes responsibility for mistakes', 'Adapts behavior to the setting and audience'] },
  { id: 'digital', name: 'Digital responsibility', lookFors: ['Protects private information', 'Checks the credibility of information', 'Uses digital tools for the intended purpose', 'Credits sources and explains tool use honestly'] },
]

export const EMPLOYABILITY_SCENARIOS = [
  { id: 'late-team', title: 'The late teammate', skill: 'teamwork', setup: 'One team member has missed two deadlines. The final product is due tomorrow.', challenge: 'Hold a two-minute team conversation that protects the deadline and the relationship.' },
  { id: 'confusing-email', title: 'The confusing email', skill: 'communication', setup: 'A supervisor sends a short message that could mean two different things.', challenge: 'Write a professional reply that clarifies the task without blaming the sender.' },
  { id: 'broken-tool', title: 'The tool stops working', skill: 'problem-solving', setup: 'A tool or device fails halfway through an important job.', challenge: 'Create a safe troubleshooting plan and explain when to ask for help.' },
  { id: 'feedback', title: 'The hard feedback', skill: 'professionalism', setup: 'A client says the work does not meet the agreed expectations.', challenge: 'Respond, ask useful questions, and propose a next step.' },
  { id: 'missing-file', title: 'The missing file', skill: 'reliability', setup: 'A shared file is not where the team expected it five minutes before a presentation.', challenge: 'Respond in a way that solves the immediate problem and prevents a repeat.' },
  { id: 'viral-claim', title: 'The viral claim', skill: 'digital', setup: 'A popular post makes a dramatic claim that would change your team’s project.', challenge: 'Decide whether to use it and show how you verified the information.' },
  { id: 'customer-change', title: 'The last-minute change', skill: 'problem-solving', setup: 'A customer changes an important requirement after work has already started.', challenge: 'Identify constraints, options, tradeoffs, and a professional recommendation.' },
  { id: 'new-person', title: 'The new team member', skill: 'communication', setup: 'A new person joins a project and does not know the routines or vocabulary.', challenge: 'Create a two-minute welcome and clear first-task explanation.' },
]

export const RUBRIC_LEVELS = [
  { score: 1, label: 'Emerging', desc: 'Needs prompting to begin or complete the skill safely and appropriately.' },
  { score: 2, label: 'Developing', desc: 'Shows part of the skill, but consistency, clarity, or independence is missing.' },
  { score: 3, label: 'Workplace ready', desc: 'Uses the skill independently and appropriately for the situation.' },
  { score: 4, label: 'Workplace strong', desc: 'Uses the skill consistently and helps the team improve its result.' },
]

export function parsePathways(value = '') {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 24)
}

export function buildPathwayKit(form) {
  const pathways = parsePathways(form.pathways)
  return {
    type: 'pathway-fit',
    title: form.title || 'Pathway Fit & Recruiting Kit',
    grade: form.grade,
    pathways,
    reflection: WORK_INTERESTS.map((interest) => ({ ...interest, ratingPrompt: `How much does this sound like you? 1 · Not yet   2 · Sometimes   3 · Often   4 · Very much` })),
    conversation: [
      'Which two statements sounded most like you? Give one real example.',
      'Which work setting or task would you like to try before choosing?',
      'Which local pathway could help you test that interest?',
      'What is one fact you still need—from a teacher, student, employer, or program visit?',
      'Choose two pathways to explore next. This is a starting point, not a permanent placement.',
    ],
    recruiting: pathways.map((pathway) => ({ pathway, headline: `${pathway}: more than the name`, prompts: ['What students actually do', 'Who thrives here', 'A surprising skill students build', 'A real credential, project, or next step', 'Come see it before you choose it'] })),
  }
}

export function buildFoundationPlan(form) {
  const selected = FOUNDATION_UNITS.filter((unit) => form.units.includes(unit.id))
  const meetingMinutes = Number(form.minutes) || 45
  const weeks = Math.max(1, Number(form.weeks) || 9)
  let cursor = 1
  const sessions = selected.flatMap((unit) => unit.activities.map((activity, index) => ({ week: Math.min(weeks, Math.ceil(cursor++ / Math.max(1, Number(form.meetings) || 3))), unit: unit.title, session: index + 1, activity, question: unit.question, artifact: index === unit.activities.length - 1 ? unit.artifact : 'Practice evidence', minutes: meetingMinutes })))
  return { type: 'foundations', title: form.title || `Grade ${form.grade} Career Foundations`, grade: form.grade, weeks, meetingMinutes, selected, sessions, teacherPrep: ['Add your local pathways and terminology', 'Invite at least one industry or pathway voice', 'Choose low-cost materials students can handle', 'Decide where student artifacts will be kept', 'Share that exploration expands choices—it does not lock in a career'] }
}

export function buildEmployabilityKit(form) {
  const skill = EMPLOYABILITY_SKILLS.find((item) => item.id === form.skill) ?? EMPLOYABILITY_SKILLS[0]
  const scenarios = EMPLOYABILITY_SCENARIOS.filter((item) => item.skill === skill.id || form.includeMixed)
  return { type: 'employability', title: form.title || `${skill.name} Skills Lab`, skill, scenarios: scenarios.slice(0, 6), rubric: RUBRIC_LEVELS, routine: ['Launch (2 min): Read the situation and name the workplace consequence.', 'Plan (3 min): Teams choose a response and assign roles.', 'Practice (5 min): Perform or produce the response.', 'Observe (3 min): Use one look-for and one rubric score.', 'Improve (3 min): Repeat one part using the feedback.', 'Reflect (2 min): Record evidence—not just “I did well.”'], reflection: ['What did you say, do, or create?', 'Which look-for is supported by evidence?', 'What would move this performance up one level?', 'Where could this skill matter outside this class?'] }
}
