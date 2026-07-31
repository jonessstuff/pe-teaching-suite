import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, Sparkles, BookOpen, BookMarked, CalendarDays, ClipboardList, Layers, ArrowRight, ArrowLeft, Loader2, BarChart3, CalendarRange, FileInput, ScrollText, PartyPopper, Flame, BookCheck, Wrench } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import LessonCard from '../components/lesson/LessonCard'
import RecentLessonsPanel from '../components/lesson/RecentLessonsPanel'

export default function StemHome() {
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listLessons()
      .then((all) => setLessons(all.filter((l) =>
        (l.lesson_object?.subject ?? l.subject) === 'STEM'
      )))
      .catch((err) => setError(err.message))
  }, [])

  const recent = (lessons ?? []).slice(0, 3)

  return (
    <div className="space-y-10">
      {/* Back to module picker */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
      >
        <ArrowLeft size={14} />
        All modules
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
            <FlaskConical size={20} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-ink-50">STEM</h1>
            </div>
            <p className="text-sm text-ink-500">
              Elementary K–5 lesson planning for STEM specialists and classroom teachers
            </p>
          </div>
        </div>
      </div>

      {/* My lessons — search / sort / starred */}
      <RecentLessonsPanel lessons={lessons} error={error} browseTo="/stem/lessons" accentText="text-cyan-400" />

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/stem/generate"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-cyan-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15">
              <Sparkles size={22} className="text-cyan-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Generate a STEM lesson</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Engineering design, coding, science investigation, or maker — 5-phase lesson ready to teach
            </p>
          </div>
        </Link>

        {lessons !== null && lessons.length > 0 && (
          <Link
            to="/stem/lessons"
            className="card group flex flex-col gap-4 p-6 transition-colors hover:border-amber-500/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15">
                <ClipboardList size={22} className="text-amber-400" />
              </div>
              <ArrowRight
                size={18}
                className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-amber-400"
              />
            </div>
            <div>
              <p className="font-semibold text-ink-50">Generate a quiz</p>
              <p className="mt-0.5 text-sm text-ink-500">
                Grade-appropriate, ready to print
              </p>
            </div>
          </Link>
        )}

        <Link
          to="/build-unit?subject=stem"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-cyan-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15">
              <Layers size={22} className="text-cyan-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Build a unit</p>
            <p className="mt-0.5 text-sm text-ink-500">
              2–3 connected stages for one STEM project or investigation
            </p>
          </div>
        </Link>

        <Link
          to="/stem/makerspace"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-slate-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500/15">
              <Wrench size={22} className="text-slate-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-slate-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Makerspace project</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Tool-specific builds, safety &amp; station logistics, cross-curricular making
            </p>
          </div>
        </Link>

        <Link
          to="/schedule"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-teal-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15">
              <CalendarDays size={22} className="text-teal-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-teal-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Set up my schedule</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Auto-fill your periods every time
            </p>
          </div>
        </Link>

        <Link
          to="/sub-binder?subject=stem"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-amber-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15">
              <BookMarked size={22} className="text-amber-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-amber-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Long-term sub binder</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Week-by-week plans for 1–8 week absences
            </p>
          </div>
        </Link>

        <Link
          to="/stem/lessons"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-emerald-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
              <BookOpen size={22} className="text-emerald-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Browse my lessons</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Everything you&rsquo;ve created, organized
            </p>
          </div>
        </Link>

        <Link to="/assessments" className="card group flex flex-col gap-4 p-6 transition-colors hover:border-indigo-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15"><BookCheck size={22} className="text-indigo-400" /></div>
            <ArrowRight size={18} className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
          </div>
          <div><p className="font-semibold text-ink-50">Assessment Bank</p><p className="mt-0.5 text-sm text-ink-500">Quizzes, rubrics, and exit tickets</p></div>
        </Link>
        <Link to="/standards-tracker" className="card group flex flex-col gap-4 p-6 transition-colors hover:border-violet-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15"><BarChart3 size={22} className="text-violet-400" /></div>
            <ArrowRight size={18} className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-violet-400" />
          </div>
          <div><p className="font-semibold text-ink-50">Standards Tracker</p><p className="mt-0.5 text-sm text-ink-500">See which standards you&rsquo;ve covered</p></div>
        </Link>
        <Link to="/pacing-guide" className="card group flex flex-col gap-4 p-6 transition-colors hover:border-teal-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15"><CalendarRange size={22} className="text-teal-400" /></div>
            <ArrowRight size={18} className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-teal-400" />
          </div>
          <div><p className="font-semibold text-ink-50">Pacing Guide</p><p className="mt-0.5 text-sm text-ink-500">Full-year scope &amp; sequence</p></div>
        </Link>
        <Link to="/import" className="card group flex flex-col gap-4 p-6 transition-colors hover:border-rose-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15"><FileInput size={22} className="text-rose-400" /></div>
            <ArrowRight size={18} className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-rose-400" />
          </div>
          <div><p className="font-semibold text-ink-50">Import &amp; Enhance</p><p className="mt-0.5 text-sm text-ink-500">Paste an existing lesson and upgrade it</p></div>
        </Link>
        <Link to="/eoy-narrative" className="card group flex flex-col gap-4 p-6 transition-colors hover:border-sky-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15"><ScrollText size={22} className="text-sky-400" /></div>
            <ArrowRight size={18} className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-sky-400" />
          </div>
          <div><p className="font-semibold text-ink-50">EOY Narrative</p><p className="mt-0.5 text-sm text-ink-500">Professional end-of-year summary</p></div>
        </Link>
        <Link to="/activity-bank" className="card group flex flex-col gap-4 p-6 transition-colors hover:border-yellow-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/15"><PartyPopper size={22} className="text-yellow-400" /></div>
            <ArrowRight size={18} className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-yellow-400" />
          </div>
          <div><p className="font-semibold text-ink-50">Activity Bank</p><p className="mt-0.5 text-sm text-ink-500">Low-prep activities for any occasion</p></div>
        </Link>
        <Link to="/warm-up-generator" className="card group flex flex-col gap-4 p-6 transition-colors hover:border-orange-500/40">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15"><Flame size={22} className="text-orange-400" /></div>
            <ArrowRight size={18} className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
          </div>
          <div><p className="font-semibold text-ink-50">Warm-up / Bell-ringer</p><p className="mt-0.5 text-sm text-ink-500">Quick warm-ups students start on their own</p></div>
        </Link>
      </div>

    </div>
  )
}
