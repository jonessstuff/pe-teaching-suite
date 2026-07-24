import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Library, Palette, Music, FlaskConical, Briefcase, ClipboardCheck, Sparkles, BookOpen, Calculator, HeartHandshake, Languages, Compass, Speech, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(user) {
  const meta = user?.user_metadata ?? {}
  const full = (meta.full_name ?? meta.name ?? '').trim()
  return full.split(/\s+/)[0] || 'there'
}

export default function ModulePicker() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-ink-50">
          {getGreeting()}{user ? `, ${getFirstName(user)}` : ''}!
        </h1>
        <p className="mt-2 text-lg text-ink-400">Which module would you like to work in?</p>
      </div>

      {/* Module cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {/* PE & Health */}
        <Link
          to="/pe-health"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-accent-500/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15">
            <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true">
              <path
                d="M0 10 L6 10 L8 2 L11 18 L14 4 L17 10 L30 10"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-xl font-semibold text-ink-50">PE &amp; Health</h2>
            <p className="text-sm text-ink-400 leading-relaxed">
              Lessons, units, year plans, sub plans, quizzes, and more
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-accent-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Library & Media */}
        <Link
          to="/library"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-blue-500/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15">
            <Library size={28} className="text-blue-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-xl font-semibold text-ink-50">Library &amp; Media</h2>
            <p className="text-sm text-ink-400 leading-relaxed">
              Elementary K–5 library lesson planning — genre study, research skills, digital citizenship
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-blue-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Art */}
        <Link
          to="/art"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-orange-500/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
            <Palette size={28} className="text-orange-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-xl font-semibold text-ink-50">Art</h2>
            <p className="text-sm text-ink-400 leading-relaxed">
              Elementary K–5 art lessons — NCAS-aligned, studio-ready with full teacher prep
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-orange-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Music */}
        <Link
          to="/music"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-purple-500/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15">
            <Music size={28} className="text-purple-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-xl font-semibold text-ink-50">Music</h2>
            <p className="text-sm text-ink-400 leading-relaxed">
              Elementary K–5 general music lessons — NCAS-aligned with listening examples and active music making
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-purple-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* STEM */}
        <Link
          to="/stem"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-cyan-500/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15">
            <FlaskConical size={28} className="text-cyan-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-xl font-semibold text-ink-50">STEM</h2>
            <p className="text-sm text-ink-400 leading-relaxed">
              Elementary K–5 STEM lessons — engineering design, coding, science investigation, and maker projects
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* CTE */}
        <Link
          to="/cte"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-pink-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/20">
            <Briefcase size={28} className="text-pink-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">CTE</h2>
              <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-xs font-medium text-pink-400">
                Beta
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Career &amp; Technical Education for MS–HS — Hospitality &amp; Tourism, Finance, Marketing, Human Services / FCS, Health Science, and Education &amp; Training pathways
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-pink-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Classroom Management */}
        <Link
          to="/classroom-management"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-indigo-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20">
            <ClipboardCheck size={28} className="text-indigo-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Classroom Management</h2>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              All grade bands K–12 — printable cards, behavior charts, troubleshooting, data sheets, and parent communication tools
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Gifted & Talented */}
        <Link
          to="/gifted-talented"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-amber-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
            <Sparkles size={28} className="text-amber-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Gifted &amp; Talented</h2>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Differentiate any topic with Depth &amp; Complexity, plan enrichment vs. acceleration, and support 2e &amp; underachieving gifted learners (K–12)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-amber-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Reading Specialists */}
        <Link
          to="/reading-specialists"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-sky-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15">
            <BookOpen size={28} className="text-sky-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Reading Specialists</h2>
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Explicit, systematic Structured Literacy interventions — phonics, fluency, comprehension &amp; more, IDA-aligned with dyslexia-indicator flagging (K–12)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-sky-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Math Specialists */}
        <Link
          to="/math-specialists"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-lime-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-500/15">
            <Calculator size={28} className="text-lime-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Math Specialists</h2>
              <span className="rounded-full bg-lime-500/15 px-2 py-0.5 text-xs font-medium text-lime-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Concept-first math interventions &amp; differentiation — CRA sequencing, Number Talks &amp; NCTM process standards for pull-out and co-teaching (K–12)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-lime-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Special Education */}
        <Link
          to="/special-education"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-violet-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
            <HeartHandshake size={28} className="text-violet-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Special Education</h2>
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Resource &amp; self-contained instructional support — multi-tier differentiation, functional/life-skills, and push-in co-teaching ideas to adapt to your students (K–12)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-violet-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* ESL/ELL Specialist */}
        <Link
          to="/esl-specialist"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-fuchsia-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/15">
            <Languages size={28} className="text-fuchsia-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">ESL/ELL Specialist</h2>
              <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-xs font-medium text-fuchsia-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Language-development lessons for ESL/ELL teachers — WIDA proficiency levels, SIOP content &amp; language objectives, all four language domains (K–12)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-fuchsia-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* School Counselors */}
        <Link
          to="/school-counselors"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-crimson-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson-500/15">
            <Compass size={28} className="text-crimson-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">School Counselors</h2>
              <span className="rounded-full bg-crimson-500/15 px-2 py-0.5 text-xs font-medium text-crimson-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Whole-class classroom guidance curriculum — ASCA-aligned lessons across academic, career, and social/emotional development (K–12)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-crimson-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Speech-Language Pathologists */}
        <Link
          to="/slp"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-bronze-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bronze-500/15">
            <Speech size={28} className="text-bronze-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Speech-Language Pathologists</h2>
              <span className="rounded-full bg-bronze-500/15 px-2 py-0.5 text-xs font-medium text-bronze-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              SLP session activity ideas — articulation, language, fluency, social communication &amp; AAC, ASHA-aligned (K–12, plus an experimental adult-rehab tier)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-bronze-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

        {/* Student Support Team Activities */}
        <Link
          to="/student-support-activities"
          className="card group flex flex-col gap-6 p-8 transition-colors hover:border-plum-400/40"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-plum-500/15">
            <Users size={28} className="text-plum-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Student Support Team Activities</h2>
              <span className="rounded-full bg-plum-500/15 px-2 py-0.5 text-xs font-medium text-plum-400">
                New
              </span>
            </div>
            <p className="text-sm text-ink-400 leading-relaxed">
              Ready-to-run small-group SEL &amp; behavioral activities for social workers, school psychologists, MFLCs &amp; behavior specialists — role-tailored, activity structure only (K–12)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-plum-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

      </div>
    </div>
  )
}
