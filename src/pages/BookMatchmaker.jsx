import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, BookHeart, BookOpen, Check, Download, FileUp, Library, Loader2,
  Search, ShieldCheck, Sparkles, Star, Ticket, Upload, X,
} from 'lucide-react'
import { importLibraryCatalogBooks, listLibraryCatalogBooks, updateLibraryCatalogBook } from '../services/libraryCatalogService'
import { matchLibraryBooks, parseLibraryCatalogCsv } from '../lib/libraryCatalog'

const SAMPLE_CSV = `title,author,genres,gradeMin,gradeMax,format,themes,series,available
The Wild Robot,Peter Brown,Science fiction;Adventure,3,6,Novel,robots;nature;friendship,Wild Robot,yes
Dog Man,Dav Pilkey,Humor;Adventure,2,5,Graphic novel,funny;heroes;dogs,Dog Man,yes`

export default function BookMatchmaker() {
  const [books, setBooks] = useState(null)
  const [view, setView] = useState('match')
  const [filters, setFilters] = useState({ grade: '4', interests: 'animals adventure', genre: '', mood: 'adventurous', format: '' })
  const [catalogSearch, setCatalogSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState(SAMPLE_CSV)
  const [importing, setImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    listLibraryCatalogBooks().then(setBooks).catch((err) => setError(err.message))
  }, [])

  const genres = useMemo(() => [...new Set((books ?? []).flatMap((book) => book.genres ?? []))].sort(), [books])
  const formats = useMemo(() => [...new Set((books ?? []).map((book) => book.format).filter(Boolean))].sort(), [books])
  const matches = useMemo(() => matchLibraryBooks(books ?? [], filters).slice(0, 8), [books, filters])
  const visibleCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase()
    if (!query) return books ?? []
    return (books ?? []).filter((book) => [book.title, book.author, ...(book.genres ?? [])].join(' ').toLowerCase().includes(query))
  }, [books, catalogSearch])

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImportText(await file.text())
    setShowImport(true)
  }

  async function handleImport() {
    setError('')
    const parsed = parseLibraryCatalogCsv(importText)
    if (!parsed.rows.length) { setError(parsed.errors[0] || 'No books were found in that catalog text.'); return }
    setImporting(true)
    try {
      await importLibraryCatalogBooks(parsed.rows)
      setBooks(await listLibraryCatalogBooks())
      setShowImport(false)
      setView('catalog')
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  async function toggleAvailable(book) {
    const updated = await updateLibraryCatalogBook(book.id, { available: !book.available })
    setBooks((current) => current.map((item) => item.id === updated.id ? updated : item))
  }

  function toggleSelected(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <div className="space-y-7">
      <style>{`@media print { body * { visibility: hidden !important; } .book-match-print, .book-match-print * { visibility: visible !important; } .book-match-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; } .book-match-print .no-print { display: none !important; } }`}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> Library &amp; Media</Link>
        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary cursor-pointer"><FileUp size={15} /> Upload catalog CSV<input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" /></label>
          <button onClick={() => setShowImport(true)} className="btn-secondary"><Upload size={15} /> Paste book list</button>
          <button onClick={() => window.print()} className="btn-primary"><Ticket size={15} /> Print recommendation tickets</button>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-cobalt-500/10 p-5 sm:p-8 print:hidden">
        <div aria-hidden="true" className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="relative flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/15"><BookHeart size={28} className="text-fuchsia-400" /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-400">Collection-aware Book Matchmaker</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-50">Help every reader find their next book.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">Students choose interests—not names. PlansK12 recommends only books from the catalog you provide, so every suggestion is grounded in your actual collection.</p></div></div>
      </section>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 print:hidden">{error}</div>}

      <div className="flex gap-2 print:hidden"><button onClick={() => setView('match')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${view === 'match' ? 'bg-fuchsia-500 text-white' : 'border border-ink-800 bg-white text-ink-400 dark:bg-ink-950'}`}><Sparkles size={15} className="mr-2 inline" />Find a book</button><button onClick={() => setView('catalog')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${view === 'catalog' ? 'bg-fuchsia-500 text-white' : 'border border-ink-800 bg-white text-ink-400 dark:bg-ink-950'}`}><Library size={15} className="mr-2 inline" />My catalog ({books?.length ?? 0})</button></div>

      {books === null && !error ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-fuchsia-400" /></div> : view === 'match' ? <>
        <section className="card p-5 print:hidden sm:p-6">
          <div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-400" /><div><p className="font-semibold text-ink-100">Privacy-safe student kiosk</p><p className="mt-1 text-xs text-ink-500">No student name, account, reading score, or personal profile is required. A teacher can also complete these choices with a student.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-medium text-ink-500">Grade<select value={filters.grade} onChange={(event) => setFilters({ ...filters, grade: event.target.value })} className="input-field mt-1"><option value="">Any</option>{['K',1,2,3,4,5,6,7,8,9,10,11,12].map((grade) => <option key={grade} value={grade === 'K' ? 0 : grade}>{grade}</option>)}</select></label>
            <label className="text-xs font-medium text-ink-500 sm:col-span-2">What sounds interesting?<input value={filters.interests} onChange={(event) => setFilters({ ...filters, interests: event.target.value })} className="input-field mt-1" placeholder="animals, sports, magic, space…" /></label>
            <label className="text-xs font-medium text-ink-500">Reading mood<select value={filters.mood} onChange={(event) => setFilters({ ...filters, mood: event.target.value })} className="input-field mt-1"><option value="">Surprise me</option><option value="funny">Funny</option><option value="adventurous">Adventurous</option><option value="mysterious">Mysterious</option><option value="inspiring">Inspiring</option><option value="comforting">Comforting</option><option value="factual">Teach me something</option></select></label>
            <label className="text-xs font-medium text-ink-500">Genre<select value={filters.genre} onChange={(event) => setFilters({ ...filters, genre: event.target.value })} className="input-field mt-1"><option value="">Any genre</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-medium text-ink-500">Format<select value={filters.format} onChange={(event) => setFilters({ ...filters, format: event.target.value })} className="input-field mt-1"><option value="">Any format</option>{formats.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
        </section>

        <section className="book-match-print">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 no-print"><div><p className="label-eyebrow">Best matches from your shelves</p><h2 className="mt-1 text-xl font-semibold text-ink-100">Choose tickets to print</h2></div><p className="text-xs text-ink-500">{selectedIds.length ? `${selectedIds.length} selected` : 'No selection prints the top four'}</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-2">
            {matches.map((book, index) => <article key={book.id} className={`relative overflow-hidden rounded-3xl border bg-white p-5 text-slate-800 shadow-sm print:break-inside-avoid ${(selectedIds.length ? !selectedIds.includes(book.id) : index >= 4) ? 'print:hidden' : ''} ${selectedIds.includes(book.id) ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20' : 'border-slate-200'}`}>
              <button onClick={() => toggleSelected(book.id)} className="no-print absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white" aria-label={`${selectedIds.includes(book.id) ? 'Remove' : 'Select'} ${book.title}`}>{selectedIds.includes(book.id) ? <Check size={15} className="text-fuchsia-600" /> : <Star size={15} className="text-slate-400" />}</button>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-100 to-violet-100"><BookOpen size={22} className="text-fuchsia-700" /></div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-600">Match #{index + 1}</p><h3 className="mt-1 pr-6 text-lg font-black leading-tight">{book.title}</h3><p className="mt-1 text-xs text-slate-500">by {book.author}</p>
              <div className="mt-3 flex flex-wrap gap-1">{(book.genres ?? []).slice(0, 2).map((item) => <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{item}</span>)}</div>
              <div className="mt-4 rounded-2xl bg-fuchsia-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-fuchsia-700">Why it fits</p><p className="mt-1 text-xs leading-5 text-slate-600">{book.matchReasons.join(' · ')}</p></div>
              <p className="mt-4 border-t border-dashed border-slate-200 pt-3 text-center text-xs font-bold text-slate-700">Find it in your library!</p>
            </article>)}
          </div>
          {!matches.length && <div className="card p-8 text-center"><Search size={30} className="mx-auto text-fuchsia-400" /><p className="mt-3 font-semibold text-ink-100">No close matches yet</p><p className="mt-1 text-sm text-ink-500">Try a broader interest or import more of your catalog.</p></div>}
        </section>
      </> : <section className="space-y-4 print:hidden">
        <div className="card p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="label-eyebrow">Your collection</p><h2 className="mt-1 text-xl font-semibold text-ink-100">Books available to the Matchmaker</h2><p className="mt-1 text-xs text-ink-500">Mark a checked-out or unavailable title off temporarily without removing it.</p></div><div className="relative sm:w-72"><Search size={16} className="absolute left-3 top-3 text-ink-500" /><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} className="input-field pl-9" placeholder="Search title, author, or genre" /></div></div></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleCatalog.map((book) => <article key={book.id} className={`card p-4 ${book.available ? '' : 'opacity-60'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-ink-100">{book.title}</h3><p className="mt-0.5 text-xs text-ink-500">{book.author}</p></div><button onClick={() => toggleAvailable(book)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${book.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-ink-900 text-ink-500'}`}>{book.available ? 'Available' : 'Unavailable'}</button></div><p className="mt-3 text-xs text-ink-500">{(book.genres ?? []).join(' · ') || 'No genres'} · {book.format}</p><p className="mt-2 text-[11px] text-ink-600">Grades {book.grade_min ?? '—'}–{book.grade_max ?? '—'}{book.series ? ` · ${book.series} series` : ''}</p></article>)}</div>
      </section>}

      {showImport && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/75 p-4 pt-12 backdrop-blur-sm"><section className="w-full max-w-3xl rounded-3xl border border-ink-800 bg-white p-5 shadow-2xl dark:bg-ink-950 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="label-eyebrow">Catalog import</p><h2 className="mt-1 text-2xl font-bold text-ink-50">Paste or upload books you actually own</h2><p className="mt-1 text-sm text-ink-500">Accepted columns: title, author, genres, gradeMin, gradeMax, format, themes, series, available. Genres and themes can be separated with semicolons.</p></div><button onClick={() => setShowImport(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 hover:bg-ink-900" aria-label="Close catalog import"><X size={19} /></button></div><textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows="13" className="input-field mt-5 resize-y font-mono text-xs" /><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => setShowImport(false)} className="btn-secondary">Cancel</button><button onClick={handleImport} disabled={importing} className="btn-primary">{importing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Import books</button></div></section></div>}
    </div>
  )
}
