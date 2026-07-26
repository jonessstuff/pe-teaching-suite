import { Link } from 'react-router-dom'
import { Library, Palette, Music, Drama, Wind, FlaskConical, Monitor, Award, Briefcase, ClipboardCheck, Sparkles, BookOpen, Calculator, HeartHandshake, Languages, Compass, Speech, Hand, Handshake, PersonStanding, ScanEye, Ear, PartyPopper, Target, Globe, Users, Blocks, Layers, Presentation, Star, ArrowRight } from 'lucide-react'
import { useDisplayName, getTimeGreeting } from '../hooks/useDisplayName'
import { useFavorites } from '../hooks/useFavorites'

// ─── Module catalog ─────────────────────────────────────────────────────────
// Single source of truth for the picker cards. `key` is the module's stable
// route slug and is what gets stored in module_favorites. Accent class strings
// are kept literal (never interpolated) so Tailwind's JIT compiles them.
// PE & Health renders a custom wordmark SVG instead of a lucide icon.
const GROUPS = [
  {
    label: 'Core Specials & Encore Subjects',
    modules: [
      { key: 'pe-health', to: '/pe-health', label: 'PE & Health', Icon: null, wrap: 'bg-accent-500/15', color: 'text-accent-400', hover: 'hover:border-accent-500/40',
        desc: 'Lessons, units, year plans, sub plans, quizzes, Adaptive PE & IEP planning, and more' },
      { key: 'art', to: '/art', label: 'Art', Icon: Palette, wrap: 'bg-orange-500/15', color: 'text-orange-400', hover: 'hover:border-orange-500/40',
        desc: 'Elementary K–5 art lessons — NCAS-aligned, studio-ready with full teacher prep' },
      { key: 'library', to: '/library', label: 'Library & Media', Icon: Library, wrap: 'bg-blue-500/15', color: 'text-blue-400', hover: 'hover:border-blue-500/40',
        desc: 'Elementary K–5 library lesson planning — genre study, research skills, digital citizenship, and the shared Makerspace project generator (also in STEM)' },
      { key: 'music', to: '/music', label: 'Music', Icon: Music, wrap: 'bg-purple-500/15', color: 'text-purple-400', hover: 'hover:border-purple-500/40',
        desc: 'Elementary K–5 general music lessons — NCAS-aligned with listening examples and active music making' },
      { key: 'theater', to: '/theater', label: 'Theater / Drama', Icon: Drama, wrap: 'bg-maroon-500/15', color: 'text-maroon-400', hover: 'hover:border-maroon-400/40',
        desc: 'NCAS Theatre lessons across the four Artistic Processes — Creating, Performing, Responding & Connecting — K–12, with original scene-starters and improv (never copyrighted scripts)' },
      { key: 'dance', to: '/dance', label: 'Dance', Icon: Wind, wrap: 'bg-olive-500/15', color: 'text-olive-400', hover: 'hover:border-olive-400/40',
        desc: 'NCAS Dance lessons across the four Artistic Processes — Creating, Performing, Responding & Connecting — K–12, with the elements of dance & built-in body-safety guidance' },
      { key: 'stem', to: '/stem', label: 'STEM', Icon: FlaskConical, wrap: 'bg-cyan-500/15', color: 'text-cyan-400', hover: 'hover:border-cyan-500/40',
        desc: 'Elementary K–5 STEM lessons — engineering design, coding, science investigation, and the shared Makerspace project generator (also in Library & Media)' },
      { key: 'elementary-tech', to: '/elementary-tech', label: 'Elementary Technology / Computer Lab', Icon: Monitor, wrap: 'bg-saffron-500/15', color: 'text-saffron-400', hover: 'hover:border-saffron-400/40',
        desc: 'Self-contained K–5 computer-lab lessons — foundational skills, digital citizenship & online safety, creation tools, and intro coding — ISTE-aligned for a weekly tech special' },
      { key: 'after-school-clubs', to: '/after-school-clubs', label: 'After-School Clubs', Icon: PartyPopper, wrap: 'bg-coral-500/15', color: 'text-coral-400', hover: 'hover:border-coral-400/40',
        desc: 'Ready-to-run club session plans across 68 club types — sports, academic, creative, wellness, leadership, life-skills & interest clubs, scaled K–12 by grade band' },
      { key: 'jrotc', to: '/jrotc', label: 'JROTC', Icon: Award, wrap: 'bg-denim-500/15', color: 'text-denim-400', hover: 'hover:border-denim-400/40',
        desc: 'High-school citizenship & leadership lessons across the LET 1–4 progression — leadership, character, civics, wellness, service learning & career exploration (not military tactics)' },
      { key: 'world-languages', to: '/world-languages', label: 'World Languages', Icon: Globe, wrap: 'bg-jade-500/15', color: 'text-jade-400', hover: 'hover:border-jade-400/40',
        desc: 'ACTFL 5 Cs lessons for any language — Spanish, French, Mandarin, Latin, ASL & more — across Interpersonal, Interpretive & Presentational modes, Novice–Advanced (K–12)' },
    ],
  },
  {
    label: 'Early Childhood',
    modules: [
      { key: 'early-childhood', to: '/early-childhood', label: 'Early Childhood / Pre-K', Icon: Blocks, wrap: 'bg-grass-500/15', color: 'text-grass-400', hover: 'hover:border-grass-400/40',
        desc: 'Play-based learning centers & guided-play invitations for the whole child — NAEYC DAP, NAEYC Professional Standards & Head Start ELOF (toddlers–TK)' },
    ],
  },
  {
    label: 'Career & Technical Education',
    modules: [
      { key: 'cte', to: '/cte', label: 'CTE', Icon: Briefcase, wrap: 'bg-pink-500/20', color: 'text-pink-400', hover: 'hover:border-pink-400/40',
        desc: 'Career & Technical Education for MS–HS — Hospitality & Tourism, Finance, Marketing, Human Services / FCS, Health Science, Education & Training, Career Readiness, Information Technology, Transportation, Distribution & Logistics, Manufacturing, STEM / Engineering & Technology, Business Management & Administration, Agriculture, Food & Natural Resources, Architecture & Construction, Arts, A/V Technology & Communications, Government & Public Administration, and Law, Public Safety, Corrections & Security pathways' },
    ],
  },
  {
    label: 'Academic Intervention & Support',
    modules: [
      { key: 'esl-specialist', to: '/esl-specialist', label: 'ESL/ELL Specialist', Icon: Languages, wrap: 'bg-fuchsia-500/15', color: 'text-fuchsia-400', hover: 'hover:border-fuchsia-400/40',
        desc: 'Language-development lessons for ESL/ELL teachers — WIDA proficiency levels, SIOP content & language objectives, all four language domains (K–12)' },
      { key: 'gifted-talented', to: '/gifted-talented', label: 'Gifted & Talented', Icon: Sparkles, wrap: 'bg-amber-500/15', color: 'text-amber-400', hover: 'hover:border-amber-400/40',
        desc: 'Differentiate any topic with Depth & Complexity, plan enrichment vs. acceleration, and support 2e & underachieving gifted learners (K–12)' },
      { key: 'intervention', to: '/intervention', label: 'Intervention Planning', Icon: Layers, wrap: 'bg-stone-500/15', color: 'text-stone-400', hover: 'hover:border-stone-400/40',
        desc: 'MTSS/RTI tiered intervention ideas from a described concern — routes to Reading (IDA), Math (NCTM/CRA), or Behavior support, with Tier framing & progress monitoring' },
      { key: 'math-specialists', to: '/math-specialists', label: 'Math Specialists', Icon: Calculator, wrap: 'bg-lime-500/15', color: 'text-lime-400', hover: 'hover:border-lime-400/40',
        desc: 'Concept-first math interventions & differentiation — CRA sequencing, Number Talks & NCTM process standards for pull-out and co-teaching, plus a Tutoring Mode (private/after-school & in-class pull-aside) (K–12)' },
      { key: 'reading-specialists', to: '/reading-specialists', label: 'Reading Specialists', Icon: BookOpen, wrap: 'bg-sky-500/15', color: 'text-sky-400', hover: 'hover:border-sky-400/40',
        desc: 'Explicit, systematic Structured Literacy interventions — phonics, fluency, comprehension & more, IDA-aligned with dyslexia-indicator flagging, plus a Tutoring Mode (private/after-school & in-class pull-aside) (K–12)' },
      { key: 'special-education', to: '/special-education', label: 'Special Education', Icon: HeartHandshake, wrap: 'bg-violet-500/15', color: 'text-violet-400', hover: 'hover:border-violet-400/40',
        desc: 'Resource & self-contained instructional support — multi-tier differentiation, functional/life-skills, and push-in co-teaching ideas to adapt to your students (K–12)' },
      { key: 'test-prep', to: '/test-prep', label: 'Test Prep', Icon: Target, wrap: 'bg-steel-500/15', color: 'text-steel-400', hover: 'hover:border-steel-400/40',
        desc: 'Original SAT/ACT & state-assessment practice — original practice questions, strategies, content review & test-day prep as tutoring-style sessions (1:1 or small group)' },
    ],
  },
  {
    label: 'Student Wellbeing & Behavior',
    modules: [
      { key: 'classroom-management', to: '/classroom-management', label: 'Classroom Management', Icon: ClipboardCheck, wrap: 'bg-indigo-500/20', color: 'text-indigo-400', hover: 'hover:border-indigo-400/40',
        desc: 'All grade bands K–12 — printable quick-reference cards, behavior charts, reflection forms, behavior troubleshooting, ABC data sheets, CICO trackers, and parent communication tools' },
      { key: 'school-counselors', to: '/school-counselors', label: 'School Counselors', Icon: Compass, wrap: 'bg-crimson-500/15', color: 'text-crimson-400', hover: 'hover:border-crimson-400/40',
        desc: 'Whole-class classroom guidance curriculum — ASCA-aligned lessons across academic, career, and social/emotional development (K–12)' },
      { key: 'slp', to: '/slp', label: 'Speech-Language Pathologists', Icon: Speech, wrap: 'bg-bronze-500/15', color: 'text-bronze-400', hover: 'hover:border-bronze-400/40',
        desc: 'SLP session activity ideas — articulation, language, fluency, social communication & AAC, ASHA-aligned (K–12, plus an experimental adult-rehab tier)' },
      { key: 'ot', to: '/ot', label: 'Occupational Therapists', Icon: Hand, wrap: 'bg-periwinkle-500/15', color: 'text-periwinkle-400', hover: 'hover:border-periwinkle-400/40',
        desc: 'School-based OT activity ideas — fine motor & handwriting, sensory processing & regulation, ADLs, visual-motor & vocational skills, OTPF-4 / AOTA-aligned (K–12)' },
      { key: 'pt', to: '/pt', label: 'Physical Therapists', Icon: PersonStanding, wrap: 'bg-zinc-500/15', color: 'text-zinc-400', hover: 'hover:border-zinc-400/40',
        desc: 'School-based PT activity ideas — gross motor, mobility & positioning, adaptive-PE crossover & functional mobility, APTA / APTA Pediatric-aligned (K–12)' },
      { key: 'tvi', to: '/tvi', label: 'Teacher of the Visually Impaired', Icon: ScanEye, wrap: 'bg-cobalt-500/15', color: 'text-cobalt-400', hover: 'hover:border-cobalt-400/40',
        desc: 'Expanded Core Curriculum activity ideas — Braille & compensatory access, assistive technology, independent living, sensory & social skills, and career/transition, CEC/DVIDB-aligned (K–12)' },
      { key: 'dhh', to: '/dhh', label: 'Teacher of the Deaf & Hard of Hearing', Icon: Ear, wrap: 'bg-magenta-500/15', color: 'text-magenta-400', hover: 'hover:border-magenta-400/40',
        desc: 'ECC-DHH activity ideas — communication (bilingual-bicultural or listening & spoken language), self-advocacy, social-emotional, hearing technology & career transition, CEC/CED-aligned (K–12)' },
      { key: 'student-support-activities', to: '/student-support-activities', label: 'Student Support Team Activities', Icon: Users, wrap: 'bg-plum-500/15', color: 'text-plum-400', hover: 'hover:border-plum-400/40',
        desc: 'Ready-to-run small-group SEL & behavioral activities for social workers, school psychologists, MFLCs & behavior specialists — role-tailored, activity structure only (K–12)' },
    ],
  },
  {
    label: 'School Leadership',
    modules: [
      { key: 'staff-pd', to: '/staff-pd', label: 'Staff PD & Meeting Planning', Icon: Presentation, wrap: 'bg-gold-500/15', color: 'text-gold-400', hover: 'hover:border-gold-400/40',
        desc: 'For principals & coaches — Learning Forward-aligned PD sessions, new-teacher mentoring, walkthrough look-fors, PLC/data-team protocols, and building communication templates' },
      { key: 'instructional-coaching', to: '/instructional-coaching', label: 'Instructional Coaching', Icon: Handshake, wrap: 'bg-mocha-500/15', color: 'text-mocha-400', hover: 'hover:border-mocha-400/40',
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

  const favoriteModules = ALL_MODULES.filter((m) => favorites.has(m.key))
  const showFavorites = loaded && favoriteModules.length > 0

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-ink-50">
          {getTimeGreeting()}{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="mt-2 text-lg text-ink-400">Which module would you like to work in?</p>
      </div>

      {/* Module cards, grouped by category (favorites pinned above the groups) */}
      <div className="space-y-12">

        {showFavorites && (
          <section className="space-y-5">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Star size={13} className="fill-amber-400" /> Favorites
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteModules.map((m) => (
                <ModuleCard key={m.key} module={m} isFavorite toggle={toggle} />
              ))}
            </div>
          </section>
        )}

        {GROUPS.map((group) => (
          <ModuleSection key={group.label} label={group.label}>
            {group.modules.map((m) => (
              <ModuleCard key={m.key} module={m} isFavorite={favorites.has(m.key)} toggle={toggle} />
            ))}
          </ModuleSection>
        ))}

      </div>
    </div>
  )
}

// ─── Module card (with favorite star) ───────────────────────────────────────
function ModuleCard({ module: m, isFavorite, toggle }) {
  return (
    <div className="relative">
      <Link
        to={m.to}
        className={`card group flex h-full flex-col gap-6 p-8 transition-colors ${m.hover}`}
      >
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${m.wrap}`}>
          {m.key === 'pe-health' ? (
            <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true">
              <path
                d="M0 10 L6 10 L8 2 L11 18 L14 4 L17 10 L30 10"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <m.Icon size={28} className={m.color} />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          {/* pr-8 keeps the title clear of the star button in the corner */}
          <h2 className="pr-8 text-xl font-semibold text-ink-50">{m.label}</h2>
          <p className="text-sm text-ink-400 leading-relaxed">{m.desc}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-medium ${m.color} transition-[gap] group-hover:gap-2.5`}>
          Open module <ArrowRight size={15} />
        </div>
      </Link>

      {/* Favorite toggle — a sibling overlay (not nested in the Link) so it
          doesn't navigate and isn't invalid interactive-in-anchor markup. */}
      <button
        type="button"
        onClick={() => toggle(m.key)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remove ${m.label} from favorites` : `Add ${m.label} to favorites`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-ink-600 transition-colors hover:bg-ink-800/60 hover:text-amber-400"
      >
        <Star size={20} className={isFavorite ? 'fill-amber-400 text-amber-400' : 'fill-transparent'} />
      </button>
    </div>
  )
}

// ─── Grouped section wrapper ────────────────────────────────────────────────
function ModuleSection({ label, children }) {
  return (
    <section className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-500">{label}</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  )
}
