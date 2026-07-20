import { useSearchParams, Link } from 'react-router-dom'
import { BookOpen, Globe, Accessibility, UserCheck, ClipboardList, ClipboardCheck, Mail, CalendarRange, Check, Users, BookMarked, PartyPopper, Newspaper, MessageCircle, Share2, Briefcase, BarChart3, ScrollText, Trophy, Dumbbell, Smartphone, SquareCheck } from 'lucide-react'

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
            You teach every kid in the building. PE, Art, Music, Library, STEM — you see them all,
            every week, all year long. But when it comes to planning tools, curriculum support, and
            AI? Everyone builds for the classroom teacher. PlansK12 was built for you. Real lesson
            plans in minutes, standards-aligned to your state, built around how your class actually
            runs.
          </p>

          {/* Module chips */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
              PE &amp; Health
            </span>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400">
              Library &amp; Media
            </span>
            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-400">
              Art
            </span>
            <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-400">
              Music
            </span>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-400">
              STEM
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="https://buy.stripe.com/5kQ5kveUR2xWh0tcoi0kE05" className="btn-primary px-6 py-3 text-base">
              Start free trial
            </a>
            <a href="#features" className="btn-secondary px-6 py-3 text-base">
              See how it works
            </a>
          </div>
          <p className="mt-3 text-xs text-ink-600">14 days free, cancel anytime</p>
        </div>
      </section>

      {/* ── 2. WHO IT'S FOR ───────────────────────────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="label-eyebrow mb-3">Who it's for</p>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
              One tool for five subjects they never had one for.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ModuleCard
              name="PE & Health"
              color="emerald"
              description="Station rotations, SHAPE standards, sub plans, and accommodations built for the gym."
            />
            <ModuleCard
              name="Library & Media"
              color="blue"
              description="Genre study, research skills, and AASL-aligned lessons for K–5 library classes."
            />
            <ModuleCard
              name="Art"
              color="orange"
              description="Teacher prep, supplies lists, and NCAS-aligned lessons for elementary art rooms."
            />
            <ModuleCard
              name="Music"
              color="purple"
              description="Warm-ups, listening examples, and National Core Arts Standards for general music K–5."
            />
            <ModuleCard
              name="STEM"
              color="cyan"
              description="Engineering challenges, coding, science investigations, and maker projects — all four in one place."
            />
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES ───────────────────────────────────────────────────── */}
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
                title="Referral program"
                description="Share PlansK12 with a colleague and earn free months — your unique link is in Settings."
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

      {/* ── 4. TESTIMONIAL ────────────────────────────────────────────────── */}
      <section className="bg-ink-950 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="label-eyebrow">From a founding teacher</p>
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

      {/* ── 5. PRICING CTA ────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="label-eyebrow mb-3">Founding teacher pricing</p>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-ink-50">
            Start planning in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-ink-400">
            14-day free trial, cancel anytime.
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
                <CheckItem>14-day free trial, cancel anytime</CheckItem>
              </ul>

              <a
                href="https://buy.stripe.com/5kQ5kveUR2xWh0tcoi0kE05"
                className="btn-primary mt-8 w-full justify-center"
              >
                Start free trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink-900 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <PlansK12Logo />
          <div className="text-sm text-ink-500">
            <p>© 2026 PlansK12</p>
            <p className="mt-0.5">Built for the teachers everyone forgets about.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ─── Module card ──────────────────────────────────────────────────────────────

const MODULE_STYLES = {
  emerald: { border: 'border-emerald-500', name: 'text-emerald-400' },
  blue:    { border: 'border-blue-400',    name: 'text-blue-400'    },
  orange:  { border: 'border-orange-400',  name: 'text-orange-400'  },
  purple:  { border: 'border-purple-400',  name: 'text-purple-400'  },
  cyan:    { border: 'border-cyan-400',    name: 'text-cyan-400'    },
}

function ModuleCard({ name, color, description }) {
  const { border, name: nameColor } = MODULE_STYLES[color]
  return (
    <div className={`card flex flex-col gap-2 border-t-2 p-5 ${border}`}>
      <p className={`text-sm font-semibold ${nameColor}`}>{name}</p>
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
