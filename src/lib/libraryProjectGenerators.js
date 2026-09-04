const bookLine = (book) => `${book.title} — ${book.author}${book.genres?.[0] ? ` (${book.genres[0]})` : ''}`

const pickBooks = (inputs, catalog, count = 6) => {
  const selected = (catalog ?? []).filter((book) => (inputs.bookIds ?? []).includes(book.id) && book.available !== false)
  return (selected.length ? selected : (catalog ?? []).filter((book) => book.available !== false)).slice(0, count)
}

export const LIBRARY_PROJECT_CONFIGS = {
  book_tasting: {
    title: 'Book Tasting Studio', eyebrow: 'Reader engagement', color: 'amber', usesCatalog: true,
    description: 'Turn books from your own shelves into a complete tasting event with stations, table cards, a student passport, and follow-up choices.',
    defaults: { title: 'A Taste of Great Books', grade: '4', minutes: '45', stations: '4', theme: 'Book Bistro', bookIds: [] },
    fields: [
      { key: 'title', label: 'Event title', type: 'text' },
      { key: 'grade', label: 'Grade', type: 'select', options: ['K','1','2','3','4','5','6','7','8'] },
      { key: 'minutes', label: 'Total minutes', type: 'number' },
      { key: 'stations', label: 'Number of stations', type: 'select', options: ['3','4','5','6'] },
      { key: 'theme', label: 'Tasting theme', type: 'select', options: ['Book Bistro','Genre Café','Reading Picnic','Mystery Menu','Around the World'] },
    ],
    generate(inputs, catalog) {
      const books = pickBooks(inputs, catalog, Number(inputs.stations) || 4)
      return {
        title: inputs.title,
        subtitle: `${inputs.theme} · Grade ${inputs.grade} · ${inputs.minutes} minutes`,
        sections: [
          { title: 'Host plan', items: [`Welcome readers and explain that today they are sampling—not finishing—several books.`, `Allow about ${Math.max(5, Math.floor(Number(inputs.minutes) / Math.max(1, Number(inputs.stations))))} minutes at each station.`, 'At every station: study the cover, read the summary, sample one page, then record a reaction.', 'End with a “next read” choice and a quick table share.'] },
          { title: 'Tasting stations', items: books.map((book, index) => `Station ${index + 1}: ${bookLine(book)} — Notice the cover clues, read one page, and decide: “Would I keep reading? Why?”`) },
          { title: 'Student tasting passport', items: ['Book title and author', 'Three words that describe the book', 'A detail that made me curious', 'My rating: Not yet / Maybe / Yes, please!', 'My first-choice next read and one backup choice'] },
          { title: 'Table setup', items: ['One featured book at each station', 'Genre or theme table sign', 'Pencils and one passport per reader', 'Optional tablecloths, menus, battery candles, or placemats', 'A clearly labeled return spot so books stay organized'] },
          { title: 'Follow-up', items: ['Reserve first-choice books when possible.', 'Use backup choices when a title has multiple requests.', 'Display the class’s most-requested genres without publicly ranking individual readers.', 'Save passports as evidence of reading interests for future displays and recommendations.'] },
        ],
      }
    },
  },
  teacher_collaboration: {
    title: 'Teacher Collaboration Hub', eyebrow: 'Curriculum connection', color: 'cobalt', usesCatalog: true,
    description: 'Turn an upcoming classroom topic into a curated book bundle, library mini-lesson, research connection, and ready-to-send teacher message.',
    defaults: { title: 'Grade 4 Ecosystems Collaboration', teacher: 'Grade 4 Team', grade: '4', topic: 'Ecosystems and animal adaptations', skill: 'Research and source evaluation', timing: 'Two library visits', bookIds: [] },
    fields: [
      { key: 'title', label: 'Collaboration name', type: 'text' }, { key: 'teacher', label: 'Teacher or team', type: 'text' },
      { key: 'grade', label: 'Grade', type: 'select', options: ['K','1','2','3','4','5','6','7','8','9','10','11','12'] },
      { key: 'topic', label: 'Classroom unit or topic', type: 'textarea' },
      { key: 'skill', label: 'Library/research skill', type: 'select', options: ['Research and source evaluation','Genre study','Digital citizenship','Media literacy','Note-taking and citation','Inquiry and question development'] },
      { key: 'timing', label: 'Time available', type: 'select', options: ['One library visit','Two library visits','Three connected visits','A full unit'] },
    ],
    generate(inputs, catalog) {
      const books = pickBooks(inputs, catalog, 6)
      const email = `Subject: Library collaboration for ${inputs.topic}\n\nHi ${inputs.teacher},\n\nI put together a library connection for your upcoming ${inputs.topic} work. I can provide a curated book bundle, a ${inputs.skill.toLowerCase()} mini-lesson, and student-ready research support across ${inputs.timing.toLowerCase()}.\n\nSuggested books:\n${books.map((book) => `• ${book.title} by ${book.author}`).join('\n')}\n\nLet me know which timing works best and whether there is a specific standard or product you want students to complete.\n\nThanks!`
      return {
        title: inputs.title, subtitle: `${inputs.teacher} · Grade ${inputs.grade} · ${inputs.timing}`, email,
        sections: [
          { title: 'Curated collection', items: books.map((book) => `${bookLine(book)} — Use as a read-aloud, research source, browsing choice, or text-set connection to ${inputs.topic}.`) },
          { title: 'Library learning target', items: [`Students will use ${inputs.skill.toLowerCase()} to build understanding of ${inputs.topic}.`, 'Students will explain why a source or book fits their information need.', 'Students will leave with one usable fact, question, or text connection.'] },
          { title: 'Visit plan', items: ['Launch with a high-interest image, object, question, or short read-aloud.', `Model one ${inputs.skill.toLowerCase()} move using a selected text.`, 'Release students to browse the curated bundle or source set.', 'Close with an exit response the classroom teacher can use next.'] },
          { title: 'Teacher-ready handoff', items: ['Book list with formats and reading ranges', 'Mini-lesson learning target and success criteria', 'Student organizer or source-check tool', 'Suggested classroom follow-up', 'Optional family reading connection'] },
        ],
      }
    },
  },
  family_literacy_night: {
    title: 'Family Literacy Night Planner', eyebrow: 'Community program', color: 'rose', usesCatalog: false,
    description: 'Create a joyful, manageable family event with stations, timing, volunteers, materials, promotion, and take-home reading ideas.',
    defaults: { title: 'Reading Under the Stars', theme: 'Reading Under the Stars', date: 'Thursday, October 15', minutes: '75', families: '100', spaces: 'Library, cafeteria, and two hallways' },
    fields: [
      { key: 'title', label: 'Event title', type: 'text' },
      { key: 'theme', label: 'Theme', type: 'select', options: ['Reading Under the Stars','Camp Read-a-Lot','Books Around the World','Storybook Carnival','Family Book Bistro','Super Readers Unite'] },
      { key: 'date', label: 'Date and time', type: 'text' }, { key: 'minutes', label: 'Event length (minutes)', type: 'number' },
      { key: 'families', label: 'Expected attendance', type: 'number' }, { key: 'spaces', label: 'Available spaces', type: 'textarea' },
    ],
    generate(inputs) {
      const email = `Subject: Join us for ${inputs.title}!\n\nFamilies are invited to ${inputs.title} on ${inputs.date}. Drop in for stories, games, book exploration, and simple reading activities you can enjoy together. All activities are free, and families may rotate at their own pace. We cannot wait to read with you!`
      return {
        title: inputs.title, subtitle: `${inputs.date} · ${inputs.minutes} minutes · approximately ${inputs.families} guests`, email,
        sections: [
          { title: 'Run of show', items: ['Doors open, welcome families, and provide a simple station map.', 'Offer a five-minute kickoff every 20 minutes for families arriving at different times.', 'Keep stations open for self-paced rotation.', 'Announce the final 10 minutes and direct families to take-home resources.', 'Close with thank-yous and a clear materials-return plan.'] },
          { title: 'Family stations', items: [`Theme welcome: photo spot and “What are you reading?” board for ${inputs.theme}.`, 'Read-aloud corner: repeated short readings so late arrivals can join.', 'Book match station: families choose interests and receive a next-read suggestion.', 'Make-and-take: bookmark, story cube, or character puppet.', 'Family reading game: picture-book scavenger hunt or genre bingo.', 'Take-home station: reading tips, library access information, and upcoming events.'] },
          { title: 'Volunteer jobs', items: ['Greeter and map helper', 'Read-aloud host', 'Book match helper', 'Make-and-take materials monitor', 'Hallway wayfinding helper', 'Refresh and cleanup team', 'Photographer only if school permissions and policy allow'] },
          { title: 'Materials and setup', items: [`Plan traffic through: ${inputs.spaces}.`, 'Large station signs and arrows', 'Name-free participation cards or passports', 'Books displayed face-out at multiple heights', 'Pencils, clipboards, art materials, and table bins', 'Accessibility seating and a lower-sensory option', 'Take-home family handouts in needed languages'] },
          { title: 'Family handout', items: ['Let your child choose—even if the book seems easy, funny, or familiar.', 'Talk about pictures, predictions, favorite moments, and questions.', 'Stop while reading is still enjoyable.', 'Rereading builds confidence and comprehension.', 'Ask your librarian for help finding the next great book.'] },
        ],
      }
    },
  },
  research_quest: {
    title: 'Research Quest Builder', eyebrow: 'Inquiry learning', color: 'emerald', usesCatalog: false,
    description: 'Turn a topic into a student-friendly inquiry mission with source checks, note-taking, citations, checkpoints, and an authentic final product.',
    defaults: { title: 'Protect a Local Habitat', grade: '5', topic: 'How can our community protect a local habitat?', skill: 'Evaluating sources', sources: 'Library books and two teacher-approved websites', sessions: '3', product: 'One-page action proposal' },
    fields: [
      { key: 'title', label: 'Quest title', type: 'text' }, { key: 'grade', label: 'Grade', type: 'select', options: ['2','3','4','5','6','7','8','9','10','11','12'] },
      { key: 'topic', label: 'Driving question or topic', type: 'textarea' },
      { key: 'skill', label: 'Primary research skill', type: 'select', options: ['Developing research questions','Evaluating sources','Note-taking and paraphrasing','Citing sources','Comparing sources','Media literacy and bias'] },
      { key: 'sources', label: 'Sources students may use', type: 'textarea' }, { key: 'sessions', label: 'Library sessions', type: 'select', options: ['1','2','3','4','5'] },
      { key: 'product', label: 'Final product', type: 'text' },
    ],
    generate(inputs) {
      return {
        title: inputs.title, subtitle: `Grade ${inputs.grade} · ${inputs.sessions} session${inputs.sessions === '1' ? '' : 's'} · ${inputs.skill}`,
        sections: [
          { title: 'Mission briefing', items: [`Driving question: ${inputs.topic}`, `Your mission is to investigate credible information and create a ${inputs.product}.`, `Approved source types: ${inputs.sources}.`, 'Success means your conclusion is supported by evidence—not simply an opinion.'] },
          { title: 'Quest checkpoints', items: ['Checkpoint 1 — Question: write one focused research question and two helpful subquestions.', 'Checkpoint 2 — Search: choose useful keywords and locate at least two appropriate sources.', `Checkpoint 3 — Source check: apply ${inputs.skill.toLowerCase()} before taking notes.`, 'Checkpoint 4 — Evidence: record facts in your own words and connect each note to its source.', `Checkpoint 5 — Create: organize evidence into the ${inputs.product}.`, 'Checkpoint 6 — Reflect: identify the strongest source and explain why it was trustworthy.'] },
          { title: 'Source detective check', items: ['WHO created this and what expertise do they have?', 'WHEN was it published or updated?', 'WHY was it created—to inform, sell, entertain, or persuade?', 'WHAT evidence or sources does it provide?', 'CAN the important information be confirmed somewhere else?'] },
          { title: 'Student note organizer', items: ['My research question', 'Source title, author/organization, and link or call number', 'Important fact in the source', 'My paraphrase in my own words', 'How this evidence answers my question', 'Citation information I will need later'] },
          { title: 'Success criteria', items: [`The ${inputs.product} clearly answers the driving question.`, 'Ideas are supported with accurate evidence from more than one source.', 'Notes are paraphrased instead of copied.', 'Sources are credited in the format taught by the librarian.', 'The final product is organized for its intended audience.'] },
        ],
      }
    },
  },
}
