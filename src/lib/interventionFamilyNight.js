export const FAMILY_NIGHT_CONFIGS = {
  reading: {
    title: 'Reading Intervention Family Night', shortTitle: 'Reading Night Hub', color: 'sky',
    defaults: { title: 'Growing Readers Family Night', date: '', time: '5:30–7:00 PM', location: 'School library and classrooms', grades: 'K–5', families: 60, focus: 'Phonics, fluency, vocabulary, and comprehension', languages: 'English; add translated directions as needed' },
    stations: [
      ['Sound & Word Lab', 'Build and change words with letter tiles, sound boxes, and quick blending routines families can repeat at home.'],
      ['Fluency Fun', 'Practice echo reading, partner reading, phrasing, and repeated reading without timing or public comparison.'],
      ['Vocabulary Detective', 'Use pictures, context clues, word parts, and conversation to unlock interesting words.'],
      ['Comprehension Conversation', 'Try before-during-after questions, retelling cards, and “because” responses with a short text.'],
      ['Book Match & Choice', 'Help each child leave with appealing, appropriately supported reading choices—not a public reading level.'],
      ['Make-and-Take Reading Kit', 'Assemble sound cards, a fluency bookmark, question prompts, and a simple weekly reading routine.'],
    ],
    homeTips: ['Read together in the language that feels most comfortable.', 'Short, positive practice is more useful than long frustrated practice.', 'Ask children to explain their thinking rather than guessing quickly.', 'Rereading a familiar text builds confidence and fluency.', 'Celebrate effort, strategies, and book choice—not comparison.'],
  },
  math: {
    title: 'Math Intervention Family Night', shortTitle: 'Math Night Hub', color: 'lime',
    defaults: { title: 'Math Makes Sense Family Night', date: '', time: '5:30–7:00 PM', location: 'School cafeteria and classrooms', grades: 'K–8', families: 60, focus: 'Number sense, fact fluency, models, and problem solving', languages: 'English; add translated directions as needed' },
    stations: [
      ['Number Sense Playground', 'Build, compare, compose, and decompose quantities with counters, ten frames, number lines, and estimation.'],
      ['Fact Strategy Games', 'Play low-stress games that use known facts, doubles, making ten, and derived strategies instead of timed drills.'],
      ['Math Model Lab', 'Represent one idea with objects, drawings, equations, and words using a Concrete–Representational–Abstract sequence.'],
      ['Problem-Solving Studio', 'Notice, wonder, choose a strategy, and explain reasoning through an accessible real-world problem.'],
      ['Family Game Table', 'Use cards, dice, dominoes, and household objects for games adaptable across ages and ability levels.'],
      ['Make-and-Take Math Kit', 'Assemble a number line, game directions, strategy prompts, and a weekly family math routine.'],
    ],
    homeTips: ['Ask “How did you think about it?” before correcting.', 'Use objects and drawings before expecting abstract symbols.', 'Fluency means flexible, accurate strategies—not only speed.', 'Games and everyday routines can build math without worksheets.', 'Normalize mistakes as useful information for learning.'],
  },
}

export function generateFamilyNight(type, inputs) {
  const config = FAMILY_NIGHT_CONFIGS[type]
  const minutes = Math.max(8, Math.floor(60 / config.stations.length))
  return {
    title: inputs.title,
    subtitle: `${inputs.grades} · ${inputs.date || 'Date coming soon'} · ${inputs.location}`,
    sections: [
      { title: 'Run of show', items: ['Welcome families with a simple map, passport, and explanation that stations are flexible and low-pressure.', `Offer a short welcome every 20 minutes so late-arriving families can join easily.`, `Plan approximately ${minutes} minutes per station, but allow families to move at their own pace.`, 'Close with a take-home kit, one realistic weekly goal, and information about available school support.'] },
      { title: 'Family learning stations', items: config.stations.map(([title, desc], index) => `Station ${index + 1} — ${title}: ${desc}`) },
      { title: 'Materials', items: ['Large station signs and a one-page family passport', 'Hands-on materials sorted into labeled station bins', 'Pencils, clipboards, table covers, tape, and cleanup supplies', 'Take-home bags with simple directions and reusable materials', `Family directions: ${inputs.languages}`, 'Accessibility seating, visual directions, and a lower-sensory option'] },
      { title: 'Volunteer roles', items: ['Welcome and check-in team', 'Station facilitators who model without testing or correcting publicly', 'Materials and replenishment runner', 'Family navigator and accessibility support', 'Take-home kit and resource table helper', 'Cleanup, inventory, and follow-up team'] },
      { title: 'Interventionist safeguards', items: ['Do not post student groups, scores, service status, or reading/math levels.', 'Present strategies as useful for every family rather than labeling children by need.', 'Use strengths-based language and offer private follow-up conversations.', 'Keep activities choice-based and free from timed public competition.', 'Provide home ideas that require little or no special equipment.'] },
      { title: 'Family follow-up', items: config.homeTips },
    ],
    invitation: `You’re invited to ${inputs.title}!\n\nJoin us for hands-on ${type === 'reading' ? 'reading' : 'math'} games, practical family strategies, and take-home tools designed for ${inputs.grades}. Families can visit stations at their own pace—no tests and no pressure.\n\n${inputs.date || 'Date coming soon'} · ${inputs.time}\n${inputs.location}\n\nAll families are welcome.`,
  }
}
