const template = (id, title, blurb, metric, goal, step = 1, targetMode = 'per_student', celebration = 'Certificates and a class celebration') => ({ id, title, blurb, metric, goal, step, targetMode, celebration })

export const PROGRAM_TEMPLATES = {
  Art: [
    template('art-sketchbook', '30-Day Sketchbook Quest', 'Short prompts build observation, imagination, and a sustainable creative habit.', 'prompts completed', 20),
    template('art-reuse', 'Recycled Art Design Challenge', 'Transform clean reused materials into purposeful art with a student artist statement.', 'design milestones', 5),
    template('art-community', 'Collaborative Mural Mission', 'Teams plan and contribute pieces to one shared visual story.', 'team sections', 12, 1, 'collective', 'Gallery walk and contributor certificates'),
  ],
  Music: [
    template('music-rhythm', 'Rhythm Quest', 'Complete progressively harder clap, play, create, and decode missions.', 'rhythm missions', 12),
    template('music-listening', 'Listening Passport', 'Explore music from varied cultures, eras, ensembles, and purposes.', 'listening stops', 10),
    template('music-compose', 'Mini-Composer Challenge', 'Create, revise, rehearse, and share a short original musical idea.', 'composition milestones', 5),
  ],
  'Theater / Drama': [
    template('theater-improv', 'Improv Mission Board', 'Build confidence through choice-based character, setting, and problem prompts.', 'improv missions', 10),
    template('theater-character', 'Character Detective Challenge', 'Collect evidence about objectives, obstacles, choices, voice, and movement.', 'character clues', 8),
    template('theater-tech', 'Tech Theater Quest', 'Explore safe design tasks across props, costumes, scenery, lighting, and sound.', 'design missions', 8),
  ],
  Dance: [
    template('dance-create', 'Choreography Challenge', 'Build a short sequence through levels, pathways, energy, timing, and relationships.', 'choreography milestones', 6),
    template('dance-passport', 'Dance Around the World Passport', 'Study and respectfully explore dance traditions and their cultural contexts.', 'passport stops', 8),
    template('dance-bingo', 'Movement Choice Bingo', 'Complete varied movement, reflection, and creative-choice squares.', 'bingo squares', 12),
  ],
  STEM: [
    template('stem-invention', 'Student Invention Challenge', 'Notice a problem, research users, prototype, test, improve, and pitch a solution.', 'design milestones', 7),
    template('stem-sprint', 'Weekly Design Sprint', 'Solve short building challenges while documenting evidence and iteration.', 'design sprints', 6),
    template('stem-code', 'Coding Quest', 'Complete creative coding missions that grow in complexity and student choice.', 'coding missions', 10),
  ],
  'Library & Media': [
    template('library-genre', 'Genre Passport', 'Explore unfamiliar genres and record authentic next-read choices.', 'genre stops', 8),
    template('library-research', 'Research Detective Quest', 'Practice questions, source checks, notes, citations, and evidence sharing.', 'research missions', 6),
    template('library-review', 'Book Recommendation Challenge', 'Create useful reviews, shelf-talkers, or book talks for other readers.', 'recommendations', 5),
  ],
  'World Languages': [
    template('language-speaking', 'Speaking Confidence Quest', 'Complete low-pressure partner, class, and real-life speaking missions.', 'speaking missions', 12),
    template('language-culture', 'Culture Passport', 'Investigate food, music, stories, places, celebrations, and daily life with source care.', 'culture stops', 8),
    template('language-vocab', 'Vocabulary in Action', 'Use target words in conversations, captions, signs, games, and mini-projects.', 'vocabulary missions', 15),
  ],
  CTE: [
    template('cte-career', 'Career Readiness Badge Quest', 'Practice communication, teamwork, safety, problem solving, and professional habits.', 'career badges', 8),
    template('cte-design', 'Industry Design Brief', 'Respond to an authentic client-style problem through planning, production, and reflection.', 'project milestones', 7),
    template('cte-workplace', 'Workplace Problem-Solving Sprint', 'Teams analyze realistic pathway scenarios and defend safe, ethical solutions.', 'team scenarios', 6),
  ],
  'Early Childhood / Pre-K': [
    template('early-kindness', 'Kindness Helpers Challenge', 'Notice, practice, and celebrate helpful classroom actions without public ranking.', 'kindness moments', 20, 1, 'collective'),
    template('early-outdoors', 'Little Explorers Quest', 'Use senses, movement, drawing, sorting, and questions during outdoor exploration.', 'exploration stops', 8),
    template('early-centers', 'Learning Center Passport', 'Encourage joyful choice across art, blocks, books, dramatic play, science, and sensory centers.', 'center visits', 10),
  ],
  'ESL/ELL Specialist': [
    template('esl-conversation', 'Conversation Confidence Quest', 'Practice meaningful language functions through supportive, choice-based interactions.', 'conversation missions', 12),
    template('esl-vocab', 'Vocabulary Scavenger Hunt', 'Find, photograph, draw, label, and use useful words around school and home.', 'word discoveries', 20),
    template('esl-story', 'My Multilingual Story Project', 'Plan and share a story using all available language resources.', 'story milestones', 6),
  ],
  'Gifted & Talented': [
    template('gt-passion', 'Passion Project Journey', 'Move from a compelling question to research, creation, expert feedback, and an authentic audience.', 'project milestones', 8),
    template('gt-logic', 'Logic & Puzzle League', 'Solve, explain, create, and compare multiple approaches to rich problems.', 'challenge rounds', 10),
    template('gt-community', 'Community Problem-Solving Challenge', 'Investigate a real need and develop a thoughtful, evidence-informed response.', 'team milestones', 7),
  ],
  'Reading Specialists': [
    template('reading-word', 'Word Investigator Quest', 'Explore sounds, spelling patterns, meaningful word parts, and word relationships.', 'word missions', 12),
    template('reading-vocab', 'Vocabulary Detective', 'Collect, connect, illustrate, and use high-value words across contexts.', 'word discoveries', 15),
    template('reading-comprehension', 'Comprehension Mission Board', 'Practice retelling, questioning, inferring, summarizing, and evidence-based responses.', 'reading missions', 10),
  ],
  'Math Specialists': [
    template('math-sense', 'Number Sense Mission Board', 'Build flexible quantity, place-value, estimation, and number-relation strategies.', 'math missions', 12),
    template('math-games', 'Family Math Game Challenge', 'Use cards, dice, dominoes, and household objects for low-stress strategy practice.', 'games played', 8),
    template('math-problem', 'Problem of the Week Journey', 'Notice, wonder, model, solve, explain, and compare approaches to rich problems.', 'problems explored', 6),
  ],
  'Test Prep': [
    template('test-strategy', 'Strategy Mission Challenge', 'Practice pacing, annotation, elimination, checking, and reflection with original items.', 'strategy missions', 10),
    template('test-confidence', 'Confidence & Readiness Streak', 'Build a realistic routine around practice, organization, sleep, and stress-management choices.', 'readiness actions', 15),
    template('test-team', 'Team Review Quest', 'Complete cooperative review rounds that reward explanation and growth, not public scores.', 'team rounds', 8, 1, 'collective'),
  ],
  'PE & Health': [
    template('pe-skill', 'Skill Adventure Challenge', 'Complete adaptable movement missions across locomotor, object-control, balance, and fitness skills.', 'skill missions', 15),
    template('pe-teamwork', 'Teamwork & Sportsmanship Quest', 'Notice and practice communication, encouragement, responsibility, and fair play.', 'teamwork moments', 20, 1, 'collective'),
    template('pe-active', 'Active Choice Bingo', 'Mix movement, outdoor play, mobility, mindfulness, and family activity choices.', 'bingo squares', 12),
  ],
}

export const GENERIC_PROGRAM_TEMPLATES = [
  template('generic-choice', 'Specialty Choice-Board Challenge', 'Complete a balanced set of create, practice, reflect, collaborate, and share missions.', 'missions completed', 12),
  template('generic-skill', 'Skill Builder Quest', 'Track consistent practice and visible growth toward one meaningful specialty skill.', 'practice milestones', 10),
  template('generic-team', 'Whole-Group Goal', 'Work toward one shared goal while keeping individual progress private to the teacher.', 'contributions', 100, 1, 'collective'),
]

export function getProgramTemplates(moduleLabel) {
  return [...(PROGRAM_TEMPLATES[moduleLabel] ?? []), ...GENERIC_PROGRAM_TEMPLATES]
}

export function buildProgramResources(moduleLabel, form) {
  return {
    directions: `Welcome to ${form.title}! Complete ${form.goalValue} ${form.metricPlural} between ${form.startsOn} and ${form.endsOn}. Choose safe, respectful ways to participate and ask your teacher when you need an adaptation. Progress matters more than comparison.`,
    familyMessage: `We are beginning ${form.title} in ${moduleLabel}. Students will work toward ${form.goalValue} ${form.metricPlural} through fun, age-appropriate activities. Please encourage effort, conversation, and a realistic routine. No special purchases are required.`,
    celebration: form.celebration,
    teacherChecklist: ['Choose the audience and connect a shared PlansK12 roster.', 'Explain the goal, choices, adaptations, and how progress will be recorded.', 'Print student challenge cards or display the shared tracker.', 'Log progress consistently without a public student leaderboard.', 'Celebrate growth, reflection, creativity, and contribution.', 'Save or export results for future planning.'],
  }
}
