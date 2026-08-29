import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Loader2, Search, ArrowLeft, Star } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import LessonCard from '../components/lesson/LessonCard'

export default function StemLessonLibrary() {
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  useEffect(() => {
    listLessons()
      .then((all) => setLessons(all.filter((l) =>
        (l.lesson_object?.subject ?? l.subject) === 'STEM'
      )))
      .catch((err) => setError(err.message))
  }, [])

  const searchTerm = search.trim().toLowerCase()

  function matchesSearch(l) {
    if (!searchTerm) return true
    const title = (l.lesson_object?.title ?? l.title ?? '').toLowerCase()
    const unit = (l.lesson_object?.unit ?? '').toLowerCase()
    return title.includes(searchTerm) || unit.includes(searchTerm)
  }

  const filtered = (lessons ?? []).filter((l) => matchesSearch(l) && (!favoritesOnly || l.is_favorite))

  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'az') {
      const titleA = (a.lesson_object?.title ?? a.title ?? '').toLowerCase()
      const titleB = (b.lesson_object?.title ?? b.title ?? '').toLowerCase()
      return titleA.localeCompare(titleB)
    }
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/stem"
            className="mb-2 flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
          >
            <ArrowLeft size={14} />
            STEM home
          </Link>
          <p className="label-eyebrow mb-2">STEM</p>
          <h1 className="text-2xl font-semibold">Lesson Archive</h1>
        </div>
        <Link to="/stem/generate" className="btn-primary">
          <Sparkles size={16} />
          New lesson
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          placeholder="Search lessons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-full pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            favoritesOnly ? 'bg-amber-500/20 text-amber-400' : 'bg-ink-800 text-ink-400 hover:text-ink-200'
          }`}
        >
          <Star size={14} className={favoritesOnly ? 'fill-amber-400' : ''} />
          Favorites
        </button>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="input-field w-auto py-1.5 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A–Z by title</option>
        </select>
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

      {lessons !== null && filtered.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-ink-500">
            {lessons.length === 0 ? 'No STEM lessons saved yet.' : 'No lessons match your search.'}
          </p>
          {lessons.length === 0 && (
            <Link to="/stem/generate" className="btn-primary mt-4 inline-flex">
              <Sparkles size={16} />
              Generate your first STEM lesson
            </Link>
          )}
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} moduleContext="STEM" />
          ))}
        </div>
      )}
    </div>
  )
}
