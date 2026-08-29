import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Loader2, Star } from 'lucide-react'
import LessonCard from './LessonCard'

// Shared "My lessons" panel — search + sort + starred filter over a module's
// saved lessons, with each card individually starrable. Presentational: it
// receives the home's already-subject-filtered `lessons` (null = loading) and
// manages its own view state + live favorite toggles. Mounted in BOTH home
// systems (ModuleHome and the bespoke Art/Music/STEM/Library homes) so the
// feature stays consistent — see [[dashboard-tool-cards-two-systems]].

const SORTS = [
  { key: 'recent', label: 'Most recent' },
  { key: 'alpha', label: 'Title (A–Z)' },
  { key: 'topic', label: 'Topic / unit' },
]
const titleOf = (l) => (l.title ?? '').toLowerCase()
const topicOf = (l) => (l.lesson_object?.unit ?? l.lesson_object?.topic ?? '').toLowerCase()
const dateOf = (l) => new Date(l.updated_at ?? l.created_at ?? 0).getTime()

export default function RecentLessonsPanel({ lessons, error, browseNoun = 'lesson', browseTo, accentText = 'text-accent-400', previewLimit = 6, moduleContext = null }) {
  const [favoriteOverrides, setFavoriteOverrides] = useState({})
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [starredOnly, setStarredOnly] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const items = useMemo(() => lessons === null
    ? null
    : (lessons ?? []).map((lesson) => favoriteOverrides[lesson.id] === undefined
      ? lesson
      : { ...lesson, is_favorite: favoriteOverrides[lesson.id] }), [lessons, favoriteOverrides])

  function handleFav(updated) {
    setFavoriteOverrides((current) => ({ ...current, [updated.id]: updated.is_favorite }))
  }

  const total = (items ?? []).length
  const favCount = (items ?? []).filter((l) => l.is_favorite).length

  const results = useMemo(() => {
    let list = items ?? []
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((l) => titleOf(l).includes(q) || topicOf(l).includes(q))
    if (starredOnly) list = list.filter((l) => l.is_favorite)
    const arr = [...list]
    if (sort === 'alpha') arr.sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
    else if (sort === 'topic') arr.sort((a, b) => topicOf(a).localeCompare(topicOf(b)) || titleOf(a).localeCompare(titleOf(b)))
    // "recent" floats starred to the top, then newest-first, so favorites are seen first.
    else arr.sort((a, b) => (Number(b.is_favorite) - Number(a.is_favorite)) || (dateOf(b) - dateOf(a)))
    return arr
  }, [items, search, sort, starredOnly])

  // This panel sits ABOVE the module's tool cards, so it must stay compact — an
  // unbounded grid would bury Generate/Browse/etc. under the whole library. Show
  // a preview by default; lift the cap when the user is actively narrowing
  // (searching or starred-only) or explicitly expands.
  const filtering = search.trim() !== '' || starredOnly
  const visible = filtering || expanded ? results : results.slice(0, previewLimit)
  const hiddenCount = results.length - visible.length

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-50">My {browseNoun}s</h2>
          {items !== null && (
            <p className="text-sm text-ink-500 mt-0.5">{total} saved{favCount ? ` · ${favCount} starred` : ''}</p>
          )}
        </div>
        {browseTo && total > 0 && (
          <Link to={browseTo} className={`text-sm font-medium ${accentText}`}>Open full library →</Link>
        )}
      </div>

      {/* Controls */}
      {items !== null && total > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[12rem]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${browseNoun}s by title or topic…`}
              className="w-full rounded-lg border border-ink-700 bg-white dark:bg-ink-800 pl-8 pr-3 py-2 text-sm text-ink-50 placeholder:text-ink-700 dark:placeholder:text-ink-600 outline-none focus:border-accent-500"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label={`Sort ${browseNoun}s`}
            className="rounded-lg border border-ink-700 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-300 outline-none focus:border-accent-500"
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setStarredOnly((v) => !v)}
            aria-pressed={starredOnly}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${starredOnly ? 'border-amber-400 bg-amber-400/15 text-amber-400' : 'border-ink-700 text-ink-500 hover:text-ink-200'}`}
          >
            <Star size={14} className={starredOnly ? 'fill-amber-400' : ''} /> Starred{favCount ? ` (${favCount})` : ''}
          </button>
        </div>
      )}

      {/* States */}
      {items === null && !error && (
        <div className="flex items-center gap-2 text-ink-400 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>
      )}
      {error && <div className="card p-4 text-sm text-red-400 border-red-500/30">Couldn&rsquo;t load: {error}</div>}
      {items !== null && total === 0 && !error && (
        <p className="text-sm text-ink-600">Your saved {browseNoun}s will appear here once you generate your first one.</p>
      )}
      {total > 0 && results.length === 0 && (
        <p className="text-sm text-ink-600">No {browseNoun}s match {starredOnly ? 'the starred filter' : `“${search.trim()}”`}.</p>
      )}
      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} onFavoriteToggle={handleFav} moduleContext={moduleContext} />)}
        </div>
      )}
      {/* Expand / collapse the preview (only when not actively filtering). */}
      {!filtering && (hiddenCount > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`text-sm font-medium ${accentText} hover:underline`}
        >
          {hiddenCount > 0 ? `Show all ${results.length} ${browseNoun}s` : 'Show fewer'}
        </button>
      )}
    </section>
  )
}
