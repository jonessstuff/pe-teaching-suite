const splitRow = (line) => line.includes('|') ? line.split('|') : line.includes('\t') ? line.split('\t') : line.split(',')

export function parseArtworkList(raw = '') {
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [student = '', grade = '', title = '', medium = ''] = splitRow(line).map((part) => part.trim())
    return { id: `artwork-${index + 1}`, student, grade, title: title || 'Untitled', medium: medium || 'Mixed media' }
  }).filter((item) => item.student || item.title !== 'Untitled')
}

const zonesFrom = (inputs, artworks) => {
  const artworkGrades = [...new Set(artworks.map((item) => item.grade).filter(Boolean))]
  const labels = artworkGrades.length ? artworkGrades : inputs.gradeBands.split(',').map((item) => item.trim()).filter(Boolean)
  const spaces = inputs.spaces.split(',').map((item) => item.trim()).filter(Boolean)
  return labels.map((label, index) => `${spaces[index % Math.max(1, spaces.length)] || inputs.location}: ${label} display zone — group work by class, leave a clear viewing path, and place labels at a consistent height.`)
}

export function generateArtShowPlan(inputs, artworks = []) {
  const zones = zonesFrom(inputs, artworks)
  const count = Math.max(artworks.length, Number(inputs.estimatedArtworks) || 0) || 100
  return {
    title: inputs.title,
    subtitle: `${inputs.theme} · ${inputs.date || 'Date to be announced'} · ${inputs.location}`,
    sections: [
      { title: 'Show vision', items: [`Theme: ${inputs.theme}. Use a consistent palette, title treatment, and welcome message throughout the show.`, `Plan for approximately ${count} artworks across ${zones.length || 1} display zones.`, `Featured experience: ${inputs.featuredActivity}.`, 'Design the route so visitors immediately understand where to begin, how to move, and where to exit.'] },
      { title: 'Display map', items: zones.length ? zones : [`${inputs.location}: Create clearly labeled grade or class zones with an accessible viewing path.`] },
      { title: 'Setup timeline', items: ['3–4 weeks before: confirm space, theme, dates, building access, and display rules.', '2 weeks before: collect artwork details, prepare labels, recruit volunteers, and send invitations.', '1 week before: sort work by zone, test hanging methods, print signs, and assemble a missing-work checklist.', '1–2 days before: install work, add labels, check lighting and traffic flow, and photograph each zone.', 'Event day: place welcome/wayfinding signs, set out feedback materials, brief volunteers, and complete a final safety walk.', 'After the show: document displays, return artwork safely, thank helpers, and save notes for next year.'] },
      { title: 'Supplies', items: ['Artwork labels and artist statements', 'Painter’s tape, mounting putty, clips, hooks, or approved hanging system', 'Backing paper, rulers, paper cutter, scissors, and markers', 'Welcome, directional, grade-zone, and “Please look—do not touch” signs', 'Volunteer bins labeled by task and display zone', 'Camera or phone for documentation and optional digital gallery', 'Repair kit: extra tape, labels, blank cards, adhesive, and cleaning cloth'] },
      { title: 'Volunteer jobs', items: ['Artwork intake: verify student/class/title/medium and flag missing information.', 'Mounting team: sort and hang work using the approved system.', 'Label team: match labels carefully and perform a name/title check.', 'Welcome team: greet visitors, share the route, and answer basic questions.', 'Gallery guides: monitor high-traffic zones and help families locate grades/classes.', 'Closing team: document displays, remove work safely, and sort it for return.'] },
      { title: 'Final checks', items: ['Every displayed piece has the correct label.', 'No student information beyond the school-approved display format is shown.', 'Walkways, exits, accessibility routes, and safety equipment remain clear.', 'Fragile or interactive work has clear instructions.', 'Family photo expectations follow school policy.', 'A return plan exists for every piece of artwork.'] },
    ],
    invitation: `You’re invited to ${inputs.title}!\n\nJoin us for an evening celebrating student creativity through ${inputs.theme.toLowerCase()}. Explore artwork from ${inputs.gradeBands}, enjoy ${inputs.featuredActivity.toLowerCase()}, and see our school transformed into a gallery.\n\n${inputs.date || 'Date coming soon'} · ${inputs.time || 'Time coming soon'}\n${inputs.location}\n\nFamilies, staff, and community members are welcome.`,
    newsletter: `${inputs.title} is coming! Our students are preparing a schoolwide celebration centered on “${inputs.theme}.” Families will be able to explore artwork from ${inputs.gradeBands}, read student artist statements, and enjoy ${inputs.featuredActivity.toLowerCase()}. Please save the date: ${inputs.date || 'date coming soon'} at ${inputs.time || 'time coming soon'} in ${inputs.location}.`,
    social: `🎨 Student creativity takes center stage at ${inputs.title}! Join us ${inputs.date ? `on ${inputs.date}` : 'soon'} at ${inputs.location} for artwork, artist voices, and ${inputs.featuredActivity.toLowerCase()}. #StudentArtists #SchoolArtShow #PlansK12`,
  }
}
