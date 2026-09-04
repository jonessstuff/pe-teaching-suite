import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Clipboard, Image, Loader2, Palette, Save, Sparkles, Users } from 'lucide-react'
import ArtShowPrintKit from '../components/art/ArtShowPrintKit'
import { generateArtShowPlan, parseArtworkList } from '../lib/artShowStudio'
import { createArtShowProject, listArtShowProjects, updateArtShowProject } from '../services/artShowService'

const DEFAULTS = {
  title: 'Our Creative Community', theme: 'Color in Motion', date: '', time: '5:30–7:00 PM', location: 'School hallways and multipurpose room',
  gradeBands: 'K–1, 2–3, 4–5', estimatedArtworks: '150', spaces: 'Main hallway, Library hall, Multipurpose room',
  featuredActivity: 'a collaborative family art-making station', galleryUrl: '',
}

const SAMPLE_ARTWORKS = `A. Rivera | Grade 4 | Garden After the Rain | Watercolor
M. Chen | Grade 2 | Colorful City | Tempera paint
J. Thompson | Grade 5 | Recycled Creature | Cardboard sculpture
S. Patel | Kindergarten | My Happy Place | Crayon and collage`

export default function ArtShowStudio() {
  const [inputs, setInputs] = useState(DEFAULTS)
  const [artworkText, setArtworkText] = useState(SAMPLE_ARTWORKS)
  const [plan, setPlan] = useState(() => generateArtShowPlan(DEFAULTS, parseArtworkList(SAMPLE_ARTWORKS)))
  const [projects, setProjects] = useState([])
  const [savedId, setSavedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState('')
  const artworks = useMemo(() => parseArtworkList(artworkText), [artworkText])

  useEffect(() => { listArtShowProjects().then(setProjects).catch((err) => setMessage(err.message)) }, [])

  function buildPlan() {
    setPlan(generateArtShowPlan(inputs, artworks))
    setMessage('Art show kit updated')
  }

  function updateItem(sectionIndex, itemIndex, value) {
    setPlan((current) => ({ ...current, sections: current.sections.map((section, sIndex) => sIndex === sectionIndex ? { ...section, items: section.items.map((item, iIndex) => iIndex === itemIndex ? value : item) } : section) }))
  }

  function loadProject(id) {
    setSavedId(id)
    const project = projects.find((item) => item.id === id)
    if (!project) { setInputs(DEFAULTS); setArtworkText(SAMPLE_ARTWORKS); setPlan(generateArtShowPlan(DEFAULTS, parseArtworkList(SAMPLE_ARTWORKS))); return }
    setInputs(project.inputs)
    setArtworkText((project.artworks ?? []).map((item) => `${item.student} | ${item.grade} | ${item.title} | ${item.medium}`).join('\n'))
    setPlan(project.plan)
    setMessage('Saved art show opened')
  }

  async function saveProject() {
    setSaving(true)
    setMessage('')
    try {
      const values = { title: inputs.title, inputs, artworks, plan }
      const saved = savedId ? await updateArtShowProject(savedId, values) : await createArtShowProject(values)
      setSavedId(saved.id)
      setProjects((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      setMessage('Saved in PlansK12')
    } catch (err) { setMessage(err.message) } finally { setSaving(false) }
  }

  async function copyText(key) {
    await navigator.clipboard.writeText(plan[key])
    setCopied(key)
    window.setTimeout(() => setCopied(''), 1500)
  }

  return <div className="space-y-7">
    <style>{`@media print { body * { visibility: hidden !important; } .art-show-print, .art-show-print * { visibility: visible !important; } .art-show-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; } }`}</style>
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link to="/art" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> Art workspace</Link><button onClick={saveProject} disabled={saving} className="btn-secondary">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{message === 'Saved in PlansK12' ? message : 'Save art show'}</button></div>

    <section className="relative overflow-hidden rounded-3xl border border-coral-500/25 bg-gradient-to-br from-coral-500/20 via-rose-500/10 to-amber-500/10 p-5 print:hidden sm:p-8"><div className="relative flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-coral-500/15"><Palette size={28} className="text-coral-400" /></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-coral-400">Schoolwide event planning</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-50">Art Show Studio</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">Plan the show, organize the artwork, prepare helpers, and produce every teacher, student, family, and display resource needed for opening night.</p></div></div></section>

    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)] print:hidden">
      <aside className="space-y-4">
        <section className="card p-5"><p className="label-eyebrow">Saved art shows</p><select value={savedId} onChange={(event) => loadProject(event.target.value)} className="input-field mt-3"><option value="">New art show</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></section>
        <section className="card space-y-4 p-5"><div><p className="label-eyebrow">Show details</p><p className="mt-1 text-xs text-ink-500">Start with the event basics. You can rebuild and edit everything.</p></div>
          <label className="block text-xs font-medium text-ink-500">Show title<input value={inputs.title} onChange={(event) => setInputs({ ...inputs, title: event.target.value })} className="input-field mt-1" /></label>
          <label className="block text-xs font-medium text-ink-500">Theme<select value={inputs.theme} onChange={(event) => setInputs({ ...inputs, theme: event.target.value })} className="input-field mt-1">{['Color in Motion','Art Around the World','Our Creative Community','Nature Reimagined','Museum After Hours','Every Child Is an Artist'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium text-ink-500">Date<input type="date" value={inputs.date} onChange={(event) => setInputs({ ...inputs, date: event.target.value })} className="input-field mt-1" /></label><label className="block text-xs font-medium text-ink-500">Time<input value={inputs.time} onChange={(event) => setInputs({ ...inputs, time: event.target.value })} className="input-field mt-1" /></label></div>
          {[
            ['location','Location'], ['gradeBands','Grades/display groups'], ['estimatedArtworks','Estimated artworks'], ['spaces','Available display spaces'], ['featuredActivity','Featured activity'], ['galleryUrl','Optional digital gallery link'],
          ].map(([key, label]) => <label key={key} className="block text-xs font-medium text-ink-500">{label}{key === 'spaces' || key === 'featuredActivity' ? <textarea rows="2" value={inputs[key]} onChange={(event) => setInputs({ ...inputs, [key]: event.target.value })} className="input-field mt-1 resize-y" /> : <input type={key === 'estimatedArtworks' ? 'number' : 'text'} value={inputs[key]} onChange={(event) => setInputs({ ...inputs, [key]: event.target.value })} className="input-field mt-1" />}</label>)}
          <button onClick={buildPlan} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 text-sm font-bold text-white transition hover:bg-coral-400"><Sparkles size={16} /> Build my art show</button>{message && message !== 'Saved in PlansK12' && <p className="text-center text-xs text-ink-500">{message}</p>}
        </section>
        <section className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="label-eyebrow">Artwork list</p><p className="mt-1 text-xs leading-relaxed text-ink-500">Paste one artwork per line: Student/ID | Grade/Class | Title | Medium. Use initials or IDs if required.</p></div><Image size={20} className="text-coral-400" /></div><textarea value={artworkText} onChange={(event) => setArtworkText(event.target.value)} rows="8" className="input-field mt-4 resize-y font-mono text-xs" /><div className="mt-3 flex items-center justify-between"><span className="text-xs font-bold text-coral-400">{artworks.length} labels ready</span><span className="text-[10px] text-ink-500">Private to this teacher</span></div></section>
      </aside>

      <main className="space-y-5"><div><p className="label-eyebrow">Editable event plan</p><p className="mt-1 text-xs text-ink-500">Personalize the plan before saving or printing the kit.</p></div><article className="space-y-4 rounded-3xl border border-ink-800 bg-ink-950/40 p-5 sm:p-7"><header className="rounded-2xl border border-coral-500/25 bg-coral-500/10 p-5"><p className="text-xs font-black uppercase tracking-[.15em] text-coral-400">Art Show Studio</p><h2 className="mt-1 text-2xl font-black text-ink-50">{plan.title}</h2><p className="mt-1 text-sm text-ink-500">{plan.subtitle}</p></header><div className="grid gap-4 lg:grid-cols-2">{plan.sections.map((section, sectionIndex) => <section key={section.title} className="rounded-2xl border border-ink-800 p-5"><h3 className="font-bold text-coral-400">{section.title}</h3><div className="mt-3 space-y-2">{section.items.map((item, itemIndex) => <textarea key={`${sectionIndex}-${itemIndex}`} value={item} onChange={(event) => updateItem(sectionIndex, itemIndex, event.target.value)} rows="2" className="min-h-0 w-full resize-y border-0 bg-transparent p-0 text-sm leading-6 text-ink-300 outline-none" />)}</div></section>)}</div></article>
        <section className="grid gap-4 lg:grid-cols-3">{[['invitation','Invitation'],['newsletter','Newsletter'],['social','Social post']].map(([key, title]) => <article key={key} className="card p-5"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-ink-100">{title}</h3><button type="button" onClick={() => copyText(key)} className="inline-flex items-center gap-1 text-xs font-bold text-coral-400">{copied === key ? <Check size={13} /> : <Clipboard size={13} />}{copied === key ? 'Copied' : 'Copy'}</button></div><textarea value={plan[key]} onChange={(event) => setPlan({ ...plan, [key]: event.target.value })} rows="10" className="input-field mt-3 resize-y text-xs leading-5" /></article>)}</section>
        <section className="card p-5"><div className="flex items-start gap-3"><Users size={20} className="mt-0.5 shrink-0 text-coral-400" /><div><p className="font-bold text-ink-100">Student-display privacy check</p><p className="mt-1 text-xs leading-relaxed text-ink-500">PlansK12 does not require full student names. Teachers should follow district policy and may use initials, first name plus last initial, student IDs, or blank labels.</p></div></div></section>
      </main>
    </div>

    <ArtShowPrintKit inputs={inputs} plan={plan} artworks={artworks} />
  </div>
}
