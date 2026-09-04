import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Check, Clipboard, FileText, Library, Loader2, Mail,
  Printer, Save, Sparkles, Star, Telescope, Ticket, Users2,
} from 'lucide-react'
import { LIBRARY_PROJECT_CONFIGS } from '../lib/libraryProjectGenerators'
import BookTastingPrintKit from '../components/library/BookTastingPrintKit'
import { listLibraryCatalogBooks } from '../services/libraryCatalogService'
import { createLibraryProject, listLibraryProjects, updateLibraryProject } from '../services/libraryProjectService'

const ICONS = { book_tasting: Ticket, teacher_collaboration: Users2, family_literacy_night: Star, research_quest: Telescope }
const COLORS = {
  amber: { text: 'text-amber-400', well: 'bg-amber-500/15', button: 'bg-amber-500 hover:bg-amber-400', border: 'border-amber-500/20', hero: 'from-amber-500/15 via-orange-500/10 to-rose-500/10', pale: 'bg-amber-500/5' },
  cobalt: { text: 'text-cobalt-400', well: 'bg-cobalt-500/15', button: 'bg-cobalt-500 hover:bg-cobalt-400', border: 'border-cobalt-500/20', hero: 'from-cobalt-500/15 via-sky-500/10 to-violet-500/10', pale: 'bg-cobalt-500/5' },
  rose: { text: 'text-rose-400', well: 'bg-rose-500/15', button: 'bg-rose-500 hover:bg-rose-400', border: 'border-rose-500/20', hero: 'from-rose-500/15 via-fuchsia-500/10 to-amber-500/10', pale: 'bg-rose-500/5' },
  emerald: { text: 'text-emerald-400', well: 'bg-emerald-500/15', button: 'bg-emerald-500 hover:bg-emerald-400', border: 'border-emerald-500/20', hero: 'from-emerald-500/15 via-teal-500/10 to-sky-500/10', pale: 'bg-emerald-500/5' },
}

export default function LibraryProjectStudio({ type }) {
  const config = LIBRARY_PROJECT_CONFIGS[type]
  const palette = COLORS[config.color]
  const Icon = ICONS[type] ?? FileText
  const [inputs, setInputs] = useState(config.defaults)
  const [output, setOutput] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [projects, setProjects] = useState([])
  const [savedId, setSavedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([listLibraryProjects(type), config.usesCatalog ? listLibraryCatalogBooks() : Promise.resolve([])])
      .then(([projectRows, bookRows]) => {
        setProjects(projectRows)
        setCatalog(bookRows)
        const seededInputs = config.usesCatalog ? { ...config.defaults, bookIds: bookRows.filter((book) => book.available !== false).slice(0, type === 'book_tasting' ? 4 : 6).map((book) => book.id) } : config.defaults
        setInputs(seededInputs)
        setOutput(config.generate(seededInputs, bookRows))
      })
      .catch((err) => setMessage(err.message))
  }, [config, type])

  const selectedBooks = useMemo(() => catalog.filter((book) => (inputs.bookIds ?? []).includes(book.id)), [catalog, inputs.bookIds])
  const featuredBooks = useMemo(() => {
    const available = catalog.filter((book) => book.available !== false)
    return (selectedBooks.length ? selectedBooks : available).slice(0, Number(inputs.stations) || 4)
  }, [catalog, inputs.stations, selectedBooks])

  function generate() {
    setOutput(config.generate(inputs, catalog))
    setMessage('Ready to edit, print, or save')
  }

  function toggleBook(id) {
    const current = inputs.bookIds ?? []
    setInputs({ ...inputs, bookIds: current.includes(id) ? current.filter((item) => item !== id) : [...current, id] })
  }

  function updateItem(sectionIndex, itemIndex, value) {
    setOutput((current) => ({ ...current, sections: current.sections.map((section, sIndex) => sIndex === sectionIndex ? { ...section, items: section.items.map((item, iIndex) => iIndex === itemIndex ? value : item) } : section) }))
  }

  function loadProject(id) {
    setSavedId(id)
    const project = projects.find((item) => item.id === id)
    if (!project) return
    setInputs(project.inputs)
    setOutput(project.output)
    setMessage('Saved project opened')
  }

  async function saveProject() {
    if (!output) return
    setSaving(true)
    setMessage('')
    try {
      const values = { projectType: type, title: output.title || inputs.title, inputs, output }
      const saved = savedId ? await updateLibraryProject(savedId, values) : await createLibraryProject(values)
      setSavedId(saved.id)
      setProjects((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      setMessage('Saved in PlansK12')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function copyEmail() {
    if (!output?.email) return
    await navigator.clipboard.writeText(output.email)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="space-y-7">
      <style>{`@media print { body * { visibility: hidden !important; } ${type === 'book_tasting' ? '.book-tasting-print' : '.library-project-print'}, ${type === 'book_tasting' ? '.book-tasting-print' : '.library-project-print'} * { visibility: visible !important; } ${type === 'book_tasting' ? '.book-tasting-print' : '.library-project-print'} { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; } }`}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> Library &amp; Media</Link>
        <div className="flex flex-wrap gap-2"><button onClick={saveProject} disabled={saving || !output} className="btn-secondary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{message === 'Saved in PlansK12' ? message : 'Save project'}</button>{output?.email && <button onClick={copyEmail} className="btn-secondary">{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? 'Copied!' : 'Copy email'}</button>}{type !== 'book_tasting' && <button onClick={() => window.print()} disabled={!output} className="btn-primary"><Printer size={15} /> Print or save PDF</button>}</div>
      </div>

      <section className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 sm:p-8 print:hidden ${palette.border} ${palette.hero}`}>
        <div className="relative flex items-start gap-4"><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${palette.well}`}><Icon size={28} className={palette.text} /></div><div><p className={`text-xs font-bold uppercase tracking-[0.16em] ${palette.text}`}>{config.eyebrow}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-50">{config.title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">{config.description}</p></div></div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[370px_minmax(0,1fr)]">
        <aside className="space-y-4 print:hidden">
          <section className="card p-5"><p className="label-eyebrow">Saved projects</p><select value={savedId} onChange={(event) => loadProject(event.target.value)} className="input-field mt-3"><option value="">New project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></section>
          <section className="card space-y-4 p-5">
            <div><p className="label-eyebrow">Build your project</p><p className="mt-1 text-xs text-ink-500">A strong starting point appears automatically. Change anything and rebuild.</p></div>
            {config.fields.map((field) => <label key={field.key} className="block text-xs font-medium text-ink-500">{field.label}{field.type === 'select' ? <select value={inputs[field.key]} onChange={(event) => setInputs({ ...inputs, [field.key]: event.target.value })} className="input-field mt-1"><option value="">Choose</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea rows="3" value={inputs[field.key]} onChange={(event) => setInputs({ ...inputs, [field.key]: event.target.value })} className="input-field mt-1 resize-y" /> : <input type={field.type} value={inputs[field.key]} onChange={(event) => setInputs({ ...inputs, [field.key]: event.target.value })} className="input-field mt-1" />}</label>)}
            <button onClick={generate} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition ${palette.button}`}><Sparkles size={16} /> Build my {config.title.toLowerCase()}</button>
            {message && message !== 'Saved in PlansK12' && <p className="text-center text-xs text-ink-500">{message}</p>}
          </section>

          {config.usesCatalog && <section className="card p-5"><div className="flex items-center justify-between gap-3"><div><p className="label-eyebrow">Books from your catalog</p><p className="mt-1 text-xs text-ink-500">Choose books to feature, or leave blank for automatic choices.</p></div><BookOpen size={20} className={palette.text} /></div><div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">{catalog.map((book) => <label key={book.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${selectedBooks.some((item) => item.id === book.id) ? `${palette.border} ${palette.pale}` : 'border-ink-800'}`}><input type="checkbox" checked={(inputs.bookIds ?? []).includes(book.id)} onChange={() => toggleBook(book.id)} className="mt-1" /><span className="min-w-0"><span className="block text-sm font-semibold text-ink-100">{book.title}</span><span className="mt-0.5 block text-[11px] text-ink-500">{book.author} · {book.format}</span></span></label>)}</div><Link to="/library/book-matchmaker" className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${palette.text}`}><Library size={13} /> Manage catalog</Link></section>}
        </aside>

        <main>
          <div className="mb-3 flex items-end justify-between gap-3 print:hidden"><div><p className="label-eyebrow">Editable output</p><p className="mt-1 text-xs text-ink-500">Click into any item to personalize it before saving or printing.</p></div>{output && <span className={`rounded-full px-3 py-1 text-xs font-bold ${palette.well} ${palette.text}`}>{output.sections.length} ready-to-use sections</span>}</div>
          {output ? <article className="library-project-print space-y-5 rounded-3xl border border-ink-800 bg-white p-5 shadow-sm dark:bg-ink-950 sm:p-7 print:border-0 print:shadow-none">
            <header className={`rounded-3xl border p-6 ${palette.border} ${palette.pale}`}><div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${palette.well}`}><Icon size={22} className={palette.text} /></div><div><p className={`text-xs font-bold uppercase tracking-[0.15em] ${palette.text}`}>{config.title}</p><h2 className="mt-1 text-2xl font-black text-ink-50">{output.title}</h2><p className="mt-1 text-sm text-ink-500">{output.subtitle}</p></div></div></header>
            <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">{output.sections.map((section, sectionIndex) => <section key={`${section.title}-${sectionIndex}`} className="rounded-2xl border border-ink-800 p-5 print:break-inside-avoid"><h3 className={`font-bold ${palette.text}`}>{section.title}</h3><div className="mt-3 space-y-2">{section.items.map((item, itemIndex) => <div key={`${sectionIndex}-${itemIndex}`} className="flex items-start gap-2"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${palette.well}`} /><textarea value={item} onChange={(event) => updateItem(sectionIndex, itemIndex, event.target.value)} rows="2" className="min-h-0 flex-1 resize-y border-0 bg-transparent p-0 text-sm leading-6 text-ink-300 outline-none print:hidden" /><p className="hidden flex-1 text-sm leading-6 text-ink-300 print:block">{item}</p></div>)}</div></section>)}</div>
            {output.email && <section className="rounded-2xl border border-ink-800 p-5 print:break-inside-avoid"><div className="flex items-center gap-2"><Mail size={17} className={palette.text} /><h3 className={`font-bold ${palette.text}`}>Ready-to-send message</h3></div><textarea value={output.email} onChange={(event) => setOutput({ ...output, email: event.target.value })} rows="10" className="input-field mt-3 resize-y whitespace-pre-wrap font-sans text-sm leading-6 print:hidden" /><p className="mt-3 hidden whitespace-pre-wrap text-sm leading-6 text-ink-300 print:block">{output.email}</p></section>}
          </article> : <div className="card p-10 text-center"><FileText size={34} className={`mx-auto ${palette.text}`} /><p className="mt-3 font-semibold text-ink-100">Your project will appear here</p></div>}
        </main>
      </div>
      {type === 'book_tasting' && output && <BookTastingPrintKit inputs={inputs} books={featuredBooks} />}
    </div>
  )
}
