const today = () => new Date().toISOString().slice(0, 10)

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

const commonDefaults = (title, focus) => ({
  title,
  templateId: '',
  date: addDays(today(), 45),
  time: '5:30–7:00 PM',
  location: 'School campus',
  audience: 'Students and families',
  participants: 100,
  focus,
  notes: '',
})

export const EXPERIENCE_CONFIGS = {
  'pe-events': {
    moduleLabel: 'PE & Health', moduleSlug: 'pe-health', shortTitle: 'PE Events Studio',
    eyebrow: 'Field days & family fitness', accent: 'emerald',
    description: 'Run an inclusive Field Day, Family Fitness Night, or schoolwide wellness event with staff roles, safety, communication, schedules, and printables in one place.',
    defaults: commonDefaults('Family Fitness Night', 'Inclusive movement, family connection, choice, confidence, and lifelong wellness'),
    templates: [
      { id: 'field-day', title: 'Field Day Operations Studio', description: 'Plan the people, stations, movement, safety, communication, and event-day details together.', focus: 'Inclusive play, teamwork, safe movement, and a joyful schoolwide celebration', signature: ['Use the Games & Stations tab to create or refine activities and rotation plans.', 'Build grade-level arrival, team movement, water, restroom, shade, and dismissal systems.', 'Plan indoor, heat, air-quality, and severe-weather alternatives before event day.'] },
      { id: 'family-fitness', title: 'Family Fitness Night', description: 'A welcoming evening of movement stations families can choose and enjoy together.', focus: 'Inclusive movement, family connection, choice, confidence, and lifelong wellness', signature: ['Offer choice-based stations across cardio, strength, balance, mobility, rhythm, and play.', 'Design every activity so family members can participate at different ages and ability levels.', 'Keep progress private and celebrate participation—never bodies, weight, speed, or public rankings.'] },
      { id: 'wellness-fair', title: 'Family Wellness Fair', description: 'Blend movement, health learning, community partners, and take-home routines.', focus: 'Whole-person wellness, community resources, health literacy, and sustainable routines', signature: ['Pair movement stations with short, practical wellness learning and community resources.', 'Invite approved school/community partners without allowing sales pressure or unsupported health claims.', 'Create a family wellness passport based on choices completed, questions asked, and reflection.'] },
    ],
    sections: [
      { title: 'Event design & inclusion', items: ['Choose activities that support {focus} for {audience}.', 'Provide seated, lower-impact, sensory-aware, and alternate-role options at every area.', 'Design clear visual directions so families and volunteers can begin quickly.'] },
      { title: 'Safety & operations', items: ['Map traffic flow, boundaries, surfaces, equipment, water, restrooms, shade, first aid, and emergency access.', 'Confirm supervision, check-in, student release, medication, allergy, weather, and reunification procedures.', 'Test equipment and create a rapid reset, sanitation, and broken-equipment process.'] },
      { title: 'Staff, volunteers & families', items: ['Assign event lead, station leaders, floaters, accessibility support, first aid, and cleanup.', 'Give every volunteer a one-page station card with cues, adaptations, safety, and reset steps.', 'Send arrival, clothing, accessibility, parking, participation choice, and weather information.'] },
      { title: 'Celebration & follow-through', items: ['Use music, signs, class recognition, and encouragement without public performance rankings.', 'Collect a short family/student reflection about enjoyment, confidence, and future movement.', 'Save improvements, supply counts, incident notes, and successful adaptations for next year.'] },
    ],
    schedule: [['4:30 PM','Equipment, boundaries, water, first aid, and weather check','Event lead'],['5:00 PM','Volunteer briefing and station practice','PE team'],['5:30 PM','Family/student arrival and choice map','Welcome team'],['5:40 PM','Open stations and movement experiences','Station leaders'],['6:40 PM','Whole-group celebration and reflection','PE teacher'],['7:00 PM','Safe release, equipment inventory, and cleanup','All teams']],
    roles: ['Event lead','Station leaders','Welcome/check-in','Accessibility and inclusion support','First aid/water/weather lead','Equipment reset and cleanup'],
  },
  'stem-night': {
    moduleLabel: 'STEM', moduleSlug: 'stem', shortTitle: 'STEM Night Studio',
    eyebrow: 'Family STEM experiences', accent: 'cyan',
    description: 'Build a schoolwide STEM night with hands-on stations, realistic supplies, volunteers, safety, family directions, and a complete event kit.',
    defaults: commonDefaults('Family STEM Discovery Night', 'Hands-on problem solving, engineering, coding, and scientific thinking'),
    templates: [
      { id: 'discovery-night', title: 'Family STEM Discovery Night', description: 'A balanced rotation of science, technology, engineering, and math stations.', focus: 'Hands-on problem solving, engineering, coding, and scientific thinking', signature: ['Offer 5–8 short stations with different entry points and minimal wait time.', 'Give every family a discovery passport and a choose-your-own-route map.', 'Include one collaborative build that grows throughout the evening.'] },
      { id: 'engineering-night', title: 'Engineering Design Night', description: 'Families define problems, build prototypes, test, and improve together.', focus: 'Engineering design process, iteration, teamwork, and explaining design choices', signature: ['Choose one welcoming design problem with multiple successful solutions.', 'Prepare low-cost material trays and clearly marked testing zones.', 'Create a redesign station so revision—not first-try perfection—is celebrated.'] },
      { id: 'invention-showcase', title: 'Student Invention Showcase', description: 'An event for displaying inventions already created through the STEM challenge.', focus: 'Student inventions, prototypes, feedback, and authentic presentation', signature: ['Use the existing Student Invention Challenge to create the work before this event.', 'Set up inventor tables with problem, user, prototype, testing, and next-step prompts.', 'Give visitors kind, specific feedback cards instead of public rankings.'] },
    ],
    sections: [
      { title: 'Experience design', items: ['Choose stations that work for {audience} and connect to {focus}.', 'Plan a clear arrival, route choice, and closing experience.', 'Add accessible low-floor/high-ceiling options at every station.'] },
      { title: 'Materials & safety', items: ['Create one labeled supply bin per station plus a rapid-reset bin.', 'Post age, supervision, tool, allergy, and cleanup guidance.', 'Test every station with the actual time and materials available.'] },
      { title: 'Families & volunteers', items: ['Recruit station leads, floaters, greeters, photographers, and cleanup support.', 'Give volunteers a one-page prompt card instead of a long script.', 'Provide take-home challenges that use ordinary household materials.'] },
      { title: 'Celebration & evidence', items: ['Display student thinking, prototypes, revisions, and reflections—not only polished products.', 'Collect a quick family exit response and student reflection.', 'Save photos only under school policy and never include student names in public materials.'] },
    ],
    schedule: [['5:00 PM','Volunteer setup and safety walk-through','Event lead'],['5:30 PM','Welcome, map, and station choice','Greeters'],['5:40 PM','Open exploration and challenges','Station leads'],['6:40 PM','Collaborative finale and reflection','STEM teacher'],['7:00 PM','Family exit response and cleanup','All volunteers']],
    roles: ['Event lead','Station leads','Welcome/check-in','Supply reset floaters','Accessibility/family support','Cleanup team'],
  },
  'music-concert': {
    moduleLabel: 'Music', moduleSlug: 'music', shortTitle: 'Concert Builder',
    eyebrow: 'Performance planning', accent: 'violet',
    description: 'Turn a concert idea into a rehearsal calendar, program order, stage plan, family communication, equipment list, and performance-day run sheet.',
    defaults: commonDefaults('Spring Music Celebration', 'A joyful, age-appropriate performance that shows musical growth'),
    templates: [
      { id: 'seasonal-concert', title: 'Seasonal School Concert', description: 'A polished winter or spring performance for multiple classes or ensembles.', focus: 'Ensemble performance, musical growth, and a smooth family experience', signature: ['Balance familiar selections, skill-showcase pieces, and one memorable finale.', 'Limit transitions by grouping instruments, risers, and grade-level movement.', 'Check copyright, licensing, accompaniment, recording, and livestream permissions.'] },
      { id: 'grade-showcase', title: 'Grade-Level Music Showcase', description: 'A shorter performance designed around one grade or course.', focus: 'Visible curriculum learning through singing, playing, moving, and creating', signature: ['Organize the program around skills students learned, not a random song list.', 'Include one brief student explanation or demonstration between selections.', 'Keep the total program family-friendly and developmentally appropriate.'] },
      { id: 'informance', title: 'Family Informance', description: 'An interactive look inside the learning process with audience participation.', focus: 'Showing how students rehearse, listen, create, and improve', signature: ['Demonstrate a warm-up, rehearsal strategy, and before/after improvement.', 'Invite families into one simple rhythm, movement, or listening experience.', 'Use student reflection to explain what changed through practice.'] },
    ],
    sections: [
      { title: 'Program & pacing', items: ['Confirm the purpose, audience, length, and program arc for {title}.', 'Choose repertoire that fits student readiness and permission requirements.', 'Write transition cues, speaking parts, and contingency cuts.'] },
      { title: 'Rehearsal plan', items: ['Back-map sectionals, combined rehearsals, stage rehearsals, and dress rehearsal.', 'Track readiness by selection, transition, equipment, and student leadership.', 'Plan voice, hearing, mobility, sensory, and participation adaptations.'] },
      { title: 'Stage & equipment', items: ['Map risers, chairs, stands, instruments, microphones, entrances, and exits.', 'Create labeled equipment zones and a student-safe backstage traffic pattern.', 'Prepare backup audio, batteries, cables, copies, and emergency substitutions.'] },
      { title: 'Family experience', items: ['Send arrival, attire, parking, accessibility, and pickup directions.', 'Create a concise program with curriculum notes and student acknowledgments.', 'Share recording/photo expectations and celebrate every student contribution.'] },
    ],
    schedule: [['4:30 PM','Room, riser, sound, and instrument setup','Director/crew'],['5:00 PM','Student call and attendance','Grade leads'],['5:15 PM','Warm-up and transition check','Music teacher'],['5:45 PM','Doors open and preshow music','Front of house'],['6:00 PM','Performance begins','Stage manager'],['7:00 PM','Dismissal, equipment check, and reset','All teams']],
    roles: ['Director','Accompanist/audio lead','Stage manager','Grade/ensemble leads','Front of house','Equipment and reset crew'],
  },
  'theater-production': {
    moduleLabel: 'Theater / Drama', moduleSlug: 'theater', shortTitle: 'Production Planner',
    eyebrow: 'Play & performance production', accent: 'rose',
    description: 'Organize auditions, casting, rehearsal, technical theatre, front of house, performance week, and reflection in one production workspace.',
    defaults: commonDefaults('Student Theater Showcase', 'Ensemble storytelling, performance skills, production responsibility, and reflection'),
    templates: [
      { id: 'school-play', title: 'School Play or Musical', description: 'A full production timeline from rights and auditions through strike.', focus: 'A safe, inclusive, student-centered theatrical production', signature: ['Secure performance rights and confirm all licensing restrictions before rehearsing.', 'Use transparent audition criteria and offer meaningful ensemble/crew pathways.', 'Publish one master calendar for cast, crew, families, and shared spaces.'] },
      { id: 'scene-showcase', title: 'Scenes & Monologues Showcase', description: 'A flexible performance night for original or properly licensed material.', focus: 'Character, voice, movement, ensemble, and audience communication', signature: ['Curate a varied running order with age-appropriate content and permissions.', 'Use original, public-domain, or properly licensed performance material.', 'Plan fast transitions with minimal furniture and clear preset zones.'] },
      { id: 'devised-night', title: 'Devised or Improv Night', description: 'Student-created work with structures that keep performances safe and focused.', focus: 'Original creation, collaboration, improvisation, and responsive ensemble work', signature: ['Create content agreements, boundaries, and a teacher-approved performance structure.', 'Assign facilitation, timekeeping, audience prompt, and safety roles.', 'Build reflection and revision into every rehearsal cycle.'] },
    ],
    sections: [
      { title: 'Rights, auditions & casting', items: ['Confirm rights, content, budget, dates, space, and adult supervision.', 'Publish accessible audition expectations and an equitable scoring rubric.', 'Communicate cast, crew, understudy, and student leadership responsibilities.'] },
      { title: 'Rehearsal system', items: ['Back-map table work, blocking, scene work, runs, tech, dress, and notes.', 'Create a daily call sheet with who is needed, where, and for how long.', 'Track conflicts, line/scene readiness, safety, and accommodations privately.'] },
      { title: 'Technical production', items: ['Plan scenery, props, costumes, lighting, sound, projections, and safe changeovers.', 'Assign build deadlines, storage, presets, checklists, and student crew training.', 'Complete risk checks for tools, rigging, electricity, movement, and audience areas.'] },
      { title: 'Performance & closure', items: ['Build front-of-house, ticketing, accessibility, emergency, and dismissal plans.', 'Create a cue-to-cue and performance run sheet with named adult supervision.', 'Schedule strike, inventory, student reflection, recognition, and archive notes.'] },
    ],
    schedule: [['4:30 PM','Space safety, presets, sound, and lighting check','Stage manager'],['5:00 PM','Cast/crew call and attendance','Production lead'],['5:15 PM','Fight/movement/vocal warm-up and notes','Director'],['5:45 PM','House opens','Front of house'],['6:00 PM','Performance and intermission cues','Stage manager'],['7:30 PM','Audience release, notes, and reset','Company']],
    roles: ['Director/teacher','Stage manager','Cast leads','Technical director/crew','Front of house','Family communication and supervision'],
  },
  'dance-recital': {
    moduleLabel: 'Dance', moduleSlug: 'dance', shortTitle: 'Dance Team & Recital Studio',
    eyebrow: 'Performance and team planning', accent: 'amber',
    description: 'Plan a school showcase, studio recital, or dance-team season with choreography, rehearsals, costumes, safety, communication, and performance-day logistics.',
    defaults: commonDefaults('Dance Celebration Showcase', 'Safe performance, choreography, teamwork, musicality, and student growth'),
    templates: [
      { id: 'school-showcase', title: 'School Dance Showcase', description: 'A welcoming performance for classes, clubs, or multiple grade levels.', focus: 'Student choreography, performance growth, and inclusive participation', signature: ['Build a program arc with varied styles, groups, and student-created work.', 'Plan safe spacing, entrances, exits, transitions, and backstage supervision.', 'Offer nonperformance roles and adaptations without lowering belonging.'] },
      { id: 'studio-recital', title: 'Private Studio Recital', description: 'A recital system for studio owners managing multiple classes and families.', focus: 'A polished, family-friendly recital with clear studio operations', signature: ['Organize routines by age, costume, prop, teacher, and backstage traffic.', 'Create family packets for call time, attire, tickets, photos, and pickup.', 'Plan recital week staffing, dressing areas, music backups, and emergency changes.'] },
      { id: 'team-season', title: 'Dance Team Season Planner', description: 'Build a season calendar for tryouts, practices, performances, and team culture.', focus: 'Team growth, safe training, performance readiness, and positive culture', signature: ['Connect tryout scoring to the existing Coaching & Tryouts workspace when useful.', 'Plan conditioning, technique, choreography, recovery, and performance cycles.', 'Publish expectations for attendance, communication, attire, travel, and leadership.'] },
    ],
    sections: [
      { title: 'Program or season design', items: ['Define the purpose, performers, audience, length, and success criteria.', 'Map choreography, music edits, formations, student leadership, and transitions.', 'Confirm music rights, recording expectations, and age-appropriate movement choices.'] },
      { title: 'Rehearsal & wellness', items: ['Back-map learning, cleaning, spacing, costume, tech, and dress rehearsals.', 'Build warm-up, conditioning, recovery, hydration, and injury-response routines.', 'Plan participation options and accommodations with student dignity.'] },
      { title: 'Costumes & production', items: ['Track costumes, sizing, modesty needs, props, shoes, music, lighting, and floors.', 'Create labeled changing/preset zones with appropriate adult supervision.', 'Prepare backup music, costume repair, first aid, cleaning, and lost-item systems.'] },
      { title: 'Families & performance day', items: ['Send call time, attire, hair/makeup choice, parking, tickets, accessibility, and pickup details.', 'Create a backstage flow, performer check-in, audience release, and reunification plan.', 'Celebrate improvement, artistry, teamwork, and contribution—not body type or public rankings.'] },
    ],
    schedule: [['3:30 PM','Floor, sound, costume, and safety check','Director/studio owner'],['4:00 PM','Performer check-in and dressing areas','Class/team leads'],['4:30 PM','Warm-up, spacing, and transition run','Dance teachers'],['5:30 PM','House opens','Front of house'],['6:00 PM','Performance begins','Stage manager'],['7:30 PM','Safe pickup, costume check, and reset','All teams']],
    roles: ['Director/studio owner','Choreographers/class leads','Stage manager','Backstage/dressing-area leads','Front of house','Wellness and safe-pickup team'],
  },
  'cte-experiences': {
    moduleLabel: 'CTE', moduleSlug: 'cte', shortTitle: 'Career Experiences Hub',
    eyebrow: 'Field trips, job shadows & internships', accent: 'pink',
    description: 'Turn industry connections into safe, curriculum-aligned field trips, job shadows, and internship systems with partner communication and student preparation.',
    defaults: commonDefaults('CTE Career Experience', 'Career awareness, technical skills, employability skills, and authentic reflection'),
    templates: [
      { id: 'field-trip', title: 'Industry Field Trip', description: 'A focused workplace, restaurant, lab, shop, college, or career-center visit.', focus: 'Career awareness, workplace expectations, technical observation, and reflection', signature: ['Choose a site connected to current pathway competencies and student interests.', 'Give students observation questions and a professional interaction task.', 'Plan transportation, accessibility, food/allergy, supervision, and emergency details.'] },
      { id: 'job-shadow', title: 'Job Shadow Day', description: 'Short individual or small-group observation with structured preparation.', focus: 'Workplace roles, employability skills, career pathways, and professional communication', signature: ['Match students and hosts using interests, access needs, and approved school processes.', 'Prepare students for confidentiality, safety, dress, questions, and thank-you communication.', 'Collect host and student feedback without storing protected information in public materials.'] },
      { id: 'internship-launch', title: 'Internship Program Launch', description: 'A repeatable system for partners, placements, goals, check-ins, and evidence.', focus: 'Work-based learning goals, employability skills, technical growth, and reflection', signature: ['Define eligibility, placement, hours, supervision, insurance, and required documentation.', 'Create shared expectations for students, families, employers, and school coordinators.', 'Use regular check-ins, learning evidence, employer feedback, and a final presentation.'] },
    ],
    sections: [
      { title: 'Learning alignment', items: ['Connect the experience to pathway competencies, employability skills, and {focus}.', 'Write student-friendly learning targets, observation prompts, and reflection evidence.', 'Plan pre-teaching so students understand the industry context before arrival.'] },
      { title: 'Approvals, safety & access', items: ['Follow district approval, permission, transportation, insurance, health, and emergency procedures.', 'Confirm site hazards, PPE, supervision ratios, accessibility, language, and student support.', 'Store confidential student information only in district-approved systems.'] },
      { title: 'Partner & student preparation', items: ['Confirm host contact, agenda, group size, arrival, dress, photography, and restricted areas.', 'Teach professional introductions, questions, conduct, device use, and gratitude.', 'Prepare backup activities and an alternate plan for students unable to attend.'] },
      { title: 'Evidence & follow-through', items: ['Collect reflection, skill evidence, partner feedback, and next-step career questions.', 'Send a professional thank-you and preserve the partner relationship for future classes.', 'Use results to improve access, preparation, curriculum connections, and future placements.'] },
    ],
    schedule: [['8:00 AM','Attendance, permissions, PPE, and expectations','CTE teacher'],['8:30 AM','Travel and site arrival','School team'],['9:00 AM','Welcome, safety orientation, and industry overview','Host partner'],['9:30 AM','Tour, shadow, stations, or workplace task','Host mentors'],['11:30 AM','Career Q&A and student reflection','Teacher/host'],['12:00 PM','Return, debrief, and follow-up task','CTE teacher']],
    roles: ['School coordinator','Host partner contact','Teachers/chaperones','Transportation/office contact','Student team leads','Accessibility and emergency support'],
  },
  'world-language-experiences': {
    moduleLabel: 'World Languages', moduleSlug: 'world-languages', shortTitle: 'Cultural Experiences Studio',
    eyebrow: 'Language beyond the classroom', accent: 'emerald',
    description: 'Plan restaurant visits, museum and community experiences, or larger language-learning trips with communication goals, cultural preparation, safety, family information, and reflection.',
    defaults: commonDefaults('Community Language & Culture Experience', 'Authentic communication, intercultural reflection, curiosity, and respectful participation'),
    templates: [
      { id: 'restaurant', title: 'Restaurant Language Experience', description: 'A school-approved restaurant visit or classroom simulation centered on real communication.', focus: 'Interpersonal language, food traditions, etiquette, and respectful cultural comparison', signature: ['Choose a venue or simulation that supports meaningful target-language interaction.', 'Prepare menus, sentence supports, dietary/allergy information, cost expectations, and tipping/payment procedures.', 'Teach students to discuss cultural practices without stereotypes or treating one experience as universal.'] },
      { id: 'museum-community', title: 'Museum or Community Cultural Visit', description: 'Connect language learning with art, history, community, performance, or heritage resources.', focus: 'Interpretive language, cultural perspectives, community voices, and inquiry', signature: ['Select exhibits, performances, neighborhoods, or community partners connected to current learning.', 'Create observation prompts and language missions that focus attention without turning people into attractions.', 'Confirm photography, translation, accessibility, group movement, and partner expectations.'] },
      { id: 'travel', title: 'Extended Language-Learning Trip', description: 'Organize a larger regional, national, or international learning experience.', focus: 'Language immersion, intercultural competence, independence, and authentic reflection', signature: ['Follow all district approval, vendor, passport, insurance, supervision, and emergency requirements.', 'Build a realistic financial-access plan so cost does not quietly decide who can participate.', 'Prepare communication routines, cultural humility, contingency plans, and structured reflection before travel.'] },
    ],
    sections: [
      { title: 'Language & culture alignment', items: ['Connect the experience to proficiency targets, communication modes, and {focus}.', 'Write student-friendly language missions, cultural questions, and evidence of learning.', 'Use reliable sources and community voices to prepare students beyond surface-level facts.'] },
      { title: 'Approvals, access & safety', items: ['Confirm district approval, permissions, transportation, cost, accessibility, food/allergy, health, and emergency procedures.', 'Plan language, sensory, mobility, financial, and participation supports without identifying students publicly.', 'Create weather, closure, transportation-delay, and nonparticipation alternatives.'] },
      { title: 'Student & partner preparation', items: ['Teach respectful introductions, questions, etiquette, device use, photography, and gratitude.', 'Share the schedule, group expectations, spending guidance, meeting points, and emergency contacts.', 'Give hosts or partners a concise overview of student proficiency and learning goals.'] },
      { title: 'Reflection & connection', items: ['Collect language evidence and reflection without grading students on travel privilege or prior experience.', 'Send partner thank-yous and preserve useful contacts, costs, and logistics for next time.', 'Connect the experience to a follow-up conversation, presentation, comparison, or community action.'] },
    ],
    schedule: [['8:00 AM','Attendance, permissions, expectations, and language mission','Teacher'],['8:30 AM','Travel and group check-in','School team'],['9:00 AM','Welcome, orientation, and cultural context','Host/teacher'],['9:30 AM','Guided experience and communication tasks','Students/chaperones'],['11:30 AM','Reflection, gratitude, and final check','Teacher/host'],['12:00 PM','Return and follow-up language task','Teacher']],
    roles: ['Experience lead','Host/community partner','Teachers/chaperones','Transportation/office contact','Language and accessibility support','Family communication and emergency contact'],
  },
  'early-family-events': {
    moduleLabel: 'Early Childhood / Pre-K', moduleSlug: 'early-childhood', shortTitle: 'Family Engagement Event Studio',
    eyebrow: 'Joyful family participation', accent: 'amber',
    description: 'Create welcoming, play-based family events with simple stations, inclusive caregiver communication, safe arrival and release, make-and-take resources, and a complete event kit.',
    defaults: commonDefaults('Family Learning & Play Night', 'Play, family connection, early learning routines, and joyful participation'),
    templates: [
      { id: 'play-night', title: 'Family Learning & Play Night', description: 'Families explore short literacy, math, art, movement, sensory, and pretend-play stations.', focus: 'Play-based early learning, caregiver-child interaction, choice, and belonging', signature: ['Offer brief self-directed stations families can enter at any time and repeat.', 'Model simple prompts adults can use without turning play into a test.', 'Send home one realistic play routine using ordinary household materials.'] },
      { id: 'breakfast', title: 'Breakfast With Grown-Ups', description: 'An inclusive version of familiar caregiver breakfasts such as donuts or muffins events.', focus: 'School belonging, caregiver relationships, conversation, and classroom connection', signature: ['Welcome any trusted adult rather than requiring a particular family structure.', 'Plan food, allergy, cost, arrival, seating, and cleanup details before invitations go out.', 'Include a tiny classroom activity or child-made keepsake so the event is more than refreshments.'] },
      { id: 'make-play', title: 'Family Make-and-Play Workshop', description: 'Families build simple reusable learning materials and practice using them together.', focus: 'Hands-on creation, family confidence, language-rich play, and home-school connection', signature: ['Choose two or three durable make-and-take activities with inexpensive materials.', 'Precut difficult pieces and provide picture directions at each table.', 'Demonstrate adaptations for different developmental, sensory, motor, and communication needs.'] },
    ],
    sections: [
      { title: 'Developmentally appropriate design', items: ['Build short, flexible experiences that support {focus} for {audience}.', 'Use picture directions, child-sized materials, repetition, movement, and choice.', 'Plan calm spaces, alternate ways to participate, and support for children who need time to warm up.'] },
      { title: 'Family belonging & communication', items: ['Use inclusive caregiver language and provide translated information in needed languages.', 'Explain that adults are invited to connect and play—not evaluate or compare children.', 'Offer alternatives for families who cannot attend because of work, transportation, cost, or caregiving.'] },
      { title: 'Safety, routines & materials', items: ['Confirm check-in, child release, supervision, restroom, allergy, choking, sanitation, and emergency routines.', 'Set up labeled station bins, visual traffic flow, stroller space, seating, and rapid cleanup.', 'Avoid collecting or displaying developmental, disability, health, or family information publicly.'] },
      { title: 'Take-home connection', items: ['Send one-page family ideas that are short, playful, and require little or no special equipment.', 'Invite a simple family reflection about what the child enjoyed or wants to repeat.', 'Save supply counts, successful adaptations, timing notes, and family feedback for the next event.'] },
    ],
    schedule: [['4:30 PM','Room setup, safety check, and station bins','Teaching team'],['5:00 PM','Volunteer welcome and station practice','Event lead'],['5:30 PM','Rolling family arrival and picture-map introduction','Greeters'],['5:40 PM','Open play, making, and family learning stations','Station leads'],['6:35 PM','Take-home choice and child celebration','Teachers'],['7:00 PM','Safe release, cleanup, and materials inventory','All adults']],
    roles: ['Event lead','Classroom teachers','Welcome and check-in','Station helpers','Language/accessibility support','Food, sanitation, and safe-release team'],
  },
  'esl-family-night': {
    moduleLabel: 'ESL/ELL Specialist', moduleSlug: 'esl-specialist', shortTitle: 'Multilingual Family Night Hub',
    eyebrow: 'Language access & belonging', accent: 'pink',
    description: 'Plan a multilingual welcome, family literacy experience, or school-navigation night with interpretation, accessible communication, community resources, and strengths-based language.',
    defaults: commonDefaults('Multilingual Family Welcome Night', 'Belonging, language access, family voice, school navigation, and multilingual strengths'),
    templates: [
      { id: 'welcome', title: 'Multilingual Welcome Night', description: 'Help new and returning families meet staff, understand routines, and find support.', focus: 'School belonging, family voice, language access, and confident navigation', signature: ['Offer trained interpreters or approved language support for the languages families use.', 'Use a visual school map and short stations instead of one long English-heavy presentation.', 'Create private ways to ask questions about enrollment, transportation, meals, technology, and support.'] },
      { id: 'literacy', title: 'Family Language & Literacy Night', description: 'Celebrate home languages while sharing practical reading, speaking, listening, and writing routines.', focus: 'Multilingual literacy, family storytelling, language practice, and joyful reading', signature: ['Invite families to read, tell, draw, label, and discuss stories in any language.', 'Model how home-language development supports—not delays—additional-language learning.', 'Provide take-home routines and materials that do not require English fluency or purchases.'] },
      { id: 'navigation', title: 'School & Community Resource Night', description: 'Connect families with school processes and approved community services in one welcoming event.', focus: 'Family agency, school systems, community connections, and practical access', signature: ['Invite approved school and community partners around family-identified needs.', 'Keep service questions private and never display immigration, eligibility, or student-status information.', 'Provide translated follow-up contacts and a clear way to request individual help.'] },
    ],
    sections: [
      { title: 'Language access', items: ['Identify needed languages through approved school information—not public assumptions.', 'Arrange qualified interpretation, translated essentials, visual supports, and readable layouts.', 'Brief staff to speak in short segments, pause for interpretation, and avoid acronyms or jargon.'] },
      { title: 'Welcoming experience', items: ['Design flexible stations that support {focus} for {audience}.', 'Use name-optional participation, child-friendly spaces, familiar routines, and multiple ways to respond.', 'Invite family knowledge and home-language expertise rather than presenting families as recipients only.'] },
      { title: 'School & community coordination', items: ['Confirm partner roles, translated resources, privacy boundaries, referrals, and follow-up contacts.', 'Plan childcare/child participation, transportation information, food/allergy details, accessibility, and safe release.', 'Prepare a private help desk for individual questions that should not be answered in a group.'] },
      { title: 'Follow-through & trust', items: ['Send translated reminders and a post-event summary through channels families actually use.', 'Collect language-access and usefulness feedback without asking families to disclose sensitive information.', 'Track unanswered questions, requested supports, and improvements in district-approved systems.'] },
    ],
    schedule: [['4:30 PM','Interpretation, partner, signs, and welcome-table check','Event lead'],['5:00 PM','Staff briefing on language access and privacy','ESL/ELL specialist'],['5:30 PM','Flexible arrival, food, childcare, and visual map','Welcome team'],['5:45 PM','Open family stations and private help desk','Staff/partners'],['6:40 PM','Family voice, next steps, and resource pickup','Interpreters/leads'],['7:00 PM','Safe release, follow-up list, and cleanup','All teams']],
    roles: ['ESL/ELL event lead','Qualified interpreters','Welcome/check-in','Station facilitators','School/community partners','Child space, accessibility, and private-help support'],
  },
  'gifted-showcase': {
    moduleLabel: 'Gifted & Talented', moduleSlug: 'gifted-talented', shortTitle: 'Student Showcase Studio',
    eyebrow: 'Authentic audiences for deep work', accent: 'violet',
    description: 'Turn passion projects, inventions, research, performances, and community problem-solving into an equitable showcase with feedback tools, display plans, family communication, and reflection.',
    defaults: commonDefaults('Gifted Learner Showcase', 'Inquiry, creativity, advanced thinking, authentic products, feedback, and reflection'),
    templates: [
      { id: 'passion-expo', title: 'Passion Project Expo', description: 'Students share sustained inquiry, products, and learning with an authentic audience.', focus: 'Student questions, research, creation, expert feedback, and intellectual growth', signature: ['Require students to show the question, process, revisions, evidence, and next step—not only a polished product.', 'Plan displays for varied formats, unfinished work, performance, demonstrations, and digital media.', 'Use feedback prompts focused on thinking and curiosity rather than popularity.'] },
      { id: 'problem-solving', title: 'Community Problem-Solving Showcase', description: 'Teams present evidence-informed responses to authentic school or community needs.', focus: 'Systems thinking, evidence, creativity, collaboration, and responsible action', signature: ['Invite appropriate community partners without promising implementation or exposing private information.', 'Ask teams to explain stakeholders, constraints, evidence, tradeoffs, and revisions.', 'Use a feedback protocol that values feasibility, ethics, impact, and learning.'] },
      { id: 'seminar-performance', title: 'Seminar & Performance Evening', description: 'Combine student talks, demonstrations, debates, readings, or performances in one program.', focus: 'Advanced communication, interpretation, creative expression, and audience dialogue', signature: ['Build a varied program with clear time limits, transitions, and student introductions.', 'Prepare students for questions, uncertainty, respectful disagreement, and intellectual risk-taking.', 'Offer display, technical, hosting, or recorded alternatives when live performance is not appropriate.'] },
    ],
    sections: [
      { title: 'Project readiness & equity', items: ['Define readiness criteria tied to {focus}, not compliance, polish, family resources, or speed.', 'Provide school time, materials, mentorship, technology access, and multiple product options.', 'Plan support for 2e learners, underachieving gifted learners, multilingual learners, and students new to showcasing.'] },
      { title: 'Exhibition design', items: ['Map displays, demonstrations, performances, audience flow, power, sound, accessibility, and safety.', 'Create student display prompts for question, process, evidence, revision, product, and reflection.', 'Schedule arrival, setup, practice, presentation windows, breaks, and safe dismissal.'] },
      { title: 'Audience & feedback', items: ['Invite families, staff, peers, experts, and partners with clear roles and expectations.', 'Use feedback cards that ask kind, specific questions and avoid public scoring or awards based on popularity.', 'Teach students how to receive, sort, respond to, and decline feedback thoughtfully.'] },
      { title: 'Reflection & next steps', items: ['Collect student reflection about thinking, challenge, support, revision, and future inquiry.', 'Celebrate depth, growth, creativity, persistence, collaboration, and contribution.', 'Save mentor contacts, materials, timing, access improvements, and student-generated next steps.'] },
    ],
    schedule: [['4:30 PM','Display, technology, safety, and accessibility setup','Showcase lead'],['5:00 PM','Student arrival, setup, and presentation practice','Teacher/mentors'],['5:30 PM','Audience welcome and feedback orientation','Student hosts'],['5:40 PM','Open expo, talks, performances, and dialogue','Students'],['6:40 PM','Reflection wall and community acknowledgments','Teacher'],['7:00 PM','Safe release, project check, and cleanup','All teams']],
    roles: ['Showcase lead','Student hosts','Project mentors','Technology/display support','Audience and feedback guides','Accessibility, supervision, and cleanup team'],
  },
  'test-prep-family-support': {
    moduleLabel: 'Test Prep', moduleSlug: 'test-prep', shortTitle: 'Test Readiness & Family Support Hub',
    eyebrow: 'Confidence without test anxiety', accent: 'cyan',
    description: 'Plan a family readiness night, strategy workshop, or testing-week campaign with accurate information, original practice, practical routines, student wellbeing, and clear communication.',
    defaults: commonDefaults('Family Test Readiness Night', 'Clear expectations, useful strategies, realistic routines, confidence, and student wellbeing'),
    templates: [
      { id: 'family-readiness', title: 'Family Test Readiness Night', description: 'Help families understand the assessment, logistics, score use, and supportive routines.', focus: 'Accurate information, family confidence, student wellbeing, and practical preparation', signature: ['Use current official school or assessment information for dates, formats, accommodations, and policies.', 'Explain what families can do without implying that one test defines a student or teacher.', 'Provide a private route for questions about accommodations, participation, technology, or student anxiety.'] },
      { id: 'strategy-lab', title: 'Strategy Workshop & Practice Lab', description: 'Students and families rotate through short demonstrations of useful test-taking strategies.', focus: 'Pacing, directions, annotation, elimination, checking, reflection, and calm routines', signature: ['Use original or officially released practice materials—never reproduced secure test items.', 'Model when a strategy helps, when it does not, and how students can choose appropriately.', 'Keep practice low-stakes and avoid public scores, speed rankings, or fear-based messaging.'] },
      { id: 'confidence-campaign', title: 'Testing-Week Confidence Campaign', description: 'Coordinate classroom, hallway, family, and staff messages before a testing window.', focus: 'Predictable routines, attendance information, encouragement, sleep, food access, and stress management', signature: ['Create a short daily message sequence that is encouraging, accurate, and not performative.', 'Coordinate makeups, devices, rooms, breaks, materials, accessibility, and family reminders.', 'Celebrate effort and completion without prizes tied to scores or attendance barriers.'] },
    ],
    sections: [
      { title: 'Accuracy & ethical preparation', items: ['Verify all claims, dates, policies, formats, score uses, and accommodations through current official sources.', 'Use only original or officially released practice content and protect all secure materials.', 'Frame the assessment as one source of information—not a measure of worth, intelligence, or teacher value.'] },
      { title: 'Student & family support', items: ['Build activities that support {focus} for {audience}.', 'Share realistic routines for attendance, sleep, breakfast access, medication, materials, and transportation.', 'Offer translated, accessible communication and private follow-up for individual questions.'] },
      { title: 'Logistics & wellbeing', items: ['Confirm rooms, devices, headphones, chargers, schedules, breaks, staffing, makeups, and contingency plans.', 'Teach brief regulation strategies without suggesting they replace counseling, medical, or disability support.', 'Coordinate accommodations and protected information only through district-approved systems.'] },
      { title: 'Follow-through', items: ['Plan a calm return to learning after testing and avoid lengthy public score comparisons.', 'Collect student/family feedback about clarity, access, anxiety, and useful supports.', 'Save communication, logistics, attendance barriers, and improvement notes for the next testing window.'] },
    ],
    schedule: [['5:00 PM','Staff, technology, materials, and information check','Event lead'],['5:30 PM','Family arrival and assessment overview','School/testing coordinator'],['5:45 PM','Strategy, logistics, and wellbeing stations','Teachers/support staff'],['6:30 PM','Questions and private support desk','Coordinator/counselor'],['6:50 PM','Take-home readiness plan and final reminders','Teacher'],['7:00 PM','Follow-up list and cleanup','All teams']],
    roles: ['Testing/event coordinator','Content teachers','Technology and logistics lead','Counselor/wellbeing support','Language and accessibility support','Family welcome and private-help team'],
  },
  'open-house': {
    moduleLabel: 'All Specialties', moduleSlug: '', workspacePath: '/', workspaceLabel: 'All modules', shortTitle: 'Open House Planner',
    eyebrow: 'A clear, welcoming first impression', accent: 'rose',
    description: 'Create a back-to-school open house, curriculum showcase, or community-resource event with room setup, traffic flow, family communication, accessibility, take-home materials, and follow-up.',
    defaults: commonDefaults('Specialty Open House', 'Family connection, clear expectations, visible learning, access, and a welcoming school experience'),
    templates: [
      { id: 'back-to-school', title: 'Back-to-School Open House', description: 'Introduce the teacher, space, routines, curriculum, communication, and ways families can help.', focus: 'Belonging, clear routines, family communication, curriculum understanding, and trust', signature: ['Design a repeatable 10–15 minute welcome for families arriving at different times.', 'Show what students will create, practice, perform, investigate, or improve in this specialty.', 'Give families one concise take-home page instead of a packet of disconnected information.'] },
      { id: 'learning-showcase', title: 'Curriculum & Learning Showcase', description: 'Let families experience representative student learning through displays and mini-activities.', focus: 'Visible learning, student voice, family participation, and authentic curriculum connection', signature: ['Choose a few representative experiences rather than trying to display the entire curriculum.', 'Include student thinking, process, revision, and reflection—not only finished products.', 'Use optional mini-activities that work for varied ages, languages, and abilities.'] },
      { id: 'community-open-house', title: 'Community Resource Open House', description: 'Connect families with specialty resources, staff, clubs, support, and participation opportunities.', focus: 'School-community connection, practical access, family questions, and ongoing participation', signature: ['Invite approved partners and clearly separate school information from sales or solicitation.', 'Organize resources by family questions and needs rather than agency names or acronyms.', 'Provide translated follow-up contacts and private ways to request individual support.'] },
    ],
    sections: [
      { title: 'Message & experience', items: ['Choose three things families should know, feel, and be able to do after {title}.', 'Create a rolling welcome, self-guided route, or timed presentation that fits likely arrival patterns.', 'Show real learning and practical next steps without overwhelming families with teacher language.'] },
      { title: 'Space, materials & flow', items: ['Map entrance, welcome, displays, activities, questions, take-home resources, accessibility, and exit.', 'Prepare signs, name-optional interaction, supplies, technology backups, seating, and rapid reset bins.', 'Protect student work, names, grades, disability information, schedules, and contact information.'] },
      { title: 'Family access & communication', items: ['Send concise time, parking, entrance, accessibility, childcare/child participation, and interpretation information.', 'Provide translated essentials and a private route for questions that involve individual students.', 'Offer a useful alternative for families who cannot attend in person.'] },
      { title: 'Staffing & follow-through', items: ['Assign welcome, presentation, activity, technology, accessibility, questions, and cleanup roles.', 'Collect a short family response about clarity, belonging, questions, and needed follow-up.', 'Save materials, attendance patterns, common questions, and improvements for the next event.'] },
    ],
    schedule: [['4:30 PM','Room, displays, technology, signs, and privacy check','Teacher/event lead'],['5:00 PM','Staff or volunteer briefing','Event lead'],['5:30 PM','Doors open and rolling welcome begins','Welcome team'],['5:40 PM','Displays, mini-activities, and family questions','Teachers/students'],['6:40 PM','Final welcome cycle and take-home resources','Event lead'],['7:00 PM','Family exit, follow-up list, and cleanup','All teams']],
    roles: ['Teacher/event lead','Welcome and wayfinding','Student or family ambassadors','Activity/display support','Language and accessibility support','Questions, follow-up, and cleanup'],
  },
}

function format(text, inputs) {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(inputs[key] ?? ''))
}

export function buildExperiencePlan(experienceKey, inputs) {
  const config = EXPERIENCE_CONFIGS[experienceKey]
  const template = config.templates.find((item) => item.id === inputs.templateId) ?? config.templates[0]
  return {
    title: inputs.title || template.title,
    subtitle: `${inputs.date} · ${inputs.time} · ${inputs.location}`,
    templateTitle: template.title,
    focus: inputs.focus || template.focus,
    sections: [
      { title: `${template.title} essentials`, items: template.signature.map((text) => ({ text: format(text, inputs), done: false })) },
      ...config.sections.map((section) => ({ title: section.title, items: section.items.map((text) => ({ text: format(text, inputs), done: false })) })),
    ],
    schedule: config.schedule.map(([time, activity, lead]) => ({ time, activity, lead })),
    roles: config.roles.map((role) => ({ role, person: '' })),
    invitation: `You’re invited to ${inputs.title || template.title}!\n\nJoin us on ${inputs.date} from ${inputs.time} at ${inputs.location}. ${inputs.audience} will experience ${inputs.focus || template.focus}.\n\nWe’ll share arrival, accessibility, and participation details before the event. No special purchases are required. We hope you can join us!`,
  }
}

export function applyExperienceTemplate(experienceKey, templateId, currentInputs) {
  const config = EXPERIENCE_CONFIGS[experienceKey]
  const template = config.templates.find((item) => item.id === templateId) ?? config.templates[0]
  return { ...currentInputs, templateId: template.id, title: template.title, focus: template.focus }
}
