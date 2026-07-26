import {
  Drama, Hand, Wind, Globe, Award, Monitor, Compass, Languages, Sparkles,
  BookOpen, Calculator, HeartHandshake, Blocks, PartyPopper, Target, Layers,
  Users, Presentation, Handshake, PersonStanding, Speech, ScanEye, Ear,
} from 'lucide-react'

// Per-module config for the reusable <ModuleHome> shell.
//
// `subject` matches the lesson_object.subject a module writes (for the recent
// list). `moduleLabel` matches the MODULES label in constants/modules.js (for
// the Browse filter deep-link). `cards` picks a set of UTILITY cards (see the
// FULL/LITE/TESTPREP/PRO constants below) shown beyond the always-present
// Generate + Browse. Phase 3 expanded the shared tools to all subjects, so the
// card sets now respect the content-delivery vs. non-evaluative gating:
//   • content-delivery lessons (gradable) → FULL: schedule, Assessment Bank,
//     Standards Tracker, Pacing Guide, Activity Bank, EOY, Portfolio
//   • lesson/activity but non-gradable (School Counselors, Early Childhood,
//     After-School Clubs) → LITE: schedule, Pacing, Activity, EOY, Portfolio
//   • Test Prep → TESTPREP (assessable + plannable, but not a scheduled class)
//   • clinical / adult / support (non-evaluative) → PRO: EOY + Portfolio only
//     (never Assessment Bank / Standards Tracker — no gradable delivered content)
// Sub Binder + Import & Enhance stay original-6-only: they are structurally
// coupled to the PE lesson shape (Sub Binder orchestrates the original lesson
// generators; Import outputs the PE PlanBook schema) and need per-module rework.
//
// Accent class strings MUST be literal (never interpolated) so Tailwind's JIT
// scanner compiles them. ACCENTS maps each module color to its four literal
// class strings; configs below reference ACCENTS.<color>.
const ACCENTS = {
  maroon:     { well: 'bg-maroon-500/15',     text: 'text-maroon-400',     hover: 'hover:border-maroon-400/40',     arrow: 'group-hover:text-maroon-400' },
  olive:      { well: 'bg-olive-500/15',      text: 'text-olive-400',      hover: 'hover:border-olive-400/40',      arrow: 'group-hover:text-olive-400' },
  jade:       { well: 'bg-jade-500/15',       text: 'text-jade-400',       hover: 'hover:border-jade-400/40',       arrow: 'group-hover:text-jade-400' },
  denim:      { well: 'bg-denim-500/15',      text: 'text-denim-400',      hover: 'hover:border-denim-400/40',      arrow: 'group-hover:text-denim-400' },
  saffron:    { well: 'bg-saffron-500/15',    text: 'text-saffron-400',    hover: 'hover:border-saffron-400/40',    arrow: 'group-hover:text-saffron-400' },
  crimson:    { well: 'bg-crimson-500/15',    text: 'text-crimson-400',    hover: 'hover:border-crimson-400/40',    arrow: 'group-hover:text-crimson-400' },
  fuchsia:    { well: 'bg-fuchsia-500/15',    text: 'text-fuchsia-400',    hover: 'hover:border-fuchsia-400/40',    arrow: 'group-hover:text-fuchsia-400' },
  amber:      { well: 'bg-amber-500/15',      text: 'text-amber-400',      hover: 'hover:border-amber-400/40',      arrow: 'group-hover:text-amber-400' },
  sky:        { well: 'bg-sky-500/15',        text: 'text-sky-400',        hover: 'hover:border-sky-400/40',        arrow: 'group-hover:text-sky-400' },
  lime:       { well: 'bg-lime-500/15',       text: 'text-lime-400',       hover: 'hover:border-lime-400/40',       arrow: 'group-hover:text-lime-400' },
  violet:     { well: 'bg-violet-500/15',     text: 'text-violet-400',     hover: 'hover:border-violet-400/40',     arrow: 'group-hover:text-violet-400' },
  grass:      { well: 'bg-grass-500/15',      text: 'text-grass-400',      hover: 'hover:border-grass-400/40',      arrow: 'group-hover:text-grass-400' },
  coral:      { well: 'bg-coral-500/15',      text: 'text-coral-400',      hover: 'hover:border-coral-400/40',      arrow: 'group-hover:text-coral-400' },
  periwinkle: { well: 'bg-periwinkle-500/15', text: 'text-periwinkle-400', hover: 'hover:border-periwinkle-400/40', arrow: 'group-hover:text-periwinkle-400' },
  zinc:       { well: 'bg-zinc-500/15',       text: 'text-zinc-400',       hover: 'hover:border-zinc-400/40',       arrow: 'group-hover:text-zinc-400' },
  bronze:     { well: 'bg-bronze-500/15',     text: 'text-bronze-400',     hover: 'hover:border-bronze-400/40',     arrow: 'group-hover:text-bronze-400' },
  cobalt:     { well: 'bg-cobalt-500/15',     text: 'text-cobalt-400',     hover: 'hover:border-cobalt-400/40',     arrow: 'group-hover:text-cobalt-400' },
  magenta:    { well: 'bg-magenta-500/15',    text: 'text-magenta-400',    hover: 'hover:border-magenta-400/40',    arrow: 'group-hover:text-magenta-400' },
  gold:       { well: 'bg-gold-500/15',       text: 'text-gold-400',       hover: 'hover:border-gold-400/40',       arrow: 'group-hover:text-gold-400' },
  mocha:      { well: 'bg-mocha-500/15',      text: 'text-mocha-400',      hover: 'hover:border-mocha-400/40',      arrow: 'group-hover:text-mocha-400' },
  stone:      { well: 'bg-stone-500/15',      text: 'text-stone-400',      hover: 'hover:border-stone-400/40',      arrow: 'group-hover:text-stone-400' },
  plum:       { well: 'bg-plum-500/15',       text: 'text-plum-400',       hover: 'hover:border-plum-400/40',       arrow: 'group-hover:text-plum-400' },
  steel:      { well: 'bg-steel-500/15',      text: 'text-steel-400',      hover: 'hover:border-steel-400/40',      arrow: 'group-hover:text-steel-400' },
}
const accent = (c) => ACCENTS[c]

// Phase 3 card sets — expanded now that the shared tools support all subjects.
const FULL = ['schedule', 'assessments', 'standards', 'pacing', 'activity', 'eoy', 'portfolio']
const LITE = ['schedule', 'pacing', 'activity', 'eoy', 'portfolio']
const TESTPREP = ['assessments', 'standards', 'pacing', 'activity', 'eoy', 'portfolio']
const PRO = ['eoy', 'portfolio']

export const MODULE_HOMES = {
  // ── Content specials (scheduled classes) → ['schedule'] ──────────────────
  theater: {
    subject: 'Theater', moduleLabel: 'Theater / Drama', title: 'Theater / Drama', Icon: Drama, accent: accent('maroon'),
    tagline: 'NCAS theatre lessons across the four Artistic Processes — K–12',
    generatePath: '/theater/generate', generateTitle: 'Generate a theatre lesson',
    generateDesc: 'A standards-based lesson across Creating, Performing, Responding & Connecting',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  dance: {
    subject: 'Dance', moduleLabel: 'Dance', title: 'Dance', Icon: Wind, accent: accent('olive'),
    tagline: 'NCAS dance lessons across the four Artistic Processes — K–12',
    generatePath: '/dance/generate', generateTitle: 'Generate a dance lesson',
    generateDesc: 'A standards-based lesson with the elements of dance & body-safety guidance',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'world-languages': {
    subject: 'World Languages', moduleLabel: 'World Languages', title: 'World Languages', Icon: Globe, accent: accent('jade'),
    tagline: 'ACTFL 5 Cs lessons for any language — Novice to Advanced, K–12',
    generatePath: '/world-languages/generate', generateTitle: 'Generate a language lesson',
    generateDesc: 'The 5 Cs across Interpersonal, Interpretive & Presentational modes',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  jrotc: {
    subject: 'JROTC', moduleLabel: 'JROTC', title: 'JROTC', Icon: Award, accent: accent('denim'),
    tagline: 'High-school citizenship & leadership across the LET 1–4 progression',
    generatePath: '/jrotc/generate', generateTitle: 'Generate a JROTC lesson',
    generateDesc: 'Leadership, character, civics, wellness, service learning & career exploration',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'elementary-tech': {
    subject: 'Elementary Technology', moduleLabel: 'Elementary Technology / Computer Lab', title: 'Elementary Technology', Icon: Monitor, accent: accent('saffron'),
    tagline: 'Self-contained K–5 computer-lab lessons — ISTE-aligned',
    generatePath: '/elementary-tech/generate', generateTitle: 'Generate a tech lesson',
    generateDesc: 'Foundational skills, digital citizenship & online safety, creation tools & intro coding',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'school-counselors': {
    subject: 'School Counselors', moduleLabel: 'School Counselors', title: 'School Counselors', Icon: Compass, accent: accent('crimson'),
    tagline: 'Tier 1 whole-class classroom guidance — ASCA-aligned, K–12',
    generatePath: '/school-counselors/generate', generateTitle: 'Generate a guidance lesson',
    generateDesc: 'Classroom guidance across academic, career & social/emotional development',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: LITE,
  },
  'esl-specialist': {
    subject: 'ESL/ELL Specialist', moduleLabel: 'ESL/ELL Specialist', title: 'ESL/ELL Specialist', Icon: Languages, accent: accent('fuchsia'),
    tagline: 'Language-development lessons for ESL/ELL teachers — WIDA & SIOP, K–12',
    generatePath: '/esl-specialist/generate', generateTitle: 'Generate an ELD lesson',
    generateDesc: 'WIDA proficiency levels, SIOP objectives, all four language domains',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'gifted-talented': {
    subject: 'Gifted & Talented', moduleLabel: 'Gifted & Talented', title: 'Gifted & Talented', Icon: Sparkles, accent: accent('amber'),
    tagline: 'Depth & Complexity, enrichment vs. acceleration, and 2e support — K–12',
    generatePath: '/gifted-talented/generate', generateTitle: 'Generate a gifted lesson',
    generateDesc: 'Differentiate, enrich, or support 2e & underachieving gifted learners',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'reading-specialists': {
    subject: 'Reading Specialists', moduleLabel: 'Reading Specialists', title: 'Reading Specialists', Icon: BookOpen, accent: accent('sky'),
    tagline: 'Explicit, systematic Structured Literacy interventions — IDA-aligned, K–12',
    generatePath: '/reading-specialists/generate', generateTitle: 'Generate a reading intervention',
    generateDesc: 'Phonics, fluency, comprehension & more, with dyslexia-indicator flagging',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'math-specialists': {
    subject: 'Math Specialists', moduleLabel: 'Math Specialists', title: 'Math Specialists', Icon: Calculator, accent: accent('lime'),
    tagline: 'Concept-first math interventions & differentiation — NCTM-aligned, K–12',
    generatePath: '/math-specialists/generate', generateTitle: 'Generate a math intervention',
    generateDesc: 'CRA sequencing, Number Talks & NCTM process standards',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'special-education': {
    subject: 'Special Education', moduleLabel: 'Special Education', title: 'Special Education', Icon: HeartHandshake, accent: accent('violet'),
    tagline: 'Resource & self-contained instructional support ideas — K–12',
    generatePath: '/special-education/generate', generateTitle: 'Generate a lesson',
    generateDesc: 'Multi-tier, functional/life-skills & push-in co-teaching ideas to adapt',
    browseTitle: 'Browse my lessons', browseNoun: 'lesson', cards: FULL,
  },
  'early-childhood': {
    subject: 'Early Childhood', moduleLabel: 'Early Childhood / Pre-K', title: 'Early Childhood / Pre-K', Icon: Blocks, accent: accent('grass'),
    tagline: 'Play-based learning centers & guided-play invitations — NAEYC DAP',
    generatePath: '/early-childhood/generate', generateTitle: 'Generate a play-based plan',
    generateDesc: 'Learning centers, circle time & whole-child domains (toddlers–TK)',
    browseTitle: 'Browse my plans', browseNoun: 'plan', cards: LITE,
  },
  'after-school-clubs': {
    subject: 'After-School Clubs', moduleLabel: 'After-School Clubs', title: 'After-School Clubs', Icon: PartyPopper, accent: accent('coral'),
    tagline: 'Ready-to-run club session plans across 68 club types — K–12',
    generatePath: '/after-school-clubs/generate', generateTitle: 'Generate a session plan',
    generateDesc: 'Low-prep club sessions runnable by a first-time sponsor',
    browseTitle: 'Browse my session plans', browseNoun: 'session plan', cards: LITE,
  },

  // ── Clinical / related services → [] (Generate + Browse, relabeled) ──────
  ot: {
    subject: 'Occupational Therapists', moduleLabel: 'Occupational Therapists', title: 'Occupational Therapists', Icon: Hand, accent: accent('periwinkle'),
    tagline: 'School-based OT activity ideas — OTPF-4 / AOTA-aligned (K–12)',
    generatePath: '/ot/generate', generateTitle: 'Generate an activity plan',
    generateDesc: 'Fine-motor, sensory, ADLs, visual-motor & vocational activity ideas',
    browseTitle: 'Browse my activity plans', browseNoun: 'activity plan', cards: PRO,
  },
  pt: {
    subject: 'Physical Therapists', moduleLabel: 'Physical Therapists', title: 'Physical Therapists', Icon: PersonStanding, accent: accent('zinc'),
    tagline: 'School-based PT activity ideas — APTA / APTA Pediatric-aligned (K–12)',
    generatePath: '/pt/generate', generateTitle: 'Generate an activity plan',
    generateDesc: 'Gross-motor, mobility & positioning, adaptive-PE crossover & functional mobility',
    browseTitle: 'Browse my activity plans', browseNoun: 'activity plan', cards: PRO,
  },
  slp: {
    subject: 'Speech-Language Pathologists', moduleLabel: 'Speech-Language Pathologists', title: 'Speech-Language Pathologists', Icon: Speech, accent: accent('bronze'),
    tagline: 'SLP session activity ideas — ASHA-aligned (K–12)',
    generatePath: '/slp/generate', generateTitle: 'Generate an activity plan',
    generateDesc: 'Articulation, language, fluency, social communication & AAC',
    browseTitle: 'Browse my activity plans', browseNoun: 'activity plan', cards: PRO,
  },
  tvi: {
    subject: 'Teacher of the Visually Impaired', moduleLabel: 'Teacher of the Visually Impaired', title: 'Teacher of the Visually Impaired', Icon: ScanEye, accent: accent('cobalt'),
    tagline: 'Expanded Core Curriculum activity ideas — CEC/DVIDB-aligned (K–12)',
    generatePath: '/tvi/generate', generateTitle: 'Generate an activity plan',
    generateDesc: 'Braille & compensatory access, assistive tech, independent living & more',
    browseTitle: 'Browse my activity plans', browseNoun: 'activity plan', cards: PRO,
  },
  dhh: {
    subject: 'Teacher of the Deaf & Hard of Hearing', moduleLabel: 'Teacher of the Deaf & Hard of Hearing', title: 'Teacher of the Deaf & Hard of Hearing', Icon: Ear, accent: accent('magenta'),
    tagline: 'ECC-DHH activity ideas — CEC/CED-aligned (K–12)',
    generatePath: '/dhh/generate', generateTitle: 'Generate an activity plan',
    generateDesc: 'Communication, self-advocacy, social-emotional, hearing technology & transition',
    browseTitle: 'Browse my activity plans', browseNoun: 'activity plan', cards: PRO,
  },

  // ── Adult-facing / support → [] (Generate + Browse, relabeled) ───────────
  'staff-pd': {
    subject: 'Staff PD & Meeting Planning', moduleLabel: 'Staff PD & Meeting Planning', title: 'Staff PD & Meeting Planning', Icon: Presentation, accent: accent('gold'),
    tagline: 'Learning Forward-aligned professional learning for building leaders',
    generatePath: '/staff-pd/generate', generateTitle: 'Generate a PD plan',
    generateDesc: 'PD sessions, mentoring, walkthroughs, PLC protocols & communication',
    browseTitle: 'Browse my plans', browseNoun: 'plan', cards: PRO,
  },
  'instructional-coaching': {
    subject: 'Instructional Coaching', moduleLabel: 'Instructional Coaching', title: 'Instructional Coaching', Icon: Handshake, accent: accent('mocha'),
    tagline: 'Non-evaluative, partnership-based coaching — Jim Knight’s Impact Cycle',
    generatePath: '/instructional-coaching/generate', generateTitle: 'Generate a coaching resource',
    generateDesc: 'Conversation frameworks, teacher-driven observation tools & data protocols',
    browseTitle: 'Browse my resources', browseNoun: 'resource', cards: PRO,
  },
  intervention: {
    subject: 'Intervention Planning', moduleLabel: 'Intervention Planning', title: 'Intervention Planning', Icon: Layers, accent: accent('stone'),
    tagline: 'MTSS/RTI tiered intervention ideas with progress monitoring',
    generatePath: '/intervention/generate', generateTitle: 'Generate an intervention plan',
    generateDesc: 'Tiered Reading, Math or Behavior support from a described concern',
    browseTitle: 'Browse my plans', browseNoun: 'plan', cards: PRO,
  },
  'student-support-activities': {
    subject: 'Student Support Team Activities', moduleLabel: 'Student Support Team Activities', title: 'Student Support Team Activities', Icon: Users, accent: accent('plum'),
    tagline: 'Small-group SEL & behavioral activities for support-team roles',
    generatePath: '/student-support-activities/generate', generateTitle: 'Generate an activity',
    generateDesc: 'Role-tailored, activity-structure-only small-group SEL & behavioral plans',
    browseTitle: 'Browse my activities', browseNoun: 'activity', cards: PRO,
  },
  'test-prep': {
    subject: 'Test Prep', moduleLabel: 'Test Prep', title: 'Test Prep', Icon: Target, accent: accent('steel'),
    tagline: 'Original SAT/ACT & state-assessment practice — tutoring-style sessions',
    generatePath: '/test-prep/generate', generateTitle: 'Generate a test-prep session',
    generateDesc: 'Original practice questions, strategies, content review & test-day prep',
    browseTitle: 'Browse my sessions', browseNoun: 'session', cards: TESTPREP,
  },
}
