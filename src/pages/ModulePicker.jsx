import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Library, Palette, Music, Drama, Wind, FlaskConical, Monitor, Award, Briefcase, ClipboardCheck, Sparkles, BookOpen, Calculator, HeartHandshake, Languages, Compass, Speech, Hand, Handshake, PersonStanding, ScanEye, Ear, PartyPopper, Target, Globe, Users, Blocks, Baby, Layers, Presentation, Star, Plus, Clock } from 'lucide-react'
import { useDisplayName, getTimeGreeting } from '../hooks/useDisplayName'
import { useFavorites } from '../hooks/useFavorites'
import ModuleCard from '../components/module/ModuleCard'

// ─── Module catalog ─────────────────────────────────────────────────────────
// Single source of truth for the picker cards. `key` is the module's stable
// route slug (stored in module_favorites). `accent` names the shared color
// treatment (see src/constants/moduleAccents.js). PE & Health renders a custom
// wordmark SVG instead of a lucide icon. Each group carries a short `chip` label
// used by the filter row.
const GROUPS = [
  {
    label: 'Core Specials & Encore Subjects',
    chip: 'Specials & Encore',
    modules: [
      { key: 'pe-health', to: '/pe-health', label: 'PE & Health', Icon: null, accent: 'accent',
        desc: 'Lessons, units, year plans, sub plans, quizzes, Adaptive PE & IEP planning, and more' },
      { key: 'art', to: '/art', label: 'Art', Icon: Palette, accent: 'orange',
        desc: 'Elementary K–5 art lessons — NCAS-aligned, studio-ready with full teacher prep' },
      { key: 'library', to: '/library', label: 'Library & Media', Icon: Library, accent: 'blue',
        desc: 'Elementary K–5 library lesson planning — genre study, research skills, digital citizenship, and the shared Makerspace project generator (also in STEM)' },
      { key: 'music', to: '/music', label: 'Music', Icon: Music, accent: 'purple',
        desc: 'Elementary K–5 general music lessons — NCAS-aligned with listening examples and active music making' },
      { key: 'theater', to: '/theater', label: 'Theater / Drama', Icon: Drama, accent: 'maroon',
        desc: 'NCAS Theatre lessons across the four Artistic Processes — Creating, Performing, Responding & Connecting — K–12, with original scene-starters and improv (never copyrighted scripts)' },
      { key: 'dance', to: '/dance', label: 'Dance', Icon: Wind, accent: 'olive',
        desc: 'NCAS Dance lessons across the four Artistic Processes — Creating, Performing, Responding & Connecting — K–12, with the elements of dance & built-in body-safety guidance' },
      { key: 'stem', to: '/stem', label: 'STEM', Icon: FlaskConical, accent: 'cyan',
        desc: 'Elementary K–5 STEM lessons — engineering design, coding, science investigation, and the shared Makerspace project generator (also in Library & Media)' },
      { key: 'elementary-tech', to: '/elementary-tech', label: 'Elementary Technology / Computer Lab', Icon: Monitor, accent: 'saffron',
        desc: 'Self-contained K–5 computer-lab lessons — foundational skills, digital citizenship & online safety, creation tools, and intro coding — ISTE-aligned for a weekly tech special' },
      { key: 'after-school-clubs', to: '/after-school-clubs', label: 'After-School Clubs', Icon: PartyPopper, accent: 'coral',
        desc: 'Ready-to-run club session plans across 68 club types — sports, academic, creative, wellness, leadership, life-skills & interest clubs, scaled K–12 by grade band' },
      { key: 'jrotc', to: '/jrotc', label: 'JROTC', Icon: Award, accent: 'denim',
        desc: 'High-school citizenship & leadership lessons across the LET 1–4 progression — leadership, character, civics, wellness, service learning & career exploration (not military tactics)' },
      { key: 'world-languages', to: '/world-languages', label: 'World Languages', Icon: Globe, accent: 'jade',
        desc: 'ACTFL 5 Cs lessons for any language — Spanish, French, Mandarin, Latin, ASL & more — across Interpersonal, Interpretive & Presentational modes, Novice–Advanced (K–12)' },
    ],
  },
  {
    label: 'Early Childhood',
    chip: 'Early Childhood',
    modules: [
      { key: 'early-childhood', to: '/early-childhood', label: 'Early Childhood / Pre-K', Icon: Blocks, accent: 'grass',
        desc: 'Play-based learning centers & guided-play invitations for the whole child — NAEYC DAP, NAEYC Professional Standards & Head Start ELOF (toddlers–TK)' },
      { key: 'ecse', to: '/ecse', label: 'Early Childhood Special Education', Icon: Baby, accent: 'sage',
        desc: 'Play-based, embedded-instruction support for young children with disabilities/delays (birth–5) — DEC Recommended Practices, NAEYC DAP & CEC; birth–3 (IFSP) & preschool (IEP), ideas to adapt to the child’s plan' },
    ],
  },
  {
    label: 'Career & Technical Education',
    chip: 'CTE',
    modules: [
      { key: 'cte', to: '/cte', label: 'CTE', Icon: Briefcase, accent: 'pink',
        desc: 'Career & Technical Education for MS–HS — Hospitality & Tourism, Finance, Marketing, Human Services / FCS, Health Science, Education & Training, Career Readiness, Information Technology, Transportation, Distribution & Logistics, Manufacturing, STEM / Engineering & Technology, Business Management & Administration, Agriculture, Food & Natural Resources, Architecture & Construction, Arts, A/V Technology & Communications, Government & Public Administration, Law, Public Safety, Corrections & Security, Cosmetology / Personal Care Services, Business Law, Sports & Entertainment Marketing, Exercise Science / Sports Medicine, and Early Childhood Education & Services pathways' },
    ],
  },
  {
    label: 'Academic Intervention & Support',
    chip: 'Intervention & Support',
    modules: [
      { key: 'esl-specialist', to: '/esl-specialist', label: 'ESL/ELL Specialist', Icon: Languages, accent: 'fuchsia',
        desc: 'Language-development lessons for ESL/ELL teachers — WIDA proficiency levels, SIOP content & language objectives, all four language domains (K–12)' },
      { key: 'gifted-talented', to: '/gifted-talented', label: 'Gifted & Talented', Icon: Sparkles, accent: 'amber',
        desc: 'Differentiate any topic with Depth & Complexity, plan enrichment vs. acceleration, and support 2e & underachieving gifted learners (K–12)' },
      { key: 'intervention', to: '/intervention', label: 'Intervention Planning', Icon: Layers, accent: 'stone',
        desc: 'MTSS/RTI tiered intervention ideas from a described concern — routes to Reading (IDA), Math (NCTM/CRA), or Behavior support, with Tier framing & progress monitoring' },
      { key: 'math-specialists', to: '/math-specialists', label: 'Math Specialists', Icon: Calculator, accent: 'lime',
        desc: 'Concept-first math interventions & differentiation — CRA sequencing, Number Talks & NCTM process standards for pull-out and co-teaching, plus a Tutoring Mode (private/after-school & in-class pull-aside) (K–12)' },
      { key: 'reading-specialists', to: '/reading-specialists', label: 'Reading Specialists', Icon: BookOpen, accent: 'sky',
        desc: 'Explicit, systematic Structured Literacy interventions — phonics, fluency, comprehension & more, IDA-aligned with dyslexia-indicator flagging, plus a Tutoring Mode (private/after-school & in-class pull-aside) (K–12)' },
      { key: 'special-education', to: '/special-education', label: 'Special Education', Icon: HeartHandshake, accent: 'violet',
        desc: 'Resource & self-contained instructional support — multi-tier differentiation, functional/life-skills, and push-in co-teaching ideas to adapt to your students (K–12)' },
      { key: 'test-prep', to: '/test-prep', label: 'Test Prep', Icon: Target, accent: 'steel',
        desc: 'Original SAT/ACT & state-assessment practice — original practice questions, strategies, content review & test-day prep as tutoring-style sessions (1:1 or small group)' },
    ],
  },
  {
    label: 'Student Wellbeing & Behavior',
    chip: 'Wellbeing & Behavior',
    modules: [
      { key: 'classroom-management', to: '/classroom-management', label: 'Classroom Management', Icon: ClipboardCheck, accent: 'indigo',
        desc: 'All grade bands K–12 — printable quick-reference cards, behavior charts, reflection forms, behavior troubleshooting, ABC data sheets, CICO trackers, and parent communication tools' },
      { key: 'school-counselors', to: '/school-counselors', label: 'School Counselors', Icon: Compass, accent: 'crimson',
        desc: 'Whole-class classroom guidance curriculum — ASCA-aligned lessons across academic, career, and social/emotional development (K–12)' },
      { key: 'slp', to: '/slp', label: 'Speech-Language Pathologists', Icon: Speech, accent: 'bronze',
        desc: 'SLP session activity ideas — articulation, language, fluency, social communication & AAC, ASHA-aligned (K–12, plus an experimental adult-rehab tier)' },
      { key: 'ot', to: '/ot', label: 'Occupational Therapists', Icon: Hand, accent: 'periwinkle',
        desc: 'School-based OT activity ideas — fine motor & handwriting, sensory processing & regulation, ADLs, visual-motor & vocational skills, OTPF-4 / AOTA-aligned (K–12)' },
      { key: 'pt', to: '/pt', label: 'Physical Therapists', Icon: PersonStanding, accent: 'zinc',
        desc: 'School-based PT activity ideas — gross motor, mobility & positioning, adaptive-PE crossover & functional mobility, APTA / APTA Pediatric-aligned (K–12)' },
      { key: 'tvi', to: '/tvi', label: 'Teacher of the Visually Impaired', Icon: ScanEye, accent: 'cobalt',
        desc: 'Expanded Core Curriculum activity ideas — Braille & compensatory access, assistive technology, independent living, sensory & social skills, and career/transition, CEC/DVIDB-aligned (K–12)' },
      { key: 'dhh', to: '/dhh', label: 'Teacher of the Deaf & Hard of Hearing', Icon: Ear, accent: 'magenta',
        desc: 'ECC-DHH activity ideas — communication (bilingual-bicultural or listening & spoken language), self-advocacy, social-emotional, hearing technology & career transition, CEC/CED-aligned (K–12)' },
      { key: 'student-support-activities', to: '/student-support-activities', label: 'Student Support Team Activities', Icon: Users, accent: 'plum',
        desc: 'Ready-to-run small-group SEL & behavioral activities for social workers, school psychologists, MFLCs & behavior specialists — role-tailored, activity structure only (K–12)' },
    ],
  },
  {
    label: 'School Leadership',
    chip: 'Leadership',
    modules: [
      { key: 'staff-pd', to: '/staff-pd', label: 'Staff PD & Meeting Planning', Icon: Presentation, accent: 'gold',
        desc: 'For principals & coaches — Learning Forward-aligned PD sessions, new-teacher mentoring, walkthrough look-fors, PLC/data-team protocols, and building communication templates' },
      { key: 'instructional-coaching', to: '/instructional-coaching', label: 'Instructional Coaching', Icon: Handshake, accent: 'mocha',
        desc: 'Non-evaluative, partnership-based coaching — conversation frameworks, teacher-driven observation tools, and goal-setting & data protocols built on Jim Knight’s Impact Cycle' },
    ],
  },
]

// Flat catalog, in display order — used to render pinned favorites without
// reordering as the user stars/unstars.
const ALL_MODULES = GROUPS.flatMap((g) => g.modules)

export default function ModulePicker() {
  const firstName = useDisplayName()
  const { favorites, toggle, loaded } = useFavorites()
  const [filter, setFilter] = useState('all')

  const favoriteModules = ALL_MODULES.filter((m) => favorites.has(m.key))
  const showFavorites = loaded && favoriteModules.length > 0

  // Filter row: All · Favorites (if any) · one chip per group.
  const chips = [
    { key: 'all', label: 'All' },
    ...(showFavorites ? [{ key: 'favorites', label: 'Favorites', star: true }] : []),
    ...GROUPS.map((g) => ({ key: g.label, label: g.chip })),
  ]

  return (
    <div className="space-y-8">
      {/* Greeting + quick actions */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink-50">
            {getTimeGreeting()}{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="mt-2 text-lg text-ink-400">
            Standards-aligned, ready-to-teach lessons for your subject — in about 1–2 minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/generate" className="btn-primary">
            <Plus size={16} /> Create Lesson
          </Link>
          <Link to="/lessons" className="btn-secondary">
            <Clock size={16} /> Recent
          </Link>
        </div>
      </div>

      {/* Specialty picker: heading + filter chips */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ink-100">Choose your specialty</h2>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => {
            const active = filter === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
                  active
                    ? 'bg-accent-500/15 text-accent-700 ring-accent-500/30 dark:text-accent-400'
                    : 'text-ink-400 ring-ink-800 hover:bg-ink-900 hover:text-ink-200'
                }`}
              >
                {c.star && <Star size={13} className={active ? 'fill-amber-400 text-amber-400' : 'text-amber-400'} />}
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-12">
        {/* Favorites-only view */}
        {filter === 'favorites' && (
          <ModuleGrid modules={favoriteModules} favorites={favorites} toggle={toggle} />
        )}

        {/* All view: pinned favorites (if any) + every group */}
        {filter === 'all' && (
          <>
            {showFavorites && (
              <Section
                label={<span className="flex items-center gap-1.5 text-amber-400"><Star size={13} className="fill-amber-400" /> Favorites</span>}
              >
                <ModuleGrid modules={favoriteModules} favorites={favorites} toggle={toggle} />
              </Section>
            )}
            {GROUPS.map((group) => (
              <Section key={group.label} label={group.label}>
                <ModuleGrid modules={group.modules} favorites={favorites} toggle={toggle} />
              </Section>
            ))}
          </>
        )}

        {/* Single-group view */}
        {filter !== 'all' && filter !== 'favorites' && (
          <ModuleGrid
            modules={(GROUPS.find((g) => g.label === filter)?.modules) ?? []}
            favorites={favorites}
            toggle={toggle}
          />
        )}
      </div>
    </div>
  )
}

function ModuleGrid({ modules, favorites, toggle }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {modules.map((m) => (
        <ModuleCard key={m.key} module={m} isFavorite={favorites.has(m.key)} toggle={toggle} />
      ))}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <section className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-500">{label}</p>
      {children}
    </section>
  )
}
