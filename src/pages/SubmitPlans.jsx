import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, ClipboardCopy, FileDown, FileSliders, Loader2, Printer } from 'lucide-react'
import { listLessons } from '../services/lessonsService'
import { getLessonPlanFormatValues, listLessonPlanFormats, starterFormat } from '../services/lessonPlanFormatService'
import { MODULES, subjectMatchesFilter } from '../constants/modules'
import { displayLines, inspectLessonFormat } from '../lib/personalPlanContent'
import { requestDocx } from '../lib/docxExport'
import { trackToolUsage } from '../services/productUsageService'
import { useTrial } from '../context/TrialContext'

const OUTPUTS = [
  { value: 'snapshot', label: 'Weekly admin snapshot', help: 'A concise plan that is easy for an administrator to scan.' },
  { value: 'school', label: 'Complete school template', help: 'Every enabled section from your saved plan format.' },
  { value: 'year', label: 'Year-at-a-glance', help: 'A short sequence of lessons, units, standards, and targets.' },
]

const RANGES = [
  { value: 'this-week', label: 'This week' },
  { value: 'next-week', label: 'Next week' },
  { value: 'two-weeks', label: 'Next 2 weeks' },
  { value: 'all', label: 'All saved lessons' },
]

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfWeek(offset = 0) {
  const value = new Date()
  const day = value.getDay() || 7
  value.setDate(value.getDate() - day + 1 + offset * 7)
  value.setHours(0, 0, 0, 0)
  return value
}

function rangeBounds(range) {
  if (range === 'all') return null
  const start = startOfWeek(range === 'next-week' ? 1 : 0)
  const end = new Date(start)
  end.setDate(end.getDate() + (range === 'two-weeks' ? 13 : 6))
  return [isoDate(start), isoDate(end)]
}

function lessonObject(row) {
  return row?.lesson_object ?? row ?? {}
}

function lessonTitle(row) {
  const lesson = lessonObject(row)
  return row?.title || lesson.title || lesson.lesson_title || lesson.session_title || 'Lesson plan'
}

function lessonSubject(row) {
  return lessonObject(row).subject || row?.subject || ''
}

function lessonDate(row) {
  return row?.scheduled_date || lessonObject(row).scheduled_date || ''
}

function friendlyDate(value) {
  if (!value) return 'Date not assigned'
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

function formatMeta(row) {
  const lesson = lessonObject(row)
  const grades = lesson.grade_label || lesson.grade_band || (lesson.grade_bands ?? row.grade_bands ?? []).map((grade) => grade === 0 ? 'K' : grade).join(', ')
  const duration = row?.duration_minutes || lesson.duration_minutes
  return [friendlyDate(lessonDate(row)), lesson.subject || row.subject, row?.period_label, grades ? `Grade(s) ${grades}` : '', duration ? `${duration} min` : ''].filter(Boolean).join(' · ')
}

function entryRows(row, format, values, output) {
  const allRows = inspectLessonFormat(lessonObject(row), format, values).rows
  if (output === 'school') return allRows.map((item) => ({ ...item, lines: displayLines(item.content, format.detail_level) }))
  if (output === 'year') {
    const wanted = new Set(['standards', 'learning_targets', 'lesson_sequence'])
    return allRows.filter((item) => wanted.has(item.key)).map((item) => ({ ...item, lines: displayLines(item.content, 'brief').slice(0, item.key === 'lesson_sequence' ? 1 : 2) }))
  }
  const wanted = new Set(['standards', 'learning_targets', 'success_criteria', 'lesson_sequence', 'evidence_of_learning'])
  return allRows.filter((item) => wanted.has(item.key)).map((item) => ({ ...item, lines: displayLines(item.content, 'brief') }))
}

function textForSubmission({ title, teacherName, courseName, destination, notes, rows, format, valuesByLesson, output }) {
  const lines = [title]
  if (teacherName) lines.push(`Teacher: ${teacherName}`)
  if (courseName) lines.push(`Course / class: ${courseName}`)
  if (destination) lines.push(`Prepared for: ${destination}`)
  if (notes) lines.push(`Notes: ${notes}`)
  lines.push('')
  rows.forEach((row) => {
    lines.push(lessonTitle(row), formatMeta(row))
    entryRows(row, format, valuesByLesson[row.id], output).forEach((section) => {
      if (!section.lines.length && section.key === 'mtss_tier_2') lines.push(`${section.label}: N/A`)
      else if (section.lines.length) {
        lines.push(`${section.label}:`)
        section.lines.forEach((line) => lines.push(`• ${line}`))
      }
    })
    lines.push('')
  })
  return lines.join('\n').trim()
}

function blocksForSubmission(args) {
  const blocks = [{ style: 'h1', text: args.title }]
  if (args.teacherName) blocks.push({ style: 'p', text: `Teacher: ${args.teacherName}` })
  if (args.courseName) blocks.push({ style: 'p', text: `Course / class: ${args.courseName}` })
  if (args.destination) blocks.push({ style: 'p', text: `Prepared for: ${args.destination}` })
  if (args.notes) blocks.push({ style: 'p', text: `Notes: ${args.notes}` })
  args.rows.forEach((row, index) => {
    if (index && args.output === 'school') blocks.push({ style: 'pagebreak' })
    blocks.push({ style: 'h2', text: lessonTitle(row) }, { style: 'p', text: formatMeta(row) })
    entryRows(row, args.format, args.valuesByLesson[row.id], args.output).forEach((section) => {
      if (!section.lines.length && section.key === 'mtss_tier_2') blocks.push({ style: 'h3', text: section.label }, { style: 'p', text: 'N/A' })
      else if (section.lines.length) {
        blocks.push({ style: 'h3', text: section.label })
        section.lines.forEach((line) => blocks.push({ style: 'bullet', text: line }))
      }
    })
  })
  return blocks
}

export default function SubmitPlans() {
  const [searchParams] = useSearchParams()
  const requestedModule = searchParams.get('module')
  const initialModule = MODULES.some((module) => module.label === requestedModule) ? requestedModule : 'All'
  const { isPaid, openPaywall, requestExport } = useTrial()
  const [lessons, setLessons] = useState(null)
  const [formats, setFormats] = useState([])
  const [formatId, setFormatId] = useState('')
  const [moduleFilter, setModuleFilter] = useState(initialModule)
  const [range, setRange] = useState('two-weeks')
  const [output, setOutput] = useState('snapshot')
  const [selectedIds, setSelectedIds] = useState(null)
  const [valuesByLesson, setValuesByLesson] = useState({})
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('submissionTeacherName') || '')
  const [courseName, setCourseName] = useState(() => localStorage.getItem('submissionCourseName') || '')
  const [destination, setDestination] = useState(() => localStorage.getItem('submissionDestination') || 'Google Docs / Word')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([listLessons(), listLessonPlanFormats()]).then(([lessonRows, formatRows]) => {
      const availableFormats = formatRows.length ? formatRows : [{ id: 'starter-format', ...starterFormat('brief-review') }]
      setLessons(lessonRows)
      setFormats(availableFormats)
      setFormatId((availableFormats.find((item) => item.is_default) ?? availableFormats[0]).id)
    }).catch((err) => setError(err.message || 'Could not load your saved plans.'))
  }, [])

  const visibleLessons = useMemo(() => {
    const bounds = rangeBounds(range)
    return (lessons ?? []).filter((row) => {
      if (moduleFilter !== 'All' && !subjectMatchesFilter(lessonSubject(row), moduleFilter)) return false
      if (!bounds) return true
      const date = lessonDate(row)
      return date && date >= bounds[0] && date <= bounds[1]
    }).sort((a, b) => (lessonDate(a) || '9999').localeCompare(lessonDate(b) || '9999') || lessonTitle(a).localeCompare(lessonTitle(b)))
  }, [lessons, moduleFilter, range])

  useEffect(() => {
    if (!formatId || formatId === 'starter-format' || !lessons?.length) return undefined
    let active = true
    Promise.all(lessons.map(async (row) => [row.id, await getLessonPlanFormatValues(row.id, formatId).catch(() => null)]))
      .then((pairs) => { if (active) setValuesByLesson(Object.fromEntries(pairs)) })
    return () => { active = false }
  }, [formatId, lessons])

  useEffect(() => {
    localStorage.setItem('submissionTeacherName', teacherName)
    localStorage.setItem('submissionCourseName', courseName)
    localStorage.setItem('submissionDestination', destination)
  }, [teacherName, courseName, destination])

  const format = formats.find((item) => item.id === formatId) ?? formats[0]
  const effectiveSelectedIds = selectedIds ?? new Set(visibleLessons.map((row) => row.id))
  const selectedLessons = visibleLessons.filter((row) => effectiveSelectedIds.has(row.id))
  const outputLabel = OUTPUTS.find((item) => item.value === output)?.label ?? 'Lesson plan submission'
  const submissionTitle = output === 'year' ? `${moduleFilter === 'All' ? 'Instructional' : moduleFilter} Year-at-a-Glance` : `${moduleFilter === 'All' ? 'Weekly' : moduleFilter} Lesson Plans`
  const submissionArgs = { title: submissionTitle, teacherName, courseName, destination, notes, rows: selectedLessons, format, valuesByLesson, output }

  async function handleCopy() {
    await navigator.clipboard.writeText(textForSubmission(submissionArgs))
    setCopied(true)
    void trackToolUsage('submit-plans', 'copied', { moduleLabel: moduleFilter, output })
    setTimeout(() => setCopied(false), 1800)
  }

  async function handlePrint() {
    if (!await requestExport('pdf')) return
    void trackToolUsage('submit-plans', 'printed', { moduleLabel: moduleFilter, output })
    window.print()
  }

  async function handleWord() {
    if (!isPaid) { openPaywall('docx-export'); return }
    setExporting(true)
    setError(null)
    try {
      await requestDocx({ filename: submissionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: submissionTitle, blocks: blocksForSubmission(submissionArgs) })
      void trackToolUsage('submit-plans', 'downloaded', { moduleLabel: moduleFilter, output })
    } catch (err) {
      setError(err.message || 'The Word download did not finish. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (!lessons || !format) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-accent-500" size={28} /></div>

  return <div className="submit-plans-page space-y-6">
    <style>{`@media print { body * { visibility: hidden !important; } .submission-document, .submission-document * { visibility: visible !important; } .submission-document { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; } .submission-entry { break-inside: avoid; } .submission-entry.full-plan { break-after: page; } }`}</style>
    <header className="no-print flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="label-eyebrow mb-2">Planning workflow</p>
        <h1 className="text-3xl font-black text-ink-50">Submit My Plans</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-400">Turn saved PlansK12 lessons into the format your administrator needs. Copy into any school system, download for Word or Google Docs, or print to PDF.</p>
      </div>
      <Link to="/lesson-format" className="btn-secondary"><FileSliders size={17} />Edit my plan format</Link>
    </header>

    {error && <p role="alert" className="no-print rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

    <section className="no-print card grid gap-5 p-5 lg:grid-cols-3">
      <label className="space-y-2 text-sm font-bold text-ink-200">What are you submitting?
        <select className="input-field w-full" value={output} onChange={(event) => setOutput(event.target.value)}>{OUTPUTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <span className="block text-xs font-normal leading-5 text-ink-500">{OUTPUTS.find((item) => item.value === output)?.help}</span>
      </label>
      <label className="space-y-2 text-sm font-bold text-ink-200">Specialty / subject
        <select className="input-field w-full" value={moduleFilter} onChange={(event) => { setModuleFilter(event.target.value); setSelectedIds(null) }}><option value="All">All specialties</option>{MODULES.map((module) => <option key={module.label} value={module.label}>{module.label}</option>)}</select>
      </label>
      <label className="space-y-2 text-sm font-bold text-ink-200">Lesson dates
        <select className="input-field w-full" value={range} onChange={(event) => { setRange(event.target.value); setSelectedIds(null) }}>{RANGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      </label>
      <label className="space-y-2 text-sm font-bold text-ink-200">Saved school format
        <select className="input-field w-full" value={formatId} onChange={(event) => { setFormatId(event.target.value); setValuesByLesson({}) }}>{formats.map((item) => <option key={item.id} value={item.id}>{item.name}{item.is_default ? ' (default)' : ''}</option>)}</select>
      </label>
      <label className="space-y-2 text-sm font-bold text-ink-200">Teacher name
        <input className="input-field w-full" value={teacherName} onChange={(event) => setTeacherName(event.target.value)} placeholder="Your name" />
      </label>
      <label className="space-y-2 text-sm font-bold text-ink-200">Course / class <span className="font-normal text-ink-500">(optional)</span>
        <input className="input-field w-full" value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Example: Intro to Computers" />
      </label>
      <label className="space-y-2 text-sm font-bold text-ink-200">Where will you submit it?
        <select className="input-field w-full" value={destination} onChange={(event) => setDestination(event.target.value)}><option>Google Docs / Word</option><option>Planbook</option><option>Schoology / LMS</option><option>GradeLink</option><option>School-created form</option><option>Other</option></select>
      </label>
      <label className="space-y-2 text-sm font-bold text-ink-200 lg:col-span-2">Submission notes <span className="font-normal text-ink-500">(optional)</span>
        <input className="input-field w-full" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Example: Plans may adjust for assemblies or weather." />
      </label>
    </section>

    <section className="no-print card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black text-ink-100">Choose saved lessons</h2><p className="mt-1 text-sm text-ink-500">{selectedLessons.length} of {visibleLessons.length} selected</p></div>{visibleLessons.length > 0 && <button type="button" className="text-sm font-bold text-accent-400" onClick={() => setSelectedIds(effectiveSelectedIds.size === visibleLessons.length ? new Set() : new Set(visibleLessons.map((row) => row.id)))}>{effectiveSelectedIds.size === visibleLessons.length ? 'Clear all' : 'Select all'}</button>}</div>
      {visibleLessons.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{visibleLessons.map((row) => <label key={row.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${effectiveSelectedIds.has(row.id) ? 'border-accent-500/40 bg-accent-500/8' : 'border-ink-800'}`}><input type="checkbox" className="mt-1 h-4 w-4 accent-teal-500" checked={effectiveSelectedIds.has(row.id)} onChange={() => setSelectedIds((current) => { const next = new Set(current ?? visibleLessons.map((item) => item.id)); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next })} /><span><span className="block text-sm font-bold text-ink-100">{lessonTitle(row)}</span><span className="mt-0.5 block text-xs text-ink-500">{formatMeta(row)}</span></span></label>)}</div> : <div className="mt-4 rounded-xl bg-ink-950/40 p-5 text-center"><p className="font-bold text-ink-200">No scheduled lessons in this view</p><p className="mt-1 text-sm text-ink-500">Choose “All saved lessons,” select another specialty, or schedule lessons first.</p><Link to={`/lessons${moduleFilter === 'All' ? '' : `?module=${encodeURIComponent(moduleFilter)}`}`} className="mt-3 inline-flex text-sm font-bold text-accent-400">Open lesson library</Link></div>}
    </section>

    <div className="no-print flex flex-wrap items-center gap-2">
      <button className="btn-primary" onClick={handleCopy} disabled={!selectedLessons.length}>{copied ? <Check size={17} /> : <ClipboardCopy size={17} />}{copied ? 'Copied!' : 'Copy for school system'}</button>
      <button className="btn-secondary" onClick={handleWord} disabled={!selectedLessons.length || exporting}>{exporting ? <Loader2 size={17} className="animate-spin" /> : <FileDown size={17} />}Download Word</button>
      <button className="btn-secondary" onClick={handlePrint} disabled={!selectedLessons.length}><Printer size={17} />Print / Save PDF</button>
      <span className="ml-auto text-xs text-ink-500">Previewing: {outputLabel}</span>
    </div>

    <article className="submission-document overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <header className="border-b border-slate-200 bg-gradient-to-r from-teal-50 to-sky-50 px-5 py-6 sm:px-8">
        <p className="text-xs font-black uppercase tracking-[.18em] text-teal-700">PlansK12 · {outputLabel}</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{submissionTitle}</h2>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">{teacherName && <span><strong>Teacher:</strong> {teacherName}</span>}{courseName && <span><strong>Course:</strong> {courseName}</span>}{destination && <span><strong>Prepared for:</strong> {destination}</span>}</div>
        {notes && <p className="mt-3 text-sm text-slate-600"><strong>Notes:</strong> {notes}</p>}
      </header>
      {!selectedLessons.length ? <div className="p-10 text-center text-sm text-slate-500">Select at least one saved lesson to build your submission.</div> : <div className="divide-y divide-slate-200">{selectedLessons.map((row) => <section key={row.id} className={`submission-entry px-5 py-6 sm:px-8 ${output === 'school' ? 'full-plan' : ''}`}>
        <h3 className="text-xl font-black text-slate-950">{lessonTitle(row)}</h3>
        <p className="mt-1 text-sm text-slate-500">{formatMeta(row)}</p>
        <div className={`mt-5 grid gap-5 ${output === 'year' ? 'md:grid-cols-3' : ''}`}>{entryRows(row, format, valuesByLesson[row.id], output).map((section) => <div key={section.key} className={output === 'year' ? '' : 'grid gap-2 sm:grid-cols-[180px_1fr]'}><h4 className="text-sm font-black text-slate-900">{section.label}</h4><div>{section.lines.length ? <ul className="space-y-1">{section.lines.map((line, index) => <li key={index} className="text-sm leading-6 text-slate-700">{line}</li>)}</ul> : section.key === 'mtss_tier_2' ? <p className="text-sm italic text-slate-500">N/A</p> : <p className="text-sm italic text-amber-700">Not yet visible in this lesson.</p>}</div></div>)}</div>
      </section>)}</div>}
      {format.requirement_notes && <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 sm:px-8"><strong>School reminder:</strong> {format.requirement_notes}</footer>}
    </article>
  </div>
}
