import { useSearchParams, Link } from 'react-router-dom'
import { BookOpen, Globe, Accessibility, UserCheck, ClipboardList, ClipboardCheck, Mail, CalendarRange, Check, Users, BookMarked, PartyPopper, Newspaper, MessageCircle, Share2, Briefcase, BarChart3, ScrollText, Trophy, Dumbbell, Smartphone, SquareCheck, Sparkles, MousePointerClick, PencilLine, BadgeCheck } from 'lucide-react'

// ─── Shared sub-components ───────────────────────────────────────────────────

function PlansK12Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M2 2C2 0.895 2.895 0 4 0H18L26 8V30C26 31.105 25.105 32 24 32H4C2.895 32 2 31.105 2 30V2Z" fill="#4F7FFA" />
        <path d="M18 0L26 8H20C18.895 8 18 7.105 18 6V0Z" fill="#3b6de8" />
        <rect x="6" y="14" width="14" height="2" rx="1" fill="white" fillOpacity="0.8" />
        <rect x="6" y="19" width="10" height="2" rx="1" fill="white" fillOpacity="0.6" />
        <circle cx="20" cy="26" r="7" fill="#0ea5e9" />
        <path d="M16.5 26L19 28.5L23.5 23.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.01em' }}>
        <span style={{ color: '#1a1a2e' }}>Plans</span><span style={{ color: '#4F7FFA' }}>K12</span>
      </span>
    </div>
  )
}

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500/15">
        <Check size={12} className="text-accent-500" strokeWidth={2.5} />
      </span>
      <span className="text-sm text-ink-300 leading-snug">{children}</span>
    </li>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Landing() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')

  return (
    <div className="force-light min-h-screen bg-white font-sans">

      {/* ── Top nav ───────────────────────────────────────────────────────── */}
      <nav className="border-b border-ink-900 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <PlansK12Logo />
          <Link
            to="/login"
            className="text-sm font-medium text-ink-400 hover:text-ink-100 transition-colors"
          >
            Log in
          </Link>
        </div>
      </nav>

      {/* ── Referral banner ──────────────────────────────────────────────── */}
      {refCode && (
        <div className="border-b border-amber-400/30 bg-amber-400/10 px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <Users size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              A colleague referred you to PlansK12! Create an account to get started.
            </p>
            <Link to={`/login?ref=${refCode}`} className="ml-auto text-sm font-semibold text-amber-600 hover:text-amber-500 whitespace-nowrap">
              Create account →
            </Link>
          </div>
        </div>
      )}

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-16">
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-120px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: '#2dd4d4',
            opacity: 0.15,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-140px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: '#8a6fd4',
            opacity: 0.13,
            filter: 'blur(90px)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="label-eyebrow mb-4 text-accent-500">AI-powered lesson planning</p>

          <h1 className="text-4xl font-display font-semibold tracking-tight text-ink-50 sm:text-5xl">
            Built for the teachers everyone forgets about.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-400 leading-relaxed">
            You teach every kid in the building — PE, Art, Music, Library, STEM, Adaptive PE, CTE, gifted
            and talented, reading and math intervention, special education, ESL, counseling, student
            support, and early childhood. You see them all, every week, all year long. But when it comes
            to planning tools, curriculum support, and AI? Everyone builds for the classroom teacher.
            PlansK12 was built for you. Real lesson plans in minutes, standards-aligned to your state,
            built around how your class actually runs.
          </p>

          {/* Module chips — grouped by category, alphabetical within each group */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {/* Core specials & encore subjects — PE & Health (flagship) first, then alphabetical */}
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              PE &amp; Health
            </span>
            <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Adaptive PE
            </span>
            <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Art
            </span>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Library &amp; Media
            </span>
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Music
            </span>
            <span className="rounded-full bg-maroon-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Theater / Drama
            </span>
            <span className="rounded-full bg-olive-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Dance
            </span>
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              STEM
            </span>
            <span className="rounded-full bg-saffron-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Elementary Technology
            </span>
            <span className="rounded-full bg-coral-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              After-School Clubs
            </span>
            <span className="rounded-full bg-denim-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              JROTC
            </span>
            <span className="rounded-full bg-jade-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              World Languages
            </span>
            {/* Early childhood */}
            <span className="rounded-full bg-grass-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Early Childhood / Pre-K
            </span>
            {/* Career & technical education */}
            <span className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              CTE
            </span>
            {/* Academic intervention & support */}
            <span className="rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              ESL/ELL Specialist
            </span>
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Gifted &amp; Talented
            </span>
            <span className="rounded-full bg-stone-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Intervention Planning
            </span>
            <span className="rounded-full bg-lime-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Math Specialists
            </span>
            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Reading Specialists
            </span>
            <span className="rounded-full bg-steel-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Test Prep
            </span>
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Special Education
            </span>
            {/* Student wellbeing & behavior */}
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Classroom Management
            </span>
            <span className="rounded-full bg-crimson-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              School Counselors
            </span>
            <span className="rounded-full bg-bronze-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Speech-Language (SLP)
            </span>
            <span className="rounded-full bg-periwinkle-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Occupational Therapy (OT)
            </span>
            <span className="rounded-full bg-zinc-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Physical Therapy (PT)
            </span>
            <span className="rounded-full bg-cobalt-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Visually Impaired (TVI)
            </span>
            <span className="rounded-full bg-magenta-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Deaf/Hard of Hearing (D/HH)
            </span>
            <span className="rounded-full bg-plum-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Student Support Team
            </span>
            {/* School leadership */}
            <span className="rounded-full bg-gold-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Staff PD &amp; Meeting Planning
            </span>
            <span className="rounded-full bg-mocha-500/20 px-3 py-1 text-xs font-medium text-ink-50">
              Instructional Coaching
            </span>
          </div>

          <div className="mt-9 flex flex-col items-center gap-4">
            <Link
              to="/try"
              className="btn-primary px-9 py-4 text-lg shadow-lg shadow-accent-500/25"
            >
              Try a free lesson — no signup required
            </Link>
            <div className="flex items-center gap-3 text-sm text-ink-500">
              <span aria-hidden="true" className="h-px w-8 bg-ink-800" />
              <span>or</span>
              <a href="https://buy.stripe.com/5kQ5kveUR2xWh0tcoi0kE05" className="btn-secondary px-5 py-2.5">
                Start your 7-day trial
              </a>
              <span aria-hidden="true" className="h-px w-8 bg-ink-800" />
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-600">
            Your first lesson takes about 30 seconds · Trial is 7 days free, cancel anytime
          </p>
        </div>
      </section>

      {/* ── 2. HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="label-eyebrow mb-3 text-accent-500">How it works</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
              A ready-to-teach lesson in three steps.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-400">
              No training, no template wrangling, no blank page. If you can describe your class, you can build the plan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StepCard
              n={1}
              icon={MousePointerClick}
              title="Pick your subject or specialty"
              description="Choose from 30 built-in specialties — from PE and Art to reading intervention, speech-language, therapy services, world languages, and staff PD."
            />
            <StepCard
              n={2}
              icon={PencilLine}
              title="Tell us your topic and grade level"
              description="A sentence is plenty. Add your state and a note about how your class actually runs, if you want."
            />
            <StepCard
              n={3}
              icon={Sparkles}
              title="Get a ready-to-teach lesson in seconds"
              description="Standards-aligned and classroom-ready — then turn it into a sub plan, quiz, rubric, or parent newsletter in one click."
            />
          </div>

          <div className="mt-12 text-center">
            <Link to="/try" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-accent-500/25">
              Try it free — build a real lesson now
            </Link>
            <p className="mt-3 text-xs text-ink-600">No signup, no card. See it work before you decide anything.</p>
          </div>
        </div>
      </section>

      {/* ── 3. BUILT ON REAL STANDARDS ────────────────────────────────────── */}
      <section className="border-t border-ink-900 bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="label-eyebrow mb-3 text-accent-500">Built on real standards</p>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-ink-50 sm:text-3xl">
            Not generic AI. Grounded in the frameworks your field is actually held to.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-400">
            Every specialty is aligned to the recognized standards body for its field — so what you plan, teach, and hand in holds up.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {STANDARDS.map((s) => (
              <StandardBadge key={s.abbr} abbr={s.abbr} full={s.full} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. WHO IT'S FOR ───────────────────────────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="label-eyebrow mb-3">Who it's for</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
              One tool for every subject they never had one for.
            </h2>
          </div>

          <div className="space-y-10">
            <ModuleGroup label="Core Specials & Encore Subjects">
              <ModuleCard
                name="PE & Health"
                color="emerald"
                description="Station rotations, SHAPE standards, sub plans, and accommodations built for the gym."
              />
              <ModuleCard
                name="Adaptive PE"
                color="rose"
                description="Full APE lessons and accommodation plans for students with disabilities — built for real IEP goals, not generic advice."
              />
              <ModuleCard
                name="Art"
                color="orange"
                description="Teacher prep, supplies lists, and NCAS-aligned lessons for elementary art rooms."
              />
              <ModuleCard
                name="Library & Media"
                color="blue"
                description="Genre study, research skills, and AASL-aligned lessons for K–5 library classes — plus the shared Makerspace project generator (also in STEM)."
              />
              <ModuleCard
                name="Music"
                color="purple"
                description="Warm-ups, listening examples, and National Core Arts Standards for general music K–5."
              />
              <ModuleCard
                name="Theater / Drama"
                color="maroon"
                description="NCAS Theatre lessons across the four Artistic Processes — Creating, Performing, Responding & Connecting — K–12, using original scene-starters & improv, never copyrighted scripts."
              />
              <ModuleCard
                name="Dance"
                color="olive"
                description="NCAS Dance lessons across the four Artistic Processes — Creating, Performing, Responding & Connecting — K–12, built on the elements of dance with age-appropriate body-safety guidance."
              />
              <ModuleCard
                name="STEM"
                color="cyan"
                description="Engineering challenges, coding, science investigations, and maker projects — all four in one place, plus the shared Makerspace project generator (tool-specific builds, also in Library & Media)."
              />
              <ModuleCard
                name="Elementary Technology / Computer Lab"
                color="saffron"
                description="Self-contained K–5 computer-lab lessons for a weekly tech special — foundational mouse/keyboard/typing skills, digital citizenship & online safety, creation tools, and intro coding/computational thinking, aligned to the ISTE Standards for Students."
              />
              <ModuleCard
                name="After-School Clubs"
                color="coral"
                description="Ready-to-run club session plans across 68 club types — sports, academic, creative, wellness, leadership, life-skills & interest clubs — scaled K–12 by grade band, low-prep and runnable by a first-time sponsor."
              />
              <ModuleCard
                name="JROTC"
                color="denim"
                description="High-school citizenship & leadership development across the LET 1–4 progression — leadership fundamentals, advanced leadership & mentorship, civics, wellness & life skills, service learning, and civilian + military career exploration. Not military tactics; drill is precision teamwork & tradition."
              />
              <ModuleCard
                name="World Languages"
                color="jade"
                description="ACTFL 5 Cs lessons for any target language — Spanish, French, Mandarin, Latin, ASL & more — structured by the three communication modes (Interpersonal, Interpretive, Presentational), Novice–Advanced, K–12."
              />
            </ModuleGroup>

            <ModuleGroup label="Early Childhood">
              <ModuleCard
                name="Early Childhood / Pre-K"
                color="grass"
                description="Play-based learning centers & guided-play invitations for the whole child — NAEYC Developmentally Appropriate Practice, NAEYC Professional Standards & Head Start ELOF, toddlers through TK."
              />
              <ModuleCard
                name="Early Childhood Special Education"
                color="sage"
                description="Play-based, embedded-instruction support for young children with disabilities or delays (birth–5) — DEC Recommended Practices, NAEYC DAP & CEC. Naturalistic learning across play & routines for birth–3 (IFSP) and preschool (IEP); ideas to adapt to the child's plan, never IEP/IFSP goals or a diagnosis."
              />
            </ModuleGroup>

            <ModuleGroup label="Career & Technical Education">
              <ModuleCard
                name="CTE"
                color="pink"
                description="Career & Technical Education across Hospitality & Tourism, Finance, Marketing, Human Services / Family & Consumer Sciences, Health Science, Education & Training, Career Readiness (MS foundations), Information Technology, Transportation, Distribution & Logistics, Manufacturing, STEM / Engineering & Technology, Business Management & Administration, Agriculture, Food & Natural Resources, Architecture & Construction, Arts, A/V Technology & Communications, Government & Public Administration, Law, Public Safety, Corrections & Security, Cosmetology / Personal Care Services, Business Law, Sports & Entertainment Marketing, and Exercise Science / Sports Medicine pathways — standards-aligned and industry-relevant."
              />
            </ModuleGroup>

            <ModuleGroup label="Academic Intervention & Support">
              <ModuleCard
                name="ESL/ELL Specialist"
                color="fuchsia"
                description="Language-development lessons for ESL/ELL teachers — WIDA proficiency levels, SIOP content & language objectives, and all four language domains, K–12."
              />
              <ModuleCard
                name="Gifted & Talented"
                color="amber"
                description="Depth & Complexity differentiation, enrichment vs. acceleration options, and 2e / underachievement support — grounded in the NAGC framework, K–12."
              />
              <ModuleCard
                name="Intervention Planning"
                color="stone"
                description="Describe a concern and get a tiered MTSS/RTI intervention — routed to Reading (IDA), Math (NCTM/CRA), or Behavior support, with Tier framing and progress-monitoring, K–12."
              />
              <ModuleCard
                name="Math Specialists"
                color="lime"
                description="Concept-first math interventions & differentiation — CRA sequencing, Number Talks, and NCTM process standards for pull-out and co-teaching, plus a Tutoring Mode (private/after-school and in-class pull-aside), K–12."
              />
              <ModuleCard
                name="Reading Specialists"
                color="sky"
                description="Explicit, systematic Structured Literacy interventions for phonics, fluency, and comprehension — IDA-aligned, with dyslexia-indicator flagging, plus a Tutoring Mode (private/after-school and in-class pull-aside), K–12."
              />
              <ModuleCard
                name="Special Education"
                color="violet"
                description="Resource & self-contained instructional support — multi-tier differentiation, functional/life-skills, and push-in co-teaching ideas to adapt to your students, K–12."
              />
              <ModuleCard
                name="Test Prep"
                color="steel"
                description="SAT/ACT and state-assessment prep as tutoring-style sessions — 100% original practice questions (never copyrighted items), strategies, content review, and test-day prep; state path verifies against your official blueprint."
              />
            </ModuleGroup>

            <ModuleGroup label="Student Wellbeing & Behavior">
              <ModuleCard
                name="Classroom Management"
                color="indigo"
                description="All grade bands K–12 — printable quick-reference cards, behavior charts, reflection forms, behavior troubleshooting, ABC data sheets, CICO trackers, and parent communication tools."
              />
              <ModuleCard
                name="School Counselors"
                color="crimson"
                description="Whole-class classroom guidance curriculum — ASCA-aligned lessons across academic, career, and social/emotional development, K–12."
              />
              <ModuleCard
                name="Speech-Language (SLP)"
                color="bronze"
                description="SLP session activity ideas — articulation, language, fluency, social communication & AAC, ASHA-aligned; activity planning, not clinical protocol."
              />
              <ModuleCard
                name="Occupational Therapy (OT)"
                color="periwinkle"
                description="School-based OT activity ideas — fine motor & handwriting, sensory & self-regulation, ADLs, visual-motor & vocational, OTPF-4 / AOTA-aligned; activity planning, not clinical protocol."
              />
              <ModuleCard
                name="Physical Therapy (PT)"
                color="zinc"
                description="School-based PT activity ideas — gross motor, mobility & positioning, adaptive-PE crossover & functional mobility, APTA / APTA Pediatric-aligned; activity planning, not clinical protocol."
              />
              <ModuleCard
                name="Visually Impaired (TVI)"
                color="cobalt"
                description="Expanded Core Curriculum activity ideas — Braille & compensatory access, assistive technology, independent living, sensory & social skills, and career/transition, CEC/DVIDB-aligned; activity planning, not an assessment tool."
              />
              <ModuleCard
                name="Deaf/Hard of Hearing (D/HH)"
                color="magenta"
                description="ECC-DHH activity ideas — communication (bilingual-bicultural or listening & spoken language, teacher's choice), self-advocacy, social-emotional, hearing technology & career transition, CEC/CED-aligned; activity planning, not an assessment tool."
              />
              <ModuleCard
                name="Student Support Team"
                color="plum"
                description="Ready-to-run small-group SEL & behavioral activities for social workers, school psychologists, MFLCs & behavior specialists — role-tailored, activity structure only, K–12."
              />
            </ModuleGroup>

            <ModuleGroup label="School Leadership">
              <ModuleCard
                name="Staff PD & Meeting Planning"
                color="gold"
                description="For principals & coaches — Learning Forward-aligned PD sessions, new-teacher mentoring, walkthrough look-fors, PLC/data-team protocols, and building communication templates for adult, job-embedded professional learning."
              />
              <ModuleCard
                name="Instructional Coaching"
                color="mocha"
                description="Non-evaluative, partnership-based coaching built on Jim Knight's Impact Cycle & Partnership Principles — coaching conversation frameworks, teacher-driven observation tools (not evaluation), and goal-setting & data-use protocols. Confidential support, never a performance review."
              />
            </ModuleGroup>
          </div>
        </div>
      </section>

      {/* ── 5. FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="label-eyebrow mb-3">Everything in one place</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
              Plan the year. Build the lesson. Export everything.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-ink-400">
              From full-year curriculum maps to substitute-ready plans — every format generates
              from your lesson, with no rewriting required.
            </p>
          </div>

          <div className="space-y-10">

            <FeatureGroup label="Core Planning">
              <FeatureCard
                icon={BookOpen}
                title="Real state standards"
                description="Aligned to your state's specific standards, with confidence indicators so you know what to trust."
              />
              <FeatureCard
                icon={Globe}
                title="ELL accommodations"
                description="Language objectives, sentence frames, and visual supports built directly into every lesson."
              />
              <FeatureCard
                icon={Accessibility}
                title="Adaptive PE &amp; IEP planning"
                description="Accommodation plans and full APE lessons for students with disabilities — not generic advice."
              />
              <FeatureCard
                icon={CalendarRange}
                title="Pacing guide"
                description="Full-year curriculum maps aligned to your state standards, with week-by-week coverage built in."
              />
            </FeatureGroup>

            <FeatureGroup label="Assessment &amp; Documentation">
              <FeatureCard
                icon={ClipboardList}
                title="Quiz generator"
                description="Grade-appropriate assessments ready to print or copy, tied to the lesson's actual content."
              />
              <FeatureCard
                icon={ClipboardCheck}
                title="Rubric generator"
                description="Standards-aligned rubrics with four performance levels, generated from your lesson objectives."
              />
              <FeatureCard
                icon={SquareCheck}
                title="Exit ticket generator"
                description="Quick formative assessment slips tied directly to the lesson's learning targets."
              />
              <FeatureCard
                icon={BookMarked}
                title="Assessment bank"
                description="Save and reuse quizzes and rubrics across lessons and years — build your collection over time."
              />
            </FeatureGroup>

            <FeatureGroup label="Substitute &amp; Coverage">
              <FeatureCard
                icon={UserCheck}
                title="Sub plans in seconds"
                description="Substitute-ready plans any non-specialist can follow, generated from the lesson you already built."
              />
              <FeatureCard
                icon={BookOpen}
                title="Long-term sub binder"
                description="Week-by-week lesson plans for 1–8 week absences — perfect for maternity leave or medical leave."
              />
              <FeatureCard
                icon={PartyPopper}
                title="Holiday activity bank"
                description="Low-prep, high-engagement activities for any coverage situation — no planning required."
              />
            </FeatureGroup>

            <FeatureGroup label="Communication">
              <FeatureCard
                icon={Mail}
                title="Parent communication"
                description="Newsletter-ready notes connecting class activity to learning goals families can actually understand."
              />
              <FeatureCard
                icon={Newspaper}
                title="Family newsletter"
                description="Jargon-free weekly newsletter parents actually want to read, generated in one click."
              />
              <FeatureCard
                icon={MessageCircle}
                title="Parent conference prep"
                description="Structured talking points and documentation ready for parent meetings and formal conferences."
              />
              <FeatureCard
                icon={Share2}
                title="Share a lesson"
                description="Public shareable links let you spread your best work with colleagues in any district."
              />
            </FeatureGroup>

            <FeatureGroup label="Professional">
              <FeatureCard
                icon={ClipboardCheck}
                title="Observation prep"
                description="One-page summaries with standards, targets, and differentiation — ready for administrator walkthroughs."
              />
              <FeatureCard
                icon={Briefcase}
                title="Teacher portfolio builder"
                description="Compile lessons, reflections, and documents into a professional portfolio you can share or print."
              />
              <FeatureCard
                icon={BarChart3}
                title="District report"
                description="Standards coverage and lesson volume data ready to share with administration at any time."
              />
              <FeatureCard
                icon={ScrollText}
                title="End of year narrative"
                description="Professional summary of curriculum covered and student growth — ready to hand to your principal."
              />
            </FeatureGroup>

            <FeatureGroup label="Special Events">
              <FeatureCard
                icon={Trophy}
                title="Field day planner"
                description="Complete field day with stations, rotations, scoring, and volunteer instructions — all generated in one go."
              />
              <FeatureCard
                icon={Dumbbell}
                title="Fitness testing prep"
                description="Lessons specifically designed to prepare students for FitnessGram, PACER, and Presidential assessments."
              />
            </FeatureGroup>

            <FeatureGroup label="Growth">
              <FeatureCard
                icon={Users}
                title="Share with a colleague"
                description="Send PlansK12 to a fellow specialist — your unique share link is in Settings."
              />
              <FeatureCard
                icon={Smartphone}
                title="Works like an app"
                description="Install on any phone or tablet directly from the browser. No App Store, no updates to manage."
              />
            </FeatureGroup>

          </div>
        </div>
      </section>

      {/* ── 6. FOUNDER NOTE ───────────────────────────────────────────────── */}
      <section className="border-t border-ink-900 bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-eyebrow mb-5 text-accent-500">Why this exists</p>
          <blockquote className="font-display text-xl leading-relaxed text-ink-100 sm:text-2xl">
            &ldquo;I spent 27 years teaching. I built the first version for my own gym — then a
            colleague wanted one for her art room, then someone needed reading intervention, then
            counseling, then a principal asked about staff PD. I kept building because real teachers
            kept asking. PlansK12 is every one of those requests, finally in one place.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-ink-500">— The teacher who built PlansK12, after 27 years in the classroom</p>
        </div>
      </section>

      {/* ── 7. TESTIMONIAL ────────────────────────────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="label-eyebrow">From the classroom</p>
          </div>
          <div className="mx-auto max-w-2xl">
            <div className="card p-8">
              <p className="font-display text-4xl leading-none text-accent-500">&ldquo;</p>
              <blockquote className="mt-2 text-lg italic leading-relaxed text-ink-200">
                The warm-up format with fitness goals, video suggestions, student reflection,
                and parent note as a newsletter — I would have used this every single day.
              </blockquote>
              <p className="mt-6 text-sm text-ink-500">— Doreen, retired PE teacher</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. PRICING CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-ink-900 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="label-eyebrow mb-3">Founding teacher pricing</p>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
            Start planning in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-ink-400">
            One plan. Every specialty and every tool included. 7-day free trial, cancel anytime.
          </p>

          <div className="mx-auto mt-10 max-w-xs">
            <div className="card p-8">
              <span className="inline-block rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600">
                Founding teacher rate
              </span>

              <div className="mt-5">
                <p className="text-5xl font-display font-bold tracking-tight text-ink-50">
                  $6.99
                  <span className="text-2xl font-normal text-ink-400"> / mo</span>
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  <s>Regular price $9.99/month</s>
                </p>
              </div>

              <ul className="mt-6 space-y-3 text-left">
                <CheckItem>Unlimited lessons, units, and quizzes</CheckItem>
                <CheckItem>Locked in for as long as you stay subscribed</CheckItem>
                <CheckItem>7-day free trial, cancel anytime</CheckItem>
              </ul>

              <a
                href="https://buy.stripe.com/5kQ5kveUR2xWh0tcoi0kE05"
                className="btn-primary mt-8 w-full justify-center"
              >
                Start your 7-day trial
              </a>
            </div>

            <p className="mt-5 text-sm text-ink-500">
              Not ready to commit?{' '}
              <Link to="/try" className="font-semibold text-accent-600 hover:text-accent-500">
                Try a free lesson first — no signup →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink-900 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <PlansK12Logo />
          <div className="text-sm text-ink-500">
            <p>© 2026 PlansK12</p>
            <p className="mt-0.5">Built for the teachers everyone forgets about.</p>
            <a href="mailto:hello@plansk12.com?cc=plansk12.com@gmail.com" className="mt-1 inline-block text-accent-500 transition-colors hover:text-accent-400">
              Contact us
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ─── Module card ──────────────────────────────────────────────────────────────

// Each module's accent is applied as a background PILL behind the name (with
// high-contrast ink text on top), not as the name's text color — keeps names
// readable on the light landing background. `border` is the card's accent top rule.
const MODULE_STYLES = {
  emerald: { border: 'border-emerald-500', pill: 'bg-emerald-500/20' },
  blue:    { border: 'border-blue-400',    pill: 'bg-blue-500/20'    },
  orange:  { border: 'border-orange-400',  pill: 'bg-orange-500/20'  },
  purple:  { border: 'border-purple-400',  pill: 'bg-purple-500/20'  },
  cyan:    { border: 'border-cyan-400',    pill: 'bg-cyan-500/20'    },
  rose:    { border: 'border-rose-400',    pill: 'bg-rose-500/20'    },
  pink:    { border: 'border-pink-400',    pill: 'bg-pink-500/20'    },
  indigo:  { border: 'border-indigo-400',  pill: 'bg-indigo-500/20'  },
  amber:   { border: 'border-amber-400',   pill: 'bg-amber-500/20'   },
  sky:     { border: 'border-sky-400',     pill: 'bg-sky-500/20'     },
  // Available for future modules — see AVAILABLE_MODULE_ACCENTS in constants/modules.js
  violet:  { border: 'border-violet-400',  pill: 'bg-violet-500/20'  },
  fuchsia: { border: 'border-fuchsia-400', pill: 'bg-fuchsia-500/20' },
  lime:    { border: 'border-lime-400',    pill: 'bg-lime-500/20'    },
  slate:   { border: 'border-slate-400',   pill: 'bg-slate-500/20'   },
  stone:   { border: 'border-stone-400',   pill: 'bg-stone-500/20'   },
  crimson: { border: 'border-crimson-400', pill: 'bg-crimson-500/20' },
  grass:   { border: 'border-grass-400',   pill: 'bg-grass-500/20'   },
  bronze:  { border: 'border-bronze-400',  pill: 'bg-bronze-500/20'  },
  plum:    { border: 'border-plum-400',    pill: 'bg-plum-500/20'    },
  zinc:    { border: 'border-zinc-400',    pill: 'bg-zinc-500/20'    },
  gold:       { border: 'border-gold-400',       pill: 'bg-gold-500/20'       },
  coral:      { border: 'border-coral-400',      pill: 'bg-coral-500/20'      },
  periwinkle: { border: 'border-periwinkle-400', pill: 'bg-periwinkle-500/20' },
  steel:      { border: 'border-steel-400',      pill: 'bg-steel-500/20'      },
  mocha:      { border: 'border-mocha-400',      pill: 'bg-mocha-500/20'      },
  jade:       { border: 'border-jade-400',       pill: 'bg-jade-500/20'       },
  cobalt:     { border: 'border-cobalt-400',     pill: 'bg-cobalt-500/20'     },
  magenta:    { border: 'border-magenta-400',    pill: 'bg-magenta-500/20'    },
  saffron:    { border: 'border-saffron-400',    pill: 'bg-saffron-500/20'    },
  olive:      { border: 'border-olive-400',      pill: 'bg-olive-500/20'      },
  maroon:     { border: 'border-maroon-400',     pill: 'bg-maroon-500/20'     },
  // pass-4
  denim:      { border: 'border-denim-400',      pill: 'bg-denim-500/20'      },
  sage:       { border: 'border-sage-400',       pill: 'bg-sage-500/20'       },
  clay:       { border: 'border-clay-400',       pill: 'bg-clay-500/20'       },
  sand:       { border: 'border-sand-400',       pill: 'bg-sand-500/20'       },
}

function ModuleGroup({ label, children }) {
  return (
    <div>
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-ink-500">{label}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

function ModuleCard({ name, color, description }) {
  const { border, pill } = MODULE_STYLES[color]
  return (
    <div className={`card flex flex-col items-start gap-2 border-t-2 p-5 ${border}`}>
      <span className={`inline-block rounded-md px-2 py-0.5 text-sm font-semibold text-ink-50 ${pill}`}>
        {name}
      </span>
      <p className="text-sm text-ink-400 leading-snug">{description}</p>
    </div>
  )
}

// ─── Feature group ────────────────────────────────────────────────────────────

function FeatureGroup({ label, children }) {
  return (
    <div>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-ink-600">{label}</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {children}
      </div>
    </div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10">
        <Icon size={20} className="text-accent-500" />
      </div>
      <div>
        <p className="font-semibold text-ink-50">{title}</p>
        <p className="mt-1 text-sm text-ink-400 leading-snug">{description}</p>
      </div>
    </div>
  )
}

// ─── How-it-works step card ────────────────────────────────────────────────────

function StepCard({ n, icon: Icon, title, description }) {
  return (
    <div className="card flex flex-col items-center gap-4 p-8 text-center">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/15">
          <Icon size={28} className="text-accent-600" />
        </div>
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white ring-2 ring-white">
          {n}
        </span>
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink-50">{title}</p>
        <p className="mt-2 text-sm text-ink-400 leading-snug">{description}</p>
      </div>
    </div>
  )
}

// ─── Standards badge row ───────────────────────────────────────────────────────

// The recognized standards body (or framework) each specialty is aligned to.
// Keep in sync with the module descriptions above.
const STANDARDS = [
  { abbr: 'SHAPE America', full: 'PE & Health' },
  { abbr: 'NCAS', full: 'National Core Arts — Art, Music, Theater & Dance' },
  { abbr: 'AASL', full: 'School Libraries' },
  { abbr: 'ISTE', full: 'Educational Technology' },
  { abbr: 'ACTFL', full: 'World Languages' },
  { abbr: 'WIDA', full: 'English Language Development' },
  { abbr: 'NAGC', full: 'Gifted & Talented' },
  { abbr: 'IDA', full: 'Structured Literacy / Dyslexia' },
  { abbr: 'NCTM', full: 'Mathematics' },
  { abbr: 'CEC', full: 'Special Education' },
  { abbr: 'ASCA', full: 'School Counseling' },
  { abbr: 'ASHA', full: 'Speech-Language' },
  { abbr: 'AOTA', full: 'Occupational Therapy' },
  { abbr: 'APTA', full: 'Physical Therapy' },
  { abbr: 'NAEYC', full: 'Early Childhood' },
  { abbr: 'Head Start ELOF', full: 'Early Learning Outcomes' },
  { abbr: 'Learning Forward', full: 'Professional Learning' },
]

function StandardBadge({ abbr, full }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-800 bg-white px-3 py-1.5 shadow-sm">
      <BadgeCheck size={14} className="shrink-0 text-accent-500" />
      <span className="text-sm font-semibold text-ink-100">{abbr}</span>
      <span className="hidden text-xs text-ink-500 sm:inline">· {full}</span>
    </span>
  )
}
