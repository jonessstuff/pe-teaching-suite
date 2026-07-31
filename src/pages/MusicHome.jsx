import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Music, Sparkles, BookOpen, BookMarked, CalendarDays, ClipboardList, Layers, ArrowRight, ArrowLeft, Loader2, BarChart3, CalendarRange, FileInput, ScrollText, PartyPopper, Flame, BookCheck } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import LessonCard from '../components/lesson/LessonCard'
import RecentLessonsPanel from '../components/lesson/RecentLessonsPanel'

export default function MusicHome() {
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listLessons()
      .then((all) => setLessons(all.filter((l) =>
        (l.lesson_object?.subject ?? l.subject) === 'Music'
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
            <Music size={20} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-ink-50">Music</h1>
            </div>
            <p className="text-sm text-ink-500">Elementary K–5 lesson planning for music specialists</p>
          </div>
        </div>
      </div>

      {/* My lessons — search / sort / starred */}
      <RecentLessonsPanel lessons={lessons} error={error} browseTo="/music/lessons" accentText="text-purple-400" />

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/music/generate"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-purple-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15">
              <Sparkles size={22} className="text-purple-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-purple-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Generate a music lesson</p>
            <p className="mt-0.5 text-sm text-ink-500">
              5-phase lesson — warm-up, concept, listening, music making, and reflection
            </p>
          </div>
        </Link>

        {lessons !== null && lessons.length > 0 && (
          <Link
            to="/music/lessons"
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
          to="/build-unit?subject=music"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-purple-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15">
              <Layers size={22} className="text-purple-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-purple-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Build a unit</p>
            <p className="mt-0.5 text-sm text-ink-500">
              2–3 connected sessions built around one musical concept
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
          to="/sub-binder?subject=music"
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
          to="/music/lessons"
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
