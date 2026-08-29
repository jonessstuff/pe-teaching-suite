let savedCards = []

const pause = () => new Promise((resolve) => setTimeout(resolve, 180))

export async function generateClassroomCard({
  outputType = 'card', gradeBand = '6-8', classContext = '', challenge = '',
  noteType = 'incident', studentName = '', noteDate = '', details = '', response = '',
}) {
  await pause()
  const setting = classContext || 'specials class'

  if (outputType === 'behavior-chart') {
    return {
      heading: `${setting} — Reset and Rejoin`,
      tiers: [
        { color: 'green', label: 'On Track', descriptors: ['Start when the signal is given.', 'Use the shared space and materials safely.', 'Pause and listen when directions begin.'] },
        { color: 'yellow', label: 'Time to Reset', descriptors: ['Talking or moving during directions.', 'Using materials before the signal.', 'Continuing after a reminder to refocus.'] },
        { color: 'red', label: 'Stop and Reset', descriptors: ['Using materials or equipment unsafely.', 'Hurting another person or damaging their work.', 'Continuing after a stop-and-reset direction.'] },
      ],
      move_up_steps: ['Put materials or equipment in a safe place.', 'Take a breath and name what needs to change.', 'Show the expected ready behavior.', 'Check in with the teacher and rejoin.'],
    }
  }

  if (outputType === 'reflection-form') {
    return {
      heading: 'Pause, Reflect, and Reset',
      intro: 'This is a chance to reset—not a punishment. Be honest and choose a next step.',
      what_happened: { prompt: 'What happened?', options: ['I was frustrated.', 'I was distracted.', 'I did not understand the direction.', 'I made an unsafe choice.'] },
      do_differently: { prompt: 'What can I try next time?', options: ['Ask for help.', 'Take a short reset.', 'Use calm words.', 'Follow the first direction.'] },
      need_now: { prompt: 'What would help me rejoin?', options: ['A quick teacher check-in.', 'A new spot.', 'Directions repeated.', 'One quiet minute.'] },
      closing: 'When you are ready, check in with your teacher and rejoin the class.',
    }
  }

  if (outputType === 'troubleshoot') {
    return {
      usable: true,
      message: 'Start with one small, observable change and watch what happens across several classes.',
      strategies: [
        { title: 'Pre-correct the exact moment', what_to_try: `Before the challenging part of ${setting}, state and model the one behavior students should show.`, why_it_works: 'Students hear the direction before the trigger occurs.' },
        { title: 'Make the transition visible', what_to_try: 'Use a short countdown and post the two actions students complete before time expires.', why_it_works: 'A concrete finish line reduces uncertainty and repeated reminders.' },
        { title: 'Reinforce the first success', what_to_try: 'Name the specific action you see as soon as students begin doing it.', why_it_works: 'Specific feedback shows the rest of the group exactly what success looks like.' },
      ],
      escalation_note: challenge ? `Track when “${challenge}” occurs for several classes. If it continues or creates a safety concern, involve the appropriate school support team.` : '',
    }
  }

  if (outputType === 'parent-note') {
    const display = studentName || 'your child'
    const datePhrase = noteDate ? ` on ${noteDate}` : ''
    if (noteType === 'positive') {
      return {
        usable: true,
        message: '',
        title: 'A positive moment to share',
        greeting: studentName ? `Dear ${studentName}’s family,` : 'Dear Parent/Guardian,',
        paragraphs: [`I wanted to share something positive I noticed in ${setting}${datePhrase}. ${details}`, `That choice made a real difference in our class, and I was glad to see ${display} contribute in such a thoughtful way.`],
        closing: 'Warmly,',
      }
    }
    return {
      usable: true,
      message: '',
      title: 'Checking in about class today',
      greeting: studentName ? `Dear ${studentName}’s family,` : 'Dear Parent/Guardian,',
      paragraphs: [`I wanted to let you know about something that happened in ${setting}${datePhrase}. ${details}`, response ? `At school, ${response}` : 'We paused, reviewed the expectation, and made a plan for returning to the activity.', `I appreciate your partnership as we help ${display} have a successful next class.`],
      closing: 'With appreciation,',
    }
  }

  return {
    heading: `${setting} — Quick Reference`,
    attention_signals: [
      { signal: 'Hand raised + countdown', meaning: 'Finish the action, face the teacher, and listen.' },
      { signal: 'Two short chimes', meaning: 'Freeze materials safely and look up.' },
    ],
    entry_routine: ['Enter and check the posted start task.', 'Move directly to the assigned space.', 'Begin before the timer ends.'],
    exit_routine: ['Return materials to the labeled location.', 'Check the floor and workspace.', 'Wait for the dismissal signal.'],
    equipment_distribution: ['One materials manager per group.', 'Carry only the assigned items.', 'Report damage or missing pieces immediately.'],
    large_group_strategies: ['Post a visible sequence for the class.', 'Use the same attention cue every day.', 'Correct privately whenever possible.'],
    behavior_expectations: ['Pause conversations when directions begin.', 'Keep materials in the assigned workspace.', 'Use the reset routine before rejoining.'],
    gradeBand,
  }
}

export async function createCard({ name, cardData }) {
  await pause()
  const row = {
    id: `preview-card-${Date.now()}`,
    name,
    card_data: structuredClone(cardData),
    created_at: new Date().toISOString(),
  }
  savedCards = [row, ...savedCards]
  return structuredClone(row)
}

export async function listCards() {
  await pause()
  return savedCards.map(({ id, name, created_at }) => ({ id, name, created_at }))
}

export async function getCard(id) {
  await pause()
  const card = savedCards.find((item) => item.id === id)
  if (!card) throw new Error('Saved classroom tool not found.')
  return structuredClone(card)
}

export async function deleteCard(id) {
  await pause()
  savedCards = savedCards.filter((item) => item.id !== id)
}
