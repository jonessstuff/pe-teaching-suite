import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CHECKOUT_URL, YEARLY_CHECKOUT_URL } from '../services/trialService'
import { submitSchoolInterest } from '../services/schoolInterestService'
import { BookOpen, Globe, Accessibility, UserCheck, ClipboardList, ClipboardCheck, Mail, CalendarRange, Check, X, Users, BookMarked, PartyPopper, Newspaper, MessageCircle, Share2, Briefcase, BarChart3, ScrollText, Trophy, Dumbbell, Smartphone, SquareCheck, Sparkles, MousePointerClick, PencilLine, BadgeCheck, LogIn, Building2, Loader2, ArrowRight } from 'lucide-react'

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
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15">
        <Check size={12} className="text-brand-500" strokeWidth={2.5} />
      </span>
      <span className="text-sm text-ink-300 leading-snug">{children}</span>
    </li>
  )
}

// Rows for the "PlansK12 vs. a generic AI chatbot" comparison. No brand names —
// the contrast is with general-purpose AI tools, not any specific competitor.
const COMPARE_ROWS = [
  {
    need: 'State-standards alignment',
    plansk12: "Grounded in your field's recognized standards framework — and any code it isn't sure of is flagged to verify, never passed off as fact.",
    generic: 'Guesses or invents standard codes, with no way to tell what is real.',
  },
  {
    need: 'Built for your subject',
    plansk12: '30+ specialist modules — PE & Health, art, music, library, reading intervention, special education, counseling and more.',
    generic: 'General-purpose chat with no specialist pedagogy behind it.',
  },
  {
    need: 'Ready-to-use formats',
    plansk12: 'Full-year maps, sub plans, parent notes, and IEP / adaptive supports generate from one lesson.',
    generic: 'You prompt, re-prompt, and reformat each piece by hand every time.',
  },
  {
    need: 'Consistent every time',
    plansk12: 'The same reliable structure on every single generation.',
    generic: 'Output format drifts from one chat to the next.',
  },
  {
    need: 'Accommodations built in',
    plansk12: 'ELL, IEP, and adaptive supports included in every lesson automatically.',
    generic: 'Only if you remember to ask — and can describe them yourself.',
  },
  {
    need: 'Save, print & share',
    plansk12: 'A personal lesson library, print-ready lessons (Word & PowerPoint export), and share links for colleagues.',
    generic: 'Copy-paste into another document and format it yourself.',
  },
  {
    need: 'No prompt-writing needed',
    plansk12: 'Pick a few options and generate — designed by a teacher of 27 years.',
    generic: 'Results depend on your own prompt-engineering skill.',
  },
]

function CompareRow({ need, plansk12, generic }) {
  return (
    <div className="grid grid-cols-[1.1fr_1.4fr_1.4fr] border-t border-ink-800">
      <div className="px-4 py-4 text-sm font-medium text-ink-100 sm:px-6">{need}</div>
      <div className="flex items-start gap-2.5 border-l border-ink-800 bg-brand-500/[0.06] px-4 py-4 sm:px-6">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 shadow-sm shadow-brand-500/40">
          <Check size={15} className="text-white" strokeWidth={3.5} />
        </span>
        <span className="text-sm leading-snug text-ink-200">{plansk12}</span>
      </div>
      <div className="flex items-start gap-2.5 border-l border-ink-800 px-4 py-4 sm:px-6">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 shadow-sm shadow-red-500/40">
          <X size={15} className="text-white" strokeWidth={3.5} />
        </span>
        <span className="text-sm leading-snug text-ink-500">{generic}</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Landing() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')
  const [showAllFeatures, setShowAllFeatures] = useState(false)
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'yearly'

  return (
    <div className="force-light min-h-screen bg-white font-sans">

      {/* ── Top nav ───────────────────────────────────────────────────────── */}
      <nav className="border-b border-ink-900 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <PlansK12Logo />
          <div className="flex items-center gap-5">
            <Link to="/demo" className="hidden text-sm font-semibold text-brand-600 hover:text-brand-500 sm:inline">Explore live demos</Link>
            <a href="#schools" className="hidden text-sm font-medium text-ink-500 transition-colors hover:text-brand-600 sm:inline">
              For schools &amp; districts
            </a>
            <Link to="/login" className="btn-outline">
              <LogIn size={15} />
              Log in
            </Link>
          </div>
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
          <p className="label-eyebrow mb-4 text-brand-500">AI-powered lesson planning</p>

          <h1 className="text-4xl font-display font-semibold tracking-tight text-ink-50 sm:text-5xl">
            Built for the teachers everyone forgets about.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-400 leading-relaxed">
            You teach every kid in the building — but the planning tools all get built for the
            classroom teacher. PlansK12 is built for you: real, standards-aligned lessons in minutes,
            shaped around how your class actually runs.
          </p>

          {/* A representative sample of specialties — the full set lives in the
              carousel below (linked from the "+more" pill), so the hero doesn't
              open with a 30-item wall. */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-ink-50">PE &amp; Health</span>
            <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-ink-50">Art</span>
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-ink-50">Music</span>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-ink-50">Library &amp; Media</span>
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-ink-50">STEM</span>
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-ink-50">Special Education</span>
            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-ink-50">Reading Specialists</span>
            <span className="rounded-full bg-crimson-500/20 px-3 py-1 text-xs font-medium text-ink-50">School Counselors</span>
            <a
              href="#specialties"
              className="rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500/20"
            >
              +24 more specialties ↓
            </a>
          </div>

          <div className="mt-9 flex flex-col items-center gap-3">
            <Link to="/demo" className="btn-primary !bg-brand-500 hover:!bg-brand-600 px-8 py-4 text-lg shadow-lg shadow-brand-500/25">
              Explore interactive demos <ArrowRight size={17} />
            </Link>
            <a href={CHECKOUT_URL} className="btn-secondary px-6 py-3">Start my 7-day free trial</a>
            <Link to="/try" className="text-sm font-medium text-ink-500 underline decoration-ink-700 underline-offset-4 hover:text-brand-600">Or generate one free lesson—no signup</Link>
          </div>
          <p className="mt-4 text-xs text-ink-600">
            Your first lesson takes about 1–2 minutes · Then $9.99/month · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── 2. HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="label-eyebrow mb-3 text-brand-500">How it works</p>
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
              description="Choose from 30 built-in specialties — from PE & Health and Art to reading intervention, speech-language, therapy services, world languages, and staff PD."
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
            <Link to="/try" className="btn-primary !bg-brand-500 hover:!bg-brand-600 px-8 py-3.5 text-base shadow-lg shadow-brand-500/25">
              Try it free — build a real lesson now
            </Link>
            <p className="mt-3 text-xs text-ink-600">No signup, no card. See it work before you decide anything.</p>
          </div>
        </div>
      </section>

      {/* ── 3. BUILT ON REAL STANDARDS ────────────────────────────────────── */}
      <section className="border-t border-ink-900 bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="label-eyebrow mb-3 text-brand-500">Built on real standards</p>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-ink-50 sm:text-3xl">
            Not generic AI. Grounded in the frameworks your field is actually held to.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-400">
            Every specialty is anchored to the recognized standards body for its field — and anything it can't cite with certainty is flagged for you to verify, not invented.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {STANDARDS.map((s) => (
              <StandardBadge key={s.abbr} abbr={s.abbr} full={s.full} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. WHO IT'S FOR ───────────────────────────────────────────────── */}
      <section id="specialties" className="scroll-mt-8 bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="label-eyebrow mb-3 text-brand-500">Who it's for</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
              One tool for every subject they never had one for.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-400">
              30+ specialties, one login. Swipe through any group to find yours.
            </p>
          </div>

          <div className="space-y-10">
            <ModuleGroup label="Core Specials & Encore Subjects">
              <ModuleCard
                name="PE & Health"
                color="emerald"
                description="Station rotations, SHAPE-aligned lessons, sub plans, and accommodations built for the gym."
              />
              <ModuleCard
                name="Adaptive PE"
                color="rose"
                description="Full APE lessons and accommodation plans built around real IEP goals — not generic advice."
              />
              <ModuleCard
                name="Art"
                color="orange"
                description="NCAS-aligned lessons with teacher prep and supply lists for the elementary art room."
              />
              <ModuleCard
                name="Library & Media"
                color="blue"
                description="Genre study, research skills, and AASL-aligned lessons for K–5 — plus the Makerspace project generator."
              />
              <ModuleCard
                name="Music"
                color="purple"
                description="Warm-ups, listening examples, and National Core Arts Standards for general music, K–5."
              />
              <ModuleCard
                name="Theater / Drama"
                color="maroon"
                description="NCAS Theatre across all four Artistic Processes, K–12 — original scene-starters, never copyrighted scripts."
              />
              <ModuleCard
                name="Dance"
                color="olive"
                description="NCAS Dance built on the elements of dance, K–12, with age-appropriate body-safety guidance."
              />
              <ModuleCard
                name="STEM"
                color="cyan"
                description="Engineering, coding, science investigations, and maker projects — all in one place."
              />
              <ModuleCard
                name="Elementary Technology / Computer Lab"
                color="saffron"
                description="Self-contained K–5 computer-lab lessons — keyboarding, digital citizenship, creation tools, and intro coding, ISTE-aligned."
              />
              <ModuleCard
                name="After-School Clubs"
                color="coral"
                description="Ready-to-run session plans across 68 club types, scaled K–12 — low-prep enough for a first-time sponsor."
              />
              <ModuleCard
                name="JROTC"
                color="denim"
                description="LET 1–4 citizenship and leadership — civics, wellness, and service learning, not military tactics."
              />
              <ModuleCard
                name="World Languages"
                color="jade"
                description="ACTFL 5 Cs lessons for any language, Novice–Advanced, structured by the three communication modes."
              />
            </ModuleGroup>

            <ModuleGroup label="Early Childhood">
              <ModuleCard
                name="Early Childhood / Pre-K"
                color="grass"
                description="Play-based learning centers and guided-play invitations for the whole child — NAEYC DAP and Head Start ELOF."
              />
              <ModuleCard
                name="Early Childhood Special Education"
                color="sage"
                description="Play-based, embedded support for young children with delays (birth–5) — DEC, NAEYC DAP, and CEC-aligned."
              />
            </ModuleGroup>

            <ModuleGroup label="Career & Technical Education">
              <ModuleCard
                name="CTE"
                color="pink"
                description="Standards-aligned, industry-relevant lessons across 20+ Career & Technical Education pathways."
              />
            </ModuleGroup>

            <ModuleGroup label="Academic Intervention & Support">
              <ModuleCard
                name="ESL/ELL Specialist"
                color="fuchsia"
                description="Language-development lessons with WIDA levels and SIOP objectives across all four domains, K–12."
              />
              <ModuleCard
                name="Gifted & Talented"
                color="amber"
                description="Depth & Complexity differentiation and enrichment vs. acceleration, NAGC-grounded, K–12."
              />
              <ModuleCard
                name="Intervention Planning"
                color="stone"
                description="Tiered MTSS/RTI plans routed to reading, math, or behavior — with progress-monitoring, K–12."
              />
              <ModuleCard
                name="Math Specialists"
                color="lime"
                description="Concept-first math interventions — CRA sequencing, Number Talks, and NCTM standards, plus a Tutoring Mode."
              />
              <ModuleCard
                name="Reading Specialists"
                color="sky"
                description="Explicit Structured Literacy interventions with dyslexia-indicator flagging, IDA-aligned, plus a Tutoring Mode."
              />
              <ModuleCard
                name="Special Education"
                color="violet"
                description="Resource and self-contained support — multi-tier differentiation, life-skills, and co-teaching ideas, K–12."
              />
              <ModuleCard
                name="Test Prep"
                color="steel"
                description="SAT/ACT and state-assessment prep with 100% original practice questions — never copyrighted items."
              />
            </ModuleGroup>

            <ModuleGroup label="Student Wellbeing & Behavior">
              <ModuleCard
                name="Classroom Management"
                color="indigo"
                description="Printable behavior cards, charts, ABC/CICO trackers, and parent-communication tools, K–12."
              />
              <ModuleCard
                name="School Counselors"
                color="crimson"
                description="ASCA-aligned classroom guidance across academic, career, and social/emotional development, K–12."
              />
              <ModuleCard
                name="Speech-Language (SLP)"
                color="bronze"
                description="Session activity ideas for articulation, language, fluency, social communication, and AAC — ASHA-aligned."
              />
              <ModuleCard
                name="Occupational Therapy (OT)"
                color="periwinkle"
                description="School-based OT activity ideas — fine motor, sensory, ADLs, and visual-motor, OTPF-4 / AOTA-aligned."
              />
              <ModuleCard
                name="Physical Therapy (PT)"
                color="zinc"
                description="School-based PT activity ideas — gross motor, mobility, and positioning, APTA-aligned."
              />
              <ModuleCard
                name="Visually Impaired (TVI)"
                color="cobalt"
                description="Expanded Core Curriculum activities — Braille, assistive tech, and independent living, CEC/DVIDB-aligned."
              />
              <ModuleCard
                name="Deaf/Hard of Hearing (D/HH)"
                color="magenta"
                description="ECC-DHH activities — communication, self-advocacy, and hearing technology, CEC/CED-aligned."
              />
              <ModuleCard
                name="Student Support Team"
                color="plum"
                description="Ready-to-run small-group SEL and behavioral activities, role-tailored for support staff, K–12."
              />
            </ModuleGroup>

            <ModuleGroup label="School Leadership">
              <ModuleCard
                name="Staff PD & Meeting Planning"
                color="gold"
                description="Learning Forward-aligned PD, mentoring, walkthrough look-fors, and PLC protocols for principals and coaches."
              />
              <ModuleCard
                name="Instructional Coaching"
                color="mocha"
                description="Partnership-based coaching on the Impact Cycle — confidential support, never a performance review."
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
                title="Real standards, honestly flagged"
                description="Anchored to the recognized standards framework for your subject, with any uncertain code flagged to verify against your state's official standards."
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

            {/* The remaining tool groups collapse behind a toggle so the section
                previews the breadth without dropping ~18 more cards at once. */}
            {showAllFeatures && (
              <div className="space-y-10">
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
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAllFeatures((v) => !v)}
                className="btn-secondary px-6 py-2.5"
              >
                {showAllFeatures ? 'Show fewer tools' : 'Show all 20+ tools'}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. PLANSK12 vs. A GENERIC AI CHATBOT ──────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="label-eyebrow mb-3">Why not just use a chatbot?</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
              Built for teachers — not general chat
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-400">
              A generic AI tool can write you a paragraph. PlansK12 is purpose-built for K-12
              specialists — grounded in real standards, structured for the classroom, and ready to
              print, save, and share.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="mx-auto min-w-[680px] overflow-hidden rounded-2xl border border-ink-800">
              {/* Header row */}
              <div className="grid grid-cols-[1.1fr_1.4fr_1.4fr] bg-ink-900/60">
                <div className="px-4 py-4 sm:px-6" />
                <div className="flex items-center gap-2 border-l border-ink-800 px-4 py-4 sm:px-6">
                  <Sparkles size={16} className="text-brand-500" />
                  <span className="font-display text-base font-semibold text-ink-50">PlansK12</span>
                </div>
                <div className="border-l border-ink-800 px-4 py-4 sm:px-6">
                  <span className="text-base font-medium text-ink-400">A generic AI chatbot</span>
                </div>
              </div>
              {COMPARE_ROWS.map((row) => (
                <CompareRow key={row.need} {...row} />
              ))}
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-ink-500">
            Same idea, very different result — because PlansK12 was built by a teacher, for teachers.
          </p>
        </div>
      </section>

      {/* ── 7. FOUNDER NOTE ───────────────────────────────────────────────── */}
      <section className="border-t border-ink-900 bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-eyebrow mb-5 text-brand-500">Why this exists</p>
          <blockquote className="font-display text-xl leading-relaxed text-ink-100 sm:text-2xl">
            &ldquo;I spent 27 years teaching. I built the first version for my own gym — then a
            colleague wanted one for her art room, then someone needed reading intervention, then
            counseling, then a principal asked about staff PD. I kept building because real teachers
            kept asking. PlansK12 is every one of those requests, finally in one place.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-ink-500">— The teacher who built PlansK12, after 27 years in the classroom</p>
        </div>
      </section>

      {/* ── 8. TESTIMONIAL ────────────────────────────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="label-eyebrow">From the classroom</p>
          </div>
          <div className="mx-auto max-w-2xl">
            <div className="card p-8">
              <p className="font-display text-4xl leading-none text-brand-500">&ldquo;</p>
              <blockquote className="mt-2 text-lg italic leading-relaxed text-ink-200">
                The warm-up format with fitness goals, video suggestions, student reflection,
                and parent note as a newsletter — I would have used this every single day.
              </blockquote>
              <p className="mt-6 text-sm text-ink-500">— Doreen, retired PE teacher</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. PRICING CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-ink-900 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="label-eyebrow mb-3">Simple pricing</p>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
            Start planning in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-400">
            Every specialty and every tool, in one plan. Start monthly with a 7-day free trial —
            or pay yearly and get 2 months free.
          </p>

          <div className="mx-auto mt-10 max-w-sm">
            {/* Monthly / Yearly toggle */}
            <div className="mb-6 inline-flex rounded-lg border border-ink-800 bg-ink-900/40 p-1 text-sm">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                className={`rounded-md px-4 py-1.5 font-medium transition-colors ${billing === 'monthly' ? 'bg-brand-500 text-white' : 'text-ink-400 hover:text-ink-200'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling('yearly')}
                className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 font-medium transition-colors ${billing === 'yearly' ? 'bg-brand-500 text-white' : 'text-ink-400 hover:text-ink-200'}`}
              >
                Yearly
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-brand-500/15 text-brand-600'}`}>
                  2 months free
                </span>
              </button>
            </div>

            <div className="card p-8">
              {billing === 'monthly' ? (
                <>
                  <div>
                    <p className="text-5xl font-display font-bold tracking-tight text-ink-50">
                      $9.99
                      <span className="text-2xl font-normal text-ink-400"> / mo</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-500">Billed monthly · cancel anytime</p>
                  </div>

                  <ul className="mt-6 space-y-3 text-left">
                    <CheckItem>Unlimited lessons, units, and quizzes</CheckItem>
                    <CheckItem>Every specialty and every tool included</CheckItem>
                    <CheckItem>7-day free trial, cancel anytime</CheckItem>
                  </ul>

                  <a
                    href={CHECKOUT_URL}
                    className="btn-primary !bg-brand-500 hover:!bg-brand-600 mt-8 w-full justify-center"
                  >
                    Start your 7-day trial
                  </a>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-5xl font-display font-bold tracking-tight text-ink-50">
                      $99.99
                      <span className="text-2xl font-normal text-ink-400"> / yr</span>
                    </p>
                    <p className="mt-3 inline-block rounded-full bg-brand-500/10 px-3 py-1 text-sm font-bold text-brand-600">
                      🎉 That's 2 months free
                    </p>
                    <p className="mt-2 text-sm text-ink-500">
                      $99.99/year vs. $119.88 billed monthly — you save ~$20.
                    </p>
                  </div>

                  <ul className="mt-6 space-y-3 text-left">
                    <CheckItem>Unlimited lessons, units, and quizzes</CheckItem>
                    <CheckItem>Every specialty and every tool included</CheckItem>
                    <CheckItem>Two months free vs. paying month to month</CheckItem>
                  </ul>

                  <a
                    href={YEARLY_CHECKOUT_URL}
                    className="btn-primary !bg-brand-500 hover:!bg-brand-600 mt-8 w-full justify-center"
                  >
                    Get the yearly plan
                  </a>
                  <p className="mt-3 text-xs text-ink-600">Billed $99.99 today · annual plan has no free trial</p>
                </>
              )}
            </div>

            <p className="mt-5 text-sm text-ink-500">
              Not ready to commit?{' '}
              <Link to="/try" className="font-semibold text-brand-600 hover:text-brand-500">
                Try a free lesson first — no signup →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── 9b. SCHOOL / DISTRICT INTEREST ─────────────────────────────────── */}
      <section id="schools" className="scroll-mt-8 border-t border-ink-900 bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15">
            <Building2 size={24} className="text-brand-500" />
          </div>
          <p className="label-eyebrow mb-3">For schools &amp; districts</p>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
            Interested in PlansK12 for your whole school or district?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-400">
            We don&rsquo;t have school- or district-wide licensing yet — we&rsquo;re gauging
            interest before we build it. Tell us a little about your school and we&rsquo;ll be
            in touch. No commitment, and no pricing to review (there isn&rsquo;t any yet).
          </p>
          <SchoolInterestForm />
        </div>
      </section>

      {/* ── 10. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink-900 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <PlansK12Logo />
          <div className="flex flex-col items-center gap-2 text-sm text-ink-500 sm:items-end">
            <p>© 2026 PlansK12</p>
            <p className="mt-0.5">Built for the teachers everyone forgets about.</p>
            <a href="mailto:hello@plansk12.com?cc=plansk12.com@gmail.com" className="btn-outline mt-1">
              <Mail size={15} />
              Contact us
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ─── School / District interest form ─────────────────────────────────────────

function SchoolInterestForm() {
  const [form, setForm] = useState({ name: '', organization: '', email: '', teacherCount: '', note: '' })
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'sent' | 'error'
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      await submitSchoolInterest(form)
      setStatus('sent')
    } catch (err) {
      setError(err?.message ?? 'Something went wrong — please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-brand-500/30 bg-brand-500/[0.06] p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15">
          <Check size={20} className="text-brand-500" />
        </div>
        <p className="font-semibold text-ink-50">Thanks — we&rsquo;ve got it.</p>
        <p className="mt-1 text-sm text-ink-400">
          We&rsquo;ll reach out to {form.email} as school/district options take shape.
        </p>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-lg border border-ink-800 bg-ink-900/40 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-brand-500'

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md space-y-3 text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputCls} placeholder="Your name" value={form.name} onChange={set('name')} autoComplete="name" required />
        <input className={inputCls} type="email" placeholder="Work email" value={form.email} onChange={set('email')} autoComplete="email" required />
      </div>
      <input className={inputCls} placeholder="School or district" value={form.organization} onChange={set('organization')} autoComplete="organization" required />
      <input className={inputCls} type="number" min="1" placeholder="Approx. number of teachers (optional)" value={form.teacherCount} onChange={set('teacherCount')} />
      <textarea className={inputCls} rows={2} placeholder="Anything else? (optional)" value={form.note} onChange={set('note')} />
      {status === 'error' && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn-primary !bg-brand-500 hover:!bg-brand-600 w-full justify-center disabled:opacity-60"
      >
        {status === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Register interest'}
      </button>
      <p className="text-center text-xs text-ink-600">
        Just gauging interest — no commitment, and we won&rsquo;t share your details.
      </p>
    </form>
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
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-500">{label}</p>
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-ink-600">Scroll →</span>
      </div>
      {/* Horizontal scroll-snap row — swipe on touch, scroll on desktop. Keeps
          each category browsable without stacking 30+ cards vertically. */}
      <div className="flex snap-x gap-4 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
    </div>
  )
}

function ModuleCard({ name, color, description }) {
  const { border, pill } = MODULE_STYLES[color]
  return (
    <div className={`card flex w-64 shrink-0 snap-start flex-col items-start gap-2 border-t-2 p-5 ${border}`}>
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
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
        <Icon size={20} className="text-brand-500" />
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15">
          <Icon size={28} className="text-brand-600" />
        </div>
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white ring-2 ring-white">
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
      <BadgeCheck size={14} className="shrink-0 text-brand-500" />
      <span className="text-sm font-semibold text-ink-100">{abbr}</span>
      <span className="hidden text-xs text-ink-500 sm:inline">· {full}</span>
    </span>
  )
}
