import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Sparkles, BookOpen, ClipboardList, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import LessonCard from '../components/lesson/LessonCard'

export default function CteHome() {
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listLessons()
      .then((all) => setLessons(all.filter((l) =>
        (l.lesson_object?.subject ?? l.subject) === 'CTE'
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20">
            <Briefcase size={20} className="text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-ink-50">CTE</h1>
              <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-xs font-medium text-pink-400">
                Beta
              </span>
            </div>
            <p className="text-sm text-ink-500">
              Career &amp; Technical Education lesson planning — Middle School &amp; High School pathways
            </p>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/cte/generate"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-pink-400/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/20">
              <Sparkles size={22} className="text-pink-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-pink-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Generate a CTE lesson</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Hospitality, Finance, Marketing, or Human Services / FCS — 5-phase lesson with work-based learning built in
            </p>
          </div>
        </Link>

        <Link
          to="/cte/lessons"
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
              Everything you&rsquo;ve created, filterable by pathway
            </p>
          </div>
        </Link>

        <Link
          to="/assessments"
          className="card group flex flex-col gap-4 p-6 transition-colors hover:border-indigo-500/40"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
              <ClipboardList size={22} className="text-indigo-400" />
            </div>
            <ArrowRight
              size={18}
              className="mt-0.5 text-ink-700 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400"
            />
          </div>
          <div>
            <p className="font-semibold text-ink-50">Assessment Bank</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Quizzes, rubrics, and exit tickets
            </p>
          </div>
        </Link>
      </div>

      {/* Recent lessons */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-50">Recent lessons</h2>
            {lessons !== null && (
              <p className="text-sm text-ink-500 mt-0.5">
                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} saved
              </p>
            )}
          </div>
          {(lessons ?? []).length > 3 && (
            <Link
              to="/cte/lessons"
              className="text-sm font-medium text-pink-400 hover:text-pink-300"
            >
              View all
            </Link>
          )}
        </div>

        {lessons === null && !error && (
          <div className="flex items-center gap-2 text-ink-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading lessons…
          </div>
        )}

        {error && (
          <div className="card p-4 text-sm text-red-400 border-red-500/30">
            Couldn&rsquo;t load lessons: {error}
          </div>
        )}

        {lessons !== null && lessons.length === 0 && (
          <p className="text-sm text-ink-600">
            Your CTE lessons will appear here once you generate your first one.
          </p>
        )}

        {recent.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
