let books = [
  ['catalog-1', 'The Wild Robot', 'Peter Brown', ['Science fiction', 'Adventure'], 3, 6, 'Novel', ['robots', 'nature', 'friendship'], 'Wild Robot'],
  ['catalog-2', 'Because of Winn-Dixie', 'Kate DiCamillo', ['Realistic fiction'], 3, 6, 'Novel', ['friendship', 'family', 'animals'], null],
  ['catalog-3', 'The One and Only Ivan', 'Katherine Applegate', ['Realistic fiction', 'Animal stories'], 3, 6, 'Novel', ['animals', 'friendship', 'hope'], null],
  ['catalog-4', 'Dog Man', 'Dav Pilkey', ['Humor', 'Adventure'], 2, 5, 'Graphic novel', ['funny', 'heroes', 'dogs'], 'Dog Man'],
  ['catalog-5', 'Ada Twist, Scientist', 'Andrea Beaty', ['Picture book', 'STEM'], 1, 4, 'Picture book', ['science', 'curiosity', 'inventors'], 'The Questioneers'],
  ['catalog-6', 'Who Would Win? Killer Whale vs. Great White Shark', 'Jerry Pallotta', ['Nonfiction'], 2, 5, 'Illustrated nonfiction', ['animals', 'ocean', 'facts'], 'Who Would Win?'],
  ['catalog-7', 'New Kid', 'Jerry Craft', ['Realistic fiction'], 5, 8, 'Graphic novel', ['school', 'friendship', 'belonging'], null],
  ['catalog-8', 'Front Desk', 'Kelly Yang', ['Historical fiction', 'Realistic fiction'], 4, 7, 'Novel', ['family', 'immigration', 'courage'], 'Front Desk'],
  ['catalog-9', 'Amari and the Night Brothers', 'B. B. Alston', ['Fantasy', 'Mystery'], 4, 7, 'Novel', ['magic', 'mystery', 'adventure'], 'Supernatural Investigations'],
  ['catalog-10', 'Hidden Figures: Young Readers Edition', 'Margot Lee Shetterly', ['Biography', 'Nonfiction'], 5, 9, 'Nonfiction', ['space', 'STEM', 'history'], null],
  ['catalog-11', 'The Book With No Pictures', 'B. J. Novak', ['Humor', 'Picture book'], 0, 4, 'Picture book', ['funny', 'read-aloud', 'words'], null],
  ['catalog-12', 'I Survived the Sinking of the Titanic, 1912', 'Lauren Tarshis', ['Historical fiction', 'Adventure'], 3, 6, 'Novel', ['history', 'survival', 'adventure'], 'I Survived'],
].map(([id, title, author, genres, grade_min, grade_max, format, themes, series]) => ({ id, title, author, genres, grade_min, grade_max, format, themes, series, available: true }))

export async function listLibraryCatalogBooks() { return structuredClone(books) }

export async function importLibraryCatalogBooks(rows) {
  const imported = rows.map((row, index) => ({
    id: `catalog-import-${books.length + index + 1}`, title: row.title, author: row.author || 'Unknown author',
    genres: row.genres ?? [], grade_min: row.gradeMin ?? null, grade_max: row.gradeMax ?? null,
    format: row.format || 'Book', themes: row.themes ?? [], series: row.series || null, available: row.available !== false,
  }))
  imported.forEach((row) => {
    const match = books.find((book) => book.title.toLowerCase() === row.title.toLowerCase() && book.author.toLowerCase() === row.author.toLowerCase())
    if (match) Object.assign(match, row, { id: match.id })
    else books.push(row)
  })
  return structuredClone(imported)
}

export async function updateLibraryCatalogBook(id, updates) {
  const row = books.find((book) => book.id === id)
  Object.assign(row, updates)
  return structuredClone(row)
}
