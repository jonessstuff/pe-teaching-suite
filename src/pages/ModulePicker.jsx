import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Library, Palette, Music, FlaskConical, Briefcase, ArrowRight } from 'lucide-react'
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
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Library &amp; Media</h2>
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">
                Beta
              </span>
            </div>
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
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Art</h2>
              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-400">
                Beta
              </span>
            </div>
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
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">Music</h2>
              <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-xs font-medium text-purple-400">
                Beta
              </span>
            </div>
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
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-ink-50">STEM</h2>
              <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-400">
                Beta
              </span>
            </div>
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
              Career &amp; Technical Education for MS–HS — Hospitality &amp; Tourism, Finance, Marketing, and Human Services / FCS pathways
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-pink-400 transition-[gap] group-hover:gap-2.5">
            Open module <ArrowRight size={15} />
          </div>
        </Link>

      </div>
    </div>
  )
}
