
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sparkles, Loader2, Search, Star, FileDown, Lock } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import { MODULES, subjectMatchesFilter } from '../constants/modules'
import { SPECIALTY_CONTEXTS } from '../constants/moduleHomes'
import { useTrial } from '../context/TrialContext'
import { requestDocx, lessonsToDocxBlocks } from '../lib/docxExport'
import LessonCard from '../components/lesson/LessonCard'

function pluralize(noun) {
  if (noun.endsWith('y')) return `${noun.slice(0, -1)}ies`
  if (noun.endsWith('s')) return noun
  return `${noun}s`
}

function capitalize(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value
}

export default function LessonLibrary() {
  const [searchParams] = useSearchParams()
  // A module Home's "Browse" card deep-links with ?module=<label>; preselect
  // that filter when it matches a known module, else default to All.
  const requestedModule = searchParams.get('module')
  const initialFilter = MODULES.some((m) => m.label === requestedModule) ? requestedModule : 'All'
  const isModuleLibrary = initialFilter !== 'All'

  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState(null)
  const [moduleFilter, setModuleFilter] = useState(initialFilter)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' | 'oldest' | 'az'
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const { isPaid, openPaywall } = useTrial()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  const activeModuleFilter = isModuleLibrary ? initialFilter : moduleFilter
  const selectedModuleHome = Object.values(SPECIALTY_CONTEXTS).find((config) => config.moduleLabel === activeModuleFilter)
  const newLessonTo = activeModuleFilter === 'PE & Health'
    ? '/generate'
    : selectedModuleHome?.generatePath ?? '/'
  const libraryNoun = selectedModuleHome?.browseNoun ?? 'lesson'
  const libraryNounPlural = pluralize(libraryNoun)
  const scopedLessons = (lessons ?? []).filter((lesson) =>
    activeModuleFilter === 'All' || subjectMatchesFilter(getSubject(lesson), activeModuleFilter)
  )
  const exportLessons = isModuleLibrary ? scopedLessons : (lessons ?? [])

  // Bulk "Export all my lessons as .docx" — PAID ONLY (server also enforces it).
  // Builds ONE Word document with every lesson as its own page/section.
  async function handleExportAll() {
    if (!isPaid) { openPaywall('docx-export'); return }
    if (!exportLessons.length) return
    setExporting(true)
    setExportError(null)
    try {
      const fileSubject = isModuleLibrary ? activeModuleFilter.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'plansk12'
      const documentTitle = isModuleLibrary ? `My ${activeModuleFilter} ${capitalize(libraryNounPlural)}` : 'My PlansK12 Lessons'
      await requestDocx({ filename: `my-${fileSubject}-lessons`, title: documentTitle, blocks: lessonsToDocxBlocks(exportLessons) })
    } catch (err) {
      if (err?.status === 403) openPaywall('docx-export')
      else setExportError(err.message ?? 'Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    listLessons()
      .then(setLessons)
      .catch((err) => setError(err.message))
  }, [])

  const searchTerm = search.trim().toLowerCase()

  // Prefer lesson_object.subject so unit lessons (which store subject inside
  // lesson_object rather than the top-level column) match the filter correctly.
  function getSubject(l) {
    return l.lesson_object?.subject ?? l.subject ?? ''
  }

  // Search matches title or unit name so "Pickleball" finds the whole unit.
  function matchesSearch(l) {
    if (!searchTerm) return true
    const title = (l.lesson_object?.title ?? l.title ?? '').toLowerCase()
    const unit = (l.lesson_object?.unit ?? '').toLowerCase()
    return title.includes(searchTerm) || unit.includes(searchTerm)
  }

  const filtered = scopedLessons.filter(
    (l) =>
      matchesSearch(l) &&
      (!favoritesOnly || l.is_favorite)
  )

  // Group into units and standalone
  const unitMap = new Map()
  const standalone = []

  for (const lesson of filtered) {
    if (lesson.unit_id) {
      if (!unitMap.has(lesson.unit_id)) unitMap.set(lesson.unit_id, [])
      unitMap.get(lesson.unit_id).push(lesson)
    } else {
      standalone.push(lesson)
    }
  }

  // Days within each unit always sort 1, 2, 3 regardless of the global sort order.
  for (const [, days] of unitMap) {
    days.sort((a, b) =>
      (a.lesson_object?.unit_day_number ?? 0) - (b.lesson_object?.unit_day_number ?? 0)
    )
  }

  // Sort unit groups
  const sortedUnitEntries = [...unitMap.entries()].sort(([, a], [, b]) => {
    if (sortOrder === 'az') {
      const nameA = (a[0]?.lesson_object?.unit ?? '').toLowerCase()
      const nameB = (b[0]?.lesson_object?.unit ?? '').toLowerCase()
      return nameA.localeCompare(nameB)
    }
    const timeA = Math.max(...a.map((l) => new Date(l.created_at).getTime()))
    const timeB = Math.max(...b.map((l) => new Date(l.created_at).getTime()))
    return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA
  })

  // Sort standalone lessons
  const sortedStandalone = [...standalone].sort((a, b) => {
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
          <p className="label-eyebrow mb-2">{isModuleLibrary ? `${activeModuleFilter} library` : 'Library'}</p>
          <h1 className="text-2xl font-semibold">{isModuleLibrary ? `My ${activeModuleFilter} ${capitalize(libraryNounPlural)}` : 'Lesson Library'}</h1>
          {isModuleLibrary && <p className="mt-1 text-sm text-ink-500">Only {libraryNounPlural} created for this specialty appear here.</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            disabled={exporting || exportLessons.length === 0}
            className="btn-secondary disabled:opacity-50"
            title={isPaid ? 'Download all your lessons as one editable Word document' : 'Upgrade to download your lessons as an editable Word document'}
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : (isPaid ? <FileDown size={16} /> : <Lock size={16} />)}
            {isModuleLibrary ? 'Export module (.docx)' : 'Export all (.docx)'}
          </button>
          <Link to={newLessonTo} className="btn-primary">
            <Sparkles size={16} />
            {activeModuleFilter === 'All' ? 'Choose specialty' : `New ${libraryNoun}`}
          </Link>
        </div>
      </div>

      {exportError && (
        <p role="status" aria-live="polite" className="text-sm text-red-400">{exportError}</p>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          placeholder={`Search ${isModuleLibrary ? libraryNounPlural : 'lessons'}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-full pl-9"
        />
      </div>

      {/* Subject filters + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isModuleLibrary && <div className="flex w-full items-center gap-2 sm:hidden">
          <label className="sr-only" htmlFor="lesson-module-filter">Filter by specialty</label>
          <select
            id="lesson-module-filter"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="input-field min-w-0 flex-1 py-2 text-sm"
          >
            <option value="All">All specialties</option>
            {MODULES.map((module) => <option key={module.label} value={module.label}>{module.label}</option>)}
          </select>
          <button
            onClick={() => setFavoritesOnly(f => !f)}
            aria-pressed={favoritesOnly}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${favoritesOnly ? 'border border-amber-500/30 bg-amber-500/20 text-amber-400' : 'bg-ink-900 text-ink-200'}`}
          >
            <Star size={14} className={favoritesOnly ? 'fill-amber-400' : ''} /> Favorites
          </button>
        </div>}
        {!isModuleLibrary && <div className="hidden flex-wrap gap-2 sm:flex">
          {['All', ...MODULES.map((m) => m.label)].map((s) => (
            <button
              key={s}
              onClick={() => setModuleFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                moduleFilter === s
                  ? 'bg-accent-500 text-white'
                  : 'bg-ink-900 text-ink-200 hover:bg-ink-800'
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setFavoritesOnly(f => !f)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              favoritesOnly
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-ink-900 text-ink-200 hover:bg-ink-800'
            }`}
          >
            <Star size={13} className={favoritesOnly ? 'fill-amber-400' : ''} />
            Favorites
          </button>
        </div>}
        {isModuleLibrary && <div className="flex flex-wrap items-center gap-3"><button onClick={() => setFavoritesOnly(f => !f)} aria-pressed={favoritesOnly} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${favoritesOnly ? 'border border-amber-500/30 bg-amber-500/20 text-amber-400' : 'bg-ink-900 text-ink-200 hover:bg-ink-800'}`}><Star size={13} className={favoritesOnly ? 'fill-amber-400' : ''} /> Favorites</button><Link to="/lessons" className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-200">Browse all specialties</Link></div>}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="input-field ml-auto w-auto py-1.5 text-sm"
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

      {lessons && filtered.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-ink-500">
            {scopedLessons.length === 0
              ? isModuleLibrary ? `No ${activeModuleFilter} ${libraryNounPlural} saved yet.` : 'No lessons saved for this specialty yet.'
              : `No ${libraryNounPlural} match your search or favorites filter.`}
          </p>
          {scopedLessons.length === 0 && (
            <Link to={newLessonTo} className="btn-primary mt-4 inline-flex">
              <Sparkles size={16} />
              {activeModuleFilter === 'All' ? 'Choose a specialty' : `Generate your first ${libraryNoun}`}
            </Link>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-8">
          {/* Unit groups */}
          {sortedUnitEntries.map(([unitId, days]) => {
            const unitName = days[0]?.lesson_object?.unit ?? 'Unit'
            const subject = getSubject(days[0])
            return (
              <div key={unitId} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-ink-200">{unitName}</h2>
                  <span className="label-eyebrow text-ink-500">{days.length}-day unit · {subject}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {days.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} moduleContext={activeModuleFilter === 'All' ? null : activeModuleFilter} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Standalone lessons */}
          {sortedStandalone.length > 0 && (
            <div className="space-y-3">
              {unitMap.size > 0 && (
                <h2 className="text-sm font-semibold text-ink-200">Individual Lessons</h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedStandalone.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} moduleContext={activeModuleFilter === 'All' ? null : activeModuleFilter} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
