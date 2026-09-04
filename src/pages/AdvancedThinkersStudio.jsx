import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpenCheck, Brain, Check, ChevronDown, ChevronRight, ClipboardCheck, FileText, Layers3, Lightbulb, Loader2, Printer, RotateCcw, Save, Sparkles, UsersRound } from 'lucide-react'
import { ADVANCED_UNITS, GRADE_PATHWAYS, STUDENT_PRINTABLES, buildAdvancedCurriculum, recommendedUnitIds } from '../lib/advancedThinkers'
import { createAdvancedThinkersCurriculum, listAdvancedThinkersCurricula } from '../services/advancedThinkersService'
import { trackToolOpened, trackToolUsage } from '../services/productUsageService'

const TABS = [
  { id: 'map', label: 'Curriculum map', Icon: Layers3 },
  { id: 'lessons', label: 'Ready-to-teach lessons', Icon: BookOpenCheck },
  { id: 'student-kit', label: 'Student printables', Icon: FileText },
  { id: 'growth', label: 'Assessment & growth', Icon: ClipboardCheck },
]

const initialForm = { title: 'K–5 Thinking Lab', gradeBand: '4–5', weeks: 18, meetings: 1, minutes: 45, units: recommendedUnitIds(18) }

async function downloadSectionPdf(element, filename) {
  if (!element) throw new Error('The printable section is not ready yet.')
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
  const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 1.5, useCORS: true, logging: false })
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const margin = 30
  const pageWidth = 612 - (margin * 2)
  const pageHeight = 792 - (margin * 2)
  const displayScale = pageWidth / canvas.width
  const sourcePageHeight = Math.floor(pageHeight / displayScale)
  let sourceY = 0
  let page = 0

  while (sourceY < canvas.height) {
    const sliceHeight = Math.min(sourcePageHeight, canvas.height - sourceY)
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = sliceHeight
    slice.getContext('2d').drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
    if (page > 0) pdf.addPage()
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, pageWidth, sliceHeight * displayScale)
    sourceY += sliceHeight
    page += 1
  }
  pdf.save(filename)
}

function Builder({ form, setForm, saving, buildAndSave }) {
  function setWeeks(value) { const weeks = Number(value); setForm({ ...form, weeks, units: recommendedUnitIds(weeks) }) }
  function setGradeBand(gradeBand) {
    const minutes = gradeBand === 'K–1' ? 25 : gradeBand === '2–3' ? 35 : 45
    setForm({ ...form, gradeBand, minutes })
  }
  function toggleUnit(id) {
    const max = form.weeks === 9 ? 2 : form.weeks === 18 ? 4 : 8
    if (form.units.includes(id)) return setForm({ ...form, units: form.units.filter((item) => item !== id) })
    if (form.units.length < max) setForm({ ...form, units: [...form.units, id] })
  }
  const max = form.weeks === 9 ? 2 : form.weeks === 18 ? 4 : 8
  return <aside className="card h-fit p-5 print:hidden"><p className="label-eyebrow">Build your program</p><h2 className="mt-1 text-xl font-black text-ink-50">Choose the teaching format</h2><p className="mt-1 text-xs leading-5 text-ink-500">The rigor changes by grade band; the thinking goal stays meaningful.</p><div className="mt-5 space-y-4"><label className="block text-sm text-ink-300">Program title<input className="input-field mt-1" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="block text-sm text-ink-300">Developmental pathway<select className="input-field mt-1" value={form.gradeBand} onChange={(event) => setGradeBand(event.target.value)}>{Object.entries(GRADE_PATHWAYS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select></label><div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3"><p className="text-xs font-black text-amber-700 dark:text-amber-300">{GRADE_PATHWAYS[form.gradeBand].minutes}</p><p className="mt-1 text-xs leading-5 text-ink-500">{GRADE_PATHWAYS[form.gradeBand].approach}</p></div><div className="grid grid-cols-2 gap-3"><label className="text-sm text-ink-300">Length<select className="input-field mt-1" value={form.weeks} onChange={(event) => setWeeks(event.target.value)}>{[9,18,36].map((weeks) => <option key={weeks} value={weeks}>{weeks} weeks</option>)}</select></label><label className="text-sm text-ink-300">Minutes<input className="input-field mt-1" type="number" min="20" max="90" step="5" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: Number(event.target.value) })} /></label></div><fieldset><legend className="text-sm font-bold text-ink-200">Choose {max} complete units <span className="font-normal text-ink-500">({form.units.length}/{max})</span></legend><div className="mt-2 space-y-2">{ADVANCED_UNITS.map((unit) => { const checked = form.units.includes(unit.id); const disabled = !checked && form.units.length >= max; return <label key={unit.id} className={`flex gap-3 rounded-xl border p-3 ${checked ? 'border-amber-400 bg-amber-500/10' : disabled ? 'cursor-not-allowed border-ink-900 opacity-50' : 'cursor-pointer border-ink-800 hover:border-amber-500/30'}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleUnit(unit.id)} className="mt-1 accent-amber-500" /><span><span className="block text-sm font-black text-ink-200">{unit.icon} {unit.title}</span><span className="block text-[11px] leading-4 text-ink-500">{unit.strand} · 4 lessons</span></span></label> })}</div></fieldset></div><button onClick={buildAndSave} disabled={saving || form.units.length !== max} className="btn-primary mt-6 w-full">{saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Build & save full curriculum</button><p className="mt-3 text-[11px] leading-4 text-ink-500">Nothing here asks students to “go research” without support. Inquiry lessons include a teacher-supplied source-packet structure.</p></aside>
}

function CourseHeader({ curriculum }) {
  return <section className="overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-violet-500/10 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-amber-700 dark:text-amber-300">{curriculum.gradeGuide.label} · {curriculum.weeks}-week program</p><h2 className="mt-1 text-2xl font-black text-ink-50">{curriculum.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{curriculum.coursePromise}</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl border border-ink-800 bg-white/70 px-3 py-2 dark:bg-ink-950/70"><b className="block text-lg text-ink-100">{curriculum.sessions.length}</b><span className="text-[10px] text-ink-500">lessons</span></div><div className="rounded-xl border border-ink-800 bg-white/70 px-3 py-2 dark:bg-ink-950/70"><b className="block text-lg text-ink-100">{curriculum.selected.length}</b><span className="text-[10px] text-ink-500">units</span></div><div className="rounded-xl border border-ink-800 bg-white/70 px-3 py-2 dark:bg-ink-950/70"><b className="block text-lg text-ink-100">8</b><span className="text-[10px] text-ink-500">printables</span></div></div></div></section>
}

function CurriculumMap({ curriculum }) {
  return <div className="space-y-5"><CourseHeader curriculum={curriculum} /><section className="card overflow-hidden"><div className="border-b border-ink-800 p-5"><p className="label-eyebrow">Week-by-week sequence</p><h3 className="mt-1 text-lg font-black text-ink-100">A coherent course—not disconnected enrichment</h3></div><div className="divide-y divide-ink-800">{curriculum.sessions.map((session) => <article key={`${session.week}-${session.title}`} className="grid gap-3 p-4 sm:grid-cols-[78px_1fr_190px]"><div><span className="inline-flex rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-black text-amber-700 dark:text-amber-300">Week {session.week}</span></div><div><p className="text-sm font-black text-ink-200">{session.unitIcon} {session.title}</p><p className="mt-1 text-xs leading-5 text-ink-500">{session.unit} · {session.target}</p></div><p className="text-xs font-bold leading-5 text-ink-400">Evidence: {session.artifact}</p></article>)}</div></section><section className="card p-5"><p className="label-eyebrow">Teacher preparation</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{curriculum.teacherPrep.map((item) => <p key={item} className="flex gap-2 text-sm leading-5 text-ink-400"><Check size={15} className="mt-0.5 shrink-0 text-amber-500" />{item}</p>)}</div></section></div>
}

function LessonLibrary({ curriculum, expanded, setExpanded }) {
  return <div className="space-y-5"><CourseHeader curriculum={curriculum} />{curriculum.selected.map((unit) => <section key={unit.id} className="card overflow-hidden"><div className="border-b border-ink-800 p-5"><div className="flex items-start gap-3"><span className="text-3xl">{unit.icon}</span><div><p className="text-xs font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{unit.strand} · 4 complete lessons</p><h3 className="text-xl font-black text-ink-100">{unit.title}</h3><p className="mt-1 text-sm text-ink-500">{unit.essential}</p></div></div><div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><p className="text-xs font-black text-amber-700 dark:text-amber-300">How this changes for {curriculum.gradeGuide.label}</p><p className="mt-1 text-xs leading-5 text-ink-500">{unit.selectedGradeMove}</p></div><p className="mt-3 text-xs text-ink-500"><b className="text-ink-300">Materials:</b> {unit.materials}</p></div><div className="divide-y divide-ink-800">{unit.sessions.map((session, index) => { const key = `${unit.id}-${index}`; const open = expanded === key; return <article key={key}><button onClick={() => setExpanded(open ? '' : key)} className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-ink-950/40"><span><span className="text-xs font-black text-amber-700 dark:text-amber-300">LESSON {index + 1}</span><span className="ml-3 text-sm font-black text-ink-200">{session.title}</span></span>{open ? <ChevronDown size={17} className="text-amber-500" /> : <ChevronRight size={17} className="text-ink-500" />}</button>{open && <div className="grid gap-3 border-t border-ink-800 bg-ink-950/30 p-4 sm:grid-cols-2"><Detail label="Thinking target" text={session.target} /><Detail label="Hook · 3–5 min" text={session.hook} /><Detail label="Mini-lesson · 5–8 min" text={session.mini} /><Detail label="Collaborative challenge · 20–30 min" text={session.task} /><Detail label="Reflection · 3–5 min" text={session.reflection} /><Detail label="Portfolio evidence" text={session.artifact} /></div>}</article> })}</div><div className="border-t border-ink-800 bg-amber-500/5 p-4 text-xs font-bold text-ink-400">Culminating artifact: {unit.artifact}</div></section>)}</div>
}

function Detail({ label, text }) { return <div className="rounded-xl border border-ink-800 bg-white p-3 dark:bg-ink-950"><p className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">{label}</p><p className="mt-1 text-xs leading-5 text-ink-400">{text}</p></div> }

function StudentKit({ curriculum }) {
  const [activePrintable, setActivePrintable] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState('')
  const selected = STUDENT_PRINTABLES[activePrintable]

  async function downloadPrintable() {
    setDownloading(true)
    setDownloadMessage('Creating your one-page printable…')
    try {
      const filename = `${curriculum.title}-${selected.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      await downloadSectionPdf(document.querySelector('.student-print-sheet'), `${filename}.pdf`)
      setDownloadMessage('Printable PDF downloaded. Open it to print or save a copy.')
      void trackToolUsage('advanced-thinkers-studio', 'downloaded-student-printable', {
        moduleLabel: 'Gifted & Talented',
        metadata: { printable: selected.title },
      })
    } catch (error) {
      setDownloadMessage(`PDF could not be created: ${error.message}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-5">
      <CourseHeader curriculum={curriculum} />
      <section className="card p-5 print:hidden">
        <p className="label-eyebrow">Choose one printable</p>
        <h3 className="mt-1 text-lg font-black text-ink-100">Select, preview, then print one sheet</h3>
        <p className="mt-1 text-sm text-ink-500">Each resource downloads as its own PDF—not as a screenshot of the whole kit.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {STUDENT_PRINTABLES.map((item, index) => {
            const active = index === activePrintable
            return (
              <button
                key={item.title}
                type="button"
                aria-pressed={active}
                onClick={() => { setActivePrintable(index); setDownloadMessage('') }}
                className={`rounded-2xl border p-4 text-left transition ${active ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/20' : 'border-ink-800 hover:border-amber-500/40 hover:bg-amber-500/5'}`}
              >
                <span className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-sm font-black text-amber-700 dark:text-amber-300">{index + 1}</span>
                  <span>
                    <span className="block font-black text-ink-200">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink-500">{item.purpose}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300">{active ? 'Selected below' : 'View & print'} <ChevronRight size={13} /></span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-eyebrow">Selected printable</p>
            <h3 className="mt-1 text-lg font-black text-ink-100">{selected.title}</h3>
          </div>
          <button type="button" onClick={downloadPrintable} disabled={downloading} className="btn-primary">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            Download & print this sheet
          </button>
        </div>
        {downloadMessage && <p role="status" className="mb-3 text-xs font-bold text-ink-500">{downloadMessage}</p>}
      </section>

      <article
        className="student-print-sheet mx-auto min-h-[720px] w-full max-w-[760px] overflow-hidden rounded-2xl border border-slate-300 bg-white p-7 text-slate-900 shadow-sm sm:p-10"
        data-printable-title={selected.title}
      >
        <header className="flex items-start justify-between gap-4 border-b-2 border-amber-400 pb-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-amber-700">PlansK12 · Advanced Thinkers Studio</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{selected.title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">{selected.purpose}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg font-black text-amber-800">{activePrintable + 1}</span>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
          <p className="border-b border-slate-400 pb-2">Name:</p>
          <p className="border-b border-slate-400 pb-2">Date:</p>
        </div>

        <div className="mt-6 space-y-5">
          {selected.prompts.map((prompt, index) => (
            <section key={prompt}>
              <p className="text-sm font-black leading-5 text-slate-900"><span className="mr-2 text-amber-700">{index + 1}.</span>{prompt}</p>
              <div className="mt-3 space-y-4" aria-hidden="true">
                <div className="border-b border-slate-300" />
                <div className="border-b border-slate-300" />
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-7 flex items-center justify-between border-t border-slate-300 pt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span>Thinking evidence</span>
          <span>{curriculum.gradeGuide.label}</span>
        </footer>
      </article>
    </div>
  )
}

function Growth({ curriculum }) {
  return <div className="space-y-5"><CourseHeader curriculum={curriculum} /><section className="card overflow-hidden"><div className="border-b border-ink-800 p-5"><p className="label-eyebrow">One developmental rubric</p><h3 className="mt-1 text-lg font-black text-ink-100">Measure thinking behaviors—not “smartness”</h3><p className="mt-1 text-xs leading-5 text-ink-500">Use it with a baseline, selected work, and a parallel post-task. Evidence for this pathway may include: {curriculum.gradeGuide.evidence}</p></div><div className="grid md:grid-cols-4">{curriculum.rubric.map((level) => <article key={level.level} className="border-b border-ink-800 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-lg font-black text-amber-700 dark:text-amber-300">{level.level}</span><h4 className="mt-3 font-black text-ink-200">{level.label}</h4><p className="mt-2 text-xs leading-5 text-ink-500">{level.description}</p></article>)}</div></section><section className="grid gap-4 lg:grid-cols-2"><div className="card p-5"><p className="label-eyebrow">Baseline & post-task</p><h3 className="mt-1 font-black text-ink-100">Use parallel unfamiliar challenges</h3><ol className="mt-4 space-y-3">{['Give a multi-solution challenge before teaching course strategies.', 'Collect the product plus evidence of attempts, changes, and explanation.', 'Score only observable evidence using the common rubric.', 'At the end, give a new challenge with the same thinking demands—not the same answer.', 'Compare strategy choice, evidence use, revision, independence, and reflection.'].map((item, index) => <li key={item} className="flex gap-3 text-sm leading-5 text-ink-400"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-black text-amber-700 dark:text-amber-300">{index + 1}</span>{item}</li>)}</ol></div><div className="card p-5"><p className="label-eyebrow">Class evidence summary</p><h3 className="mt-1 font-black text-ink-100">Useful for teachers, families, and program advocacy</h3><div className="mt-4 space-y-3">{curriculum.strands.map((strand) => <div key={strand.id} className="rounded-xl border border-ink-800 p-3"><p className="text-sm font-black text-ink-200">{strand.label}</p><p className="mt-1 text-xs text-ink-500">{strand.short}</p><p className="mt-2 text-[11px] text-ink-600">Beginning ___ · Developing ___ · Independent ___ · Transfer ___</p></div>)}</div></div></section><section className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5"><div className="flex gap-3"><UsersRound size={22} className="shrink-0 text-violet-400" /><div><h3 className="font-black text-ink-100">Keep the challenge; change the access</h3><p className="mt-1 text-sm leading-6 text-ink-500">For 2e learners, reduce handwriting load, permit speech-to-text or models, preview routines, chunk materials, and make time visible. Do not remove the ambiguity, reasoning, originality, or intellectual goal that makes the task worthwhile.</p></div></div></section></div>
}

function Output({ curriculum, tab, expanded, setExpanded }) {
  if (tab === 'lessons') return <LessonLibrary curriculum={curriculum} expanded={expanded} setExpanded={setExpanded} />
  if (tab === 'student-kit') return <StudentKit curriculum={curriculum} />
  if (tab === 'growth') return <Growth curriculum={curriculum} />
  return <CurriculumMap curriculum={curriculum} />
}

export default function AdvancedThinkersStudio() {
  const [form, setForm] = useState(initialForm)
  const [curriculum, setCurriculum] = useState(() => buildAdvancedCurriculum(initialForm))
  const [tab, setTab] = useState('map')
  const [expanded, setExpanded] = useState('pattern-detectives-0')
  const [saved, setSaved] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { trackToolOpened('advanced-thinkers-studio', { moduleLabel: 'Gifted & Talented' }); listAdvancedThinkersCurricula().then(setSaved).catch(() => setSaved([])) }, [])
  const selectedMax = useMemo(() => form.weeks === 9 ? 2 : form.weeks === 18 ? 4 : 8, [form.weeks])
  function previewBuild() { setCurriculum(buildAdvancedCurriculum(form)); setTab('map'); setMessage('Curriculum preview updated. Save it when the format feels right.') }
  async function buildAndSave() {
    const next = buildAdvancedCurriculum(form); setCurriculum(next); setSaving(true); setMessage('')
    try { const row = await createAdvancedThinkersCurriculum({ title: next.title, gradeBand: next.gradeBand, weeks: next.weeks, inputs: form, curriculum: next }); setSaved((items) => [row, ...items]); setMessage('Full curriculum saved to your Gifted & Talented workspace.'); void trackToolUsage('advanced-thinkers-studio', 'created', { moduleLabel: 'Gifted & Talented', metadata: { weeks: next.weeks, gradeBand: next.gradeBand } }) } catch (error) { setMessage(`Your curriculum is ready to print. It could not be saved yet: ${error.message}`) } finally { setSaving(false) }
  }
  function reopen(row) { setForm(row.inputs); setCurriculum(row.curriculum); setMessage(`Opened ${row.title}.`); setTab('map') }
  async function print() {
    setMessage('Creating your printable PDF…')
    try {
      const selectedSheet = tab === 'student-kit' ? document.querySelector('.student-print-sheet') : null
      const section = selectedSheet?.dataset.printableTitle || TABS.find((item) => item.id === tab)?.label || 'curriculum'
      const filename = `${curriculum.title}-${section}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      await downloadSectionPdf(selectedSheet || document.querySelector('.advanced-print'), `${filename}.pdf`)
      setMessage('Printable PDF downloaded. Open it to print or save a copy.')
      void trackToolUsage('advanced-thinkers-studio', 'downloaded-pdf', { moduleLabel: 'Gifted & Talented', metadata: { tab } })
    } catch (error) {
      setMessage(`PDF could not be created: ${error.message}`)
    }
  }

  return <div className="space-y-7"><style>{`@media print { body * { visibility: hidden !important; } .advanced-print, .advanced-print * { visibility: visible !important; } .advanced-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; } .advanced-print .card { box-shadow: none !important; break-inside: avoid; } }`}</style><div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link to="/gifted-talented" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200"><ArrowLeft size={14} /> Gifted &amp; Talented workspace</Link><button onClick={print} className="btn-secondary"><Printer size={15} /> Print current section</button></div><section className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-violet-500/10 p-5 sm:p-8 print:hidden"><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15"><Brain size={29} className="text-amber-600 dark:text-amber-300" /></div><div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">Gifted &amp; Talented · K–5 complete curriculum</p><h1 className="mt-1 text-3xl font-black tracking-tight text-ink-50">Advanced Thinkers Studio</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">A full thinking-skills program with ready-to-teach lessons, supplied-source inquiry, reusable student materials, developmental differentiation, and visible evidence of growth.</p></div></div><div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:grid-cols-2"><Badge number="3" label="grade pathways" /><Badge number="8" label="complete units" /><Badge number="32+" label="core lessons" /><Badge number="8" label="student tools" /></div></div><div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{['No empty “research it” directions', 'Concrete K–1 pathway', '2e access without less rigor', 'Baseline-to-showcase growth'].map((item) => <p key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/40 px-3 py-2 text-xs font-bold text-ink-400 dark:bg-ink-950/30"><Check size={14} className="text-amber-600 dark:text-amber-300" />{item}</p>)}</div></section><nav aria-label="Curriculum sections" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 print:hidden">{TABS.map(({ id, label, Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-black transition ${tab === id ? 'border-amber-400 bg-amber-500/10 text-amber-800 dark:text-amber-200' : 'border-ink-800 bg-white text-ink-400 hover:border-amber-500/30 dark:bg-ink-900'}`}><span className="flex items-center gap-2"><Icon size={17} />{label}</span><ChevronRight size={15} /></button>)}</nav><div className="grid gap-6 xl:grid-cols-[360px_1fr] print:block"><Builder form={form} setForm={setForm} saving={saving} buildAndSave={buildAndSave} /><main className="advanced-print"><Output curriculum={curriculum} tab={tab} expanded={expanded} setExpanded={setExpanded} /></main></div><div className="flex flex-wrap items-center gap-3 print:hidden"><button onClick={previewBuild} disabled={form.units.length !== selectedMax} className="btn-secondary"><RotateCcw size={15} /> Update preview without saving</button>{message && <p className="text-xs text-ink-500">{message}</p>}</div>{saved.length > 0 && <section className="card p-5 print:hidden"><div className="flex items-end justify-between gap-3"><div><p className="label-eyebrow">Saved curricula</p><h2 className="mt-1 text-lg font-black text-ink-100">Return to a program anytime</h2></div><span className="text-xs text-ink-500">{saved.length} saved</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{saved.slice(0, 9).map((row) => <button key={row.id} onClick={() => reopen(row)} className="group rounded-xl border border-ink-800 p-4 text-left hover:border-amber-500/40"><div className="flex items-start justify-between"><Save size={17} className="text-amber-500" /><RotateCcw size={14} className="text-ink-600 group-hover:text-amber-500" /></div><p className="mt-3 font-black text-ink-200">{row.title}</p><p className="mt-1 text-xs text-ink-500">{row.grade_band} · {row.weeks} weeks · {new Date(row.updated_at).toLocaleDateString()}</p></button>)}</div></section>}<section className="rounded-2xl border border-ink-800 bg-ink-950 p-5 text-center print:hidden dark:bg-ink-900/60"><Lightbulb size={22} className="mx-auto text-amber-500" /><h2 className="mt-2 font-black text-ink-100">Original PlansK12 curriculum—built for depth, not busywork</h2><p className="mx-auto mt-1 max-w-3xl text-xs leading-5 text-ink-500">Designed around creative thinking, critical thinking, inquiry, problem solving, reflection, and cognitive growth. It supports classroom practice and portfolio evidence; it is not a gifted-identification test or a substitute for district eligibility procedures.</p></section></div>
}

function Badge({ number, label }) { return <div className="rounded-xl border border-ink-800 bg-white/70 px-3 py-2 dark:bg-ink-950/70"><b className="block text-lg text-ink-100">{number}</b><span className="text-[10px] text-ink-500">{label}</span></div> }
