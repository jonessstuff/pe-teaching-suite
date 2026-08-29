import { useRef, useState } from 'react'
import {
  FileText, ClipboardList, CloudRain, Mail, ClipboardCheck,
  LayoutTemplate, Loader2, Printer, Download, X, Star, BookOpen,
  CheckSquare, Shuffle, Flame, BookMarked, Send, Globe, Users, FileWarning, ChevronDown,
  Copy, Check, PencilRuler, FileDown, Lock, Presentation, Files, Eye,
  ChevronRight,
} from 'lucide-react'
import {
  generateSubPlan, generateQuiz, generateWeatherAlt,
  generateParentNote, generateObservationSummary, generatePoster,
  generateRubric, generateFamilyNewsletter, generateDifferentiatedLesson,
  generateProgressNote, generateExitTicket, generateCrossCurricular,
  generateWarmup, generateBehaviorNote, generateConferencePrep, generateWorksheet,
  generateVisualResources,
} from '../../services/generationService'
import { updateLesson } from '../../services/lessonsService'
import { createAssessment } from '../../services/assessmentService'
import SubPlanRenderer from '../renderers/SubPlanRenderer'
import QuizRenderer from '../renderers/QuizRenderer'
import WeatherAltRenderer from '../renderers/WeatherAltRenderer'
import ParentNoteRenderer from '../renderers/ParentNoteRenderer'
import ObservationSummaryRenderer from '../renderers/ObservationSummaryRenderer'
import PosterRenderer from '../renderers/PosterRenderer'
import RubricRenderer from '../renderers/RubricRenderer'
import FamilyNewsletterRenderer from '../renderers/FamilyNewsletterRenderer'
import DifferentiatedLessonRenderer from '../renderers/DifferentiatedLessonRenderer'
import WorksheetRenderer from '../renderers/WorksheetRenderer'
import VisualResourceRenderer from '../renderers/VisualResourceRenderer'
import MakeTomorrowReady from './MakeTomorrowReady'
import TeachingView from './TeachingView'
import { useTrial } from '../../context/TrialContext'
import { WATERMARK_TEXT } from '../../services/trialService'
import { printArtifact } from '../../lib/printArtifact'
import { requestDocx, lessonToBlocks, domToBlocks } from '../../lib/docxExport'
import { requestPptx, lessonToSlides } from '../../lib/pptxExport'

const PE_SUBJECTS = new Set(['PE', 'Health', "Family Life", "Driver's Ed", "Strength & Conditioning"])
const DIFF_TYPES = ['advanced', 'below_grade', 'sensory', 'ell', 'physical']
const DIFF_LABELS = { advanced: 'Advanced', below_grade: 'Below Grade', sensory: 'Sensory', ell: 'ELL', physical: 'Physical' }

export default function SecondaryToolsPanel({ savedId, lessonObject, subject }) {
  const { requestExport, isPaid, openPaywall } = useTrial()
  const [lo, setLo] = useState(lessonObject)
  const [toolView, setToolView] = useState(null)
  const [error, setError] = useState(null)
  // Feedback shown right next to the export buttons (Word/PPT/Poster).
  const [exportNotice, setExportNotice] = useState(null) // { type:'error'|'success', msg }
  function flashExport(type, msg) {
    setExportNotice({ type, msg })
    if (type === 'success') setTimeout(() => setExportNotice(null), 4000)
  }
  const [showPoster, setShowPoster] = useState(false)
  const posterSvgRef = useRef(null)
  const toolPrintRef = useRef(null)

  const [generatingSubPlan, setGeneratingSubPlan] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [generatingWeatherAlt, setGeneratingWeatherAlt] = useState(false)
  const [generatingVisualResources, setGeneratingVisualResources] = useState(false)
  const [generatingParentNote, setGeneratingParentNote] = useState(false)
  const [generatingObsSummary, setGeneratingObsSummary] = useState(false)
  const [generatingPoster, setGeneratingPoster] = useState(false)
  const [generatingRubric, setGeneratingRubric] = useState(false)
  const [generatingNewsletter, setGeneratingNewsletter] = useState(false)
  const [generatingDiff, setGeneratingDiff] = useState(false)
  const [generatingExitTicket, setGeneratingExitTicket] = useState(false)
  const [generatingCross, setGeneratingCross] = useState(false)

  // Session-scoped results (not persisted to lesson row)
  const [rubric, setRubric] = useState(null)
  const [newsletter, setNewsletter] = useState(null)
  const [diffLesson, setDiffLesson] = useState(null)
  const [exitTickets, setExitTickets] = useState(null)
  const [crossConnections, setCrossConnections] = useState(null)
  const [quizSavedToBank, setQuizSavedToBank] = useState(false)
  const [rubricSavedToBank, setRubricSavedToBank] = useState(false)

  // Progress note form state
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [progressForm, setProgressForm] = useState({ studentName: '', iepGoal: '', goalCategory: 'participation', observationNotes: '', performanceLevel: 'emerging' })
  const [progressNote, setProgressNote] = useState(null)
  const [generatingProgress, setGeneratingProgress] = useState(false)

  // Behavior note form
  const [showBehaviorForm, setShowBehaviorForm] = useState(false)
  const [behaviorForm, setBehaviorForm] = useState({ studentName: '', incidentDescription: '', gradeLevel: '' })
  const [behaviorNote, setBehaviorNote] = useState(null)
  const [generatingBehavior, setGeneratingBehavior] = useState(false)

  // Conference prep form
  const [showConferenceForm, setShowConferenceForm] = useState(false)
  const [conferenceForm, setConferenceForm] = useState({ studentName: '', gradeBand: '', strengths: '', areasOfConcern: '', goals: '' })
  const [conferencePrep, setConferencePrep] = useState(null)
  const [generatingConference, setGeneratingConference] = useState(false)

  // Warmup form
  const [warmupOptions, setWarmupOptions] = useState(null)
  const [generatingWarmup, setGeneratingWarmup] = useState(false)

  // Worksheet — format selection + session-scoped result
  const [showWorksheetForm, setShowWorksheetForm] = useState(false)
  const [worksheetFormats, setWorksheetFormats] = useState(['fill_blank', 'matching'])
  const [worksheet, setWorksheet] = useState(null)
  const [generatingWorksheet, setGeneratingWorksheet] = useState(false)
  const [worksheetSaved, setWorksheetSaved] = useState({}) // { cut_paste: true }

  const [expanded, setExpanded] = useState(false)

  const hasSubPlan = Boolean(lo?.sub_script)
  const hasQuiz = Boolean(lo?.quiz_questions && Object.keys(lo.quiz_questions).length > 0)
  const hasWeatherAlt = Boolean(lo?.weather_alt_warm_up || lo?.weather_alt_notes)
  // Visual resources: null = pass not run; [] = ran and correctly found none;
  // non-empty = ready-to-use materials built from the lesson.
  const visualResources = Array.isArray(lo?.visual_resources) ? lo.visual_resources : []
  const visualResourcesRun = Array.isArray(lo?.visual_resources)
  const hasVisualResources = visualResources.length > 0
  const hasParentNote = Boolean(lo?.parent_note_intro || lo?.parent_note_skills?.length)
  const hasObsSummary = Boolean(lo?.obs_overview)
  const hasPoster = Boolean(lo?.poster_content?.steps?.length)
  const isPE = PE_SUBJECTS.has(subject)

  // Standing rule: activity-idea / clinical / non-evaluative modules NEVER get
  // Quiz or Rubric (no gradable delivered "content"; grading conflicts with
  // their professional non-evaluative practice). Content-delivery lesson modules
  // get the full tool set — the teacher decides what to use.
  const NON_EVALUATIVE = new Set([
    'Occupational Therapists', 'Physical Therapists', 'Speech-Language Pathologists',
    'Teacher of the Visually Impaired', 'Teacher of the Deaf & Hard of Hearing',
    'School Counselors', 'Intervention Planning', 'Student Support Team Activities',
    'Adaptive PE',
  ])
  const allowQuizRubric = !NON_EVALUATIVE.has(subject)
  const isWorldLanguages = subject === 'World Languages'

  // Worksheet format options. Cut & paste is a younger-grades (K-5) activity, so
  // it's only OFFERED when the lesson targets a grade band ≤ 5. Content-based
  // fit (e.g. cut & paste needs sortable/sequenceable content, word search needs
  // enough vocabulary) is judged server-side, which actually sees the lesson — a
  // format that doesn't fit comes back marked "not generated" rather than
  // producing a weak sheet.
  const worksheetGrades = lo?.grade_bands ?? []
  const offersCutPaste = worksheetGrades.length > 0 && Math.min(...worksheetGrades) <= 5
  const WORKSHEET_FORMAT_OPTIONS = [
    { key: 'fill_blank', label: 'Fill in the blank' },
    { key: 'matching', label: 'Matching' },
    { key: 'word_search', label: 'Word search' },
    { key: 'multiple_choice', label: 'Multiple choice practice' },
    { key: 'research', label: 'Research sheet' },
    ...(offersCutPaste ? [{ key: 'cut_paste', label: 'Cut & paste (K–5)' }] : []),
  ]

  async function run(setter, fn) {
    setter(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setter(false)
    }
  }

  function toggle(view) {
    setToolView((prev) => (prev === view ? null : view))
  }

  function jumpTo(id) {
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }

  function openKitShortcut(section) {
    if (section === 'teach') {
      setToolView('teachingview')
      jumpTo('lesson-kit-output')
      return
    }
    if (section === 'materials') {
      setExpanded(true)
      if (allowQuizRubric) setShowWorksheetForm(true)
      jumpTo(allowQuizRubric ? 'lesson-kit-worksheet' : 'lesson-kit-more')
      return
    }
    if (section === 'assess') {
      setExpanded(true)
      jumpTo('lesson-kit-assess')
      return
    }
    jumpTo('lesson-kit-export')
  }

  // Word (.docx) export of the main lesson — PAID ONLY. Trial users get the
  // upgrade prompt instead (the server also enforces the gate).
  async function handleDownloadLessonDocx() {
    if (!isPaid) { openPaywall('docx-export'); return }
    setExportNotice(null)
    try {
      await requestDocx({ filename: lo?.title ?? 'lesson', title: lo?.title, blocks: lessonToBlocks(lo) })
      flashExport('success', 'Word document downloaded.')
    } catch (err) {
      if (err.status === 403) openPaywall('docx-export')
      else flashExport('error', err.message ?? 'Word download failed — please try again.')
    }
  }

  // PowerPoint (.pptx) export of the main lesson — PAID ONLY. Trial users get the
  // upgrade prompt instead (the server also enforces the gate).
  async function handleDownloadLessonPptx() {
    if (!isPaid) { openPaywall('pptx-export'); return }
    setExportNotice(null)
    try {
      const spec = lessonToSlides(lo)
      await requestPptx({ filename: lo?.title ?? 'lesson', ...spec })
      flashExport('success', 'PowerPoint downloaded.')
    } catch (err) {
      if (err.status === 403) openPaywall('pptx-export')
      else flashExport('error', err.message ?? 'PowerPoint download failed — please try again.')
    }
  }

  async function handleGenerateSubPlan() {
    await run(setGeneratingSubPlan, async () => {
      const fields = await generateSubPlan(savedId)
      const updated = await updateLesson(savedId, { lessonObject: fields })
      setLo(updated.lesson_object)
      setToolView('subplan')
    })
  }

  async function handleGenerateQuiz() {
    await run(setGeneratingQuiz, async () => {
      const fields = await generateQuiz(savedId)
      const updated = await updateLesson(savedId, { lessonObject: fields })
      setLo(updated.lesson_object)
      setToolView('quiz')
    })
  }

  async function handleGenerateWeatherAlt() {
    await run(setGeneratingWeatherAlt, async () => {
      const fields = await generateWeatherAlt(savedId)
      const updated = await updateLesson(savedId, { lessonObject: fields })
      setLo(updated.lesson_object)
      setToolView('weatheralt')
    })
  }

  async function handleGenerateVisualResources() {
    await run(setGeneratingVisualResources, async () => {
      const { visual_resources } = await generateVisualResources(savedId)
      const updated = await updateLesson(savedId, { lessonObject: { visual_resources } })
      setLo(updated.lesson_object)
      // Open the preview when something was built; otherwise leave it closed —
      // "found none" is a valid outcome and the button reflects it.
      setToolView((visual_resources ?? []).length > 0 ? 'visualresources' : null)
    })
  }

  async function handleGenerateParentNote() {
    await run(setGeneratingParentNote, async () => {
      const fields = await generateParentNote(savedId)
      const updated = await updateLesson(savedId, { lessonObject: fields })
      setLo(updated.lesson_object)
      setToolView('parentnote')
    })
  }

  async function handleGenerateObsSummary() {
    await run(setGeneratingObsSummary, async () => {
      const fields = await generateObservationSummary(savedId)
      const updated = await updateLesson(savedId, { lessonObject: fields })
      setLo(updated.lesson_object)
      setToolView('observation')
    })
  }

  async function handleGeneratePoster() {
    await run(setGeneratingPoster, async () => {
      const fields = await generatePoster(lo)
      const updated = await updateLesson(savedId, { lessonObject: fields })
      setLo(updated.lesson_object)
      setShowPoster(true)
    })
  }

  async function handleGenerateRubric() {
    await run(setGeneratingRubric, async () => {
      const result = await generateRubric(savedId)
      setRubric(result.rubric)
      setToolView('rubric')
    })
  }

  async function handleSaveRubricToBank() {
    if (!rubric) return
    try {
      await createAssessment({ title: rubric.title || `${lo?.title} Rubric`, subject: lo?.subject, gradeBands: lo?.grade_bands ?? [], assessmentType: 'rubric', content: rubric, lessonId: savedId })
      setRubricSavedToBank(true)
    } catch (err) { setError(err.message) }
  }

  async function handleSaveQuizToBank() {
    if (!hasQuiz) return
    try {
      await createAssessment({ title: `${lo?.title} Quiz`, subject: lo?.subject, gradeBands: lo?.grade_bands ?? [], assessmentType: 'quiz', content: lo.quiz_questions, lessonId: savedId })
      setQuizSavedToBank(true)
    } catch (err) { setError(err.message) }
  }

  async function handleGenerateNewsletter() {
    await run(setGeneratingNewsletter, async () => {
      const result = await generateFamilyNewsletter(savedId)
      setNewsletter(result.family_newsletter)
      setToolView('newsletter')
    })
  }

  async function handleGenerateDiff(type) {
    await run(setGeneratingDiff, async () => {
      const result = await generateDifferentiatedLesson(savedId, type)
      setDiffLesson(result.differentiation)
      setToolView('diff')
    })
  }

  async function handleGenerateExitTicket() {
    await run(setGeneratingExitTicket, async () => {
      const result = await generateExitTicket(savedId)
      setExitTickets(result.exit_tickets)
      setToolView('exitticket')
    })
  }

  async function handleGenerateCross() {
    await run(setGeneratingCross, async () => {
      const result = await generateCrossCurricular(savedId)
      setCrossConnections(result.connections)
      setToolView('cross')
    })
  }

  async function handleGenerateProgress(e) {
    e.preventDefault()
    await run(setGeneratingProgress, async () => {
      const result = await generateProgressNote(savedId, progressForm)
      setProgressNote(result.progress_note)
      setToolView('progress')
      setShowProgressForm(false)
    })
  }

  async function handleGenerateBehavior(e) {
    e.preventDefault()
    await run(setGeneratingBehavior, async () => {
      const result = await generateBehaviorNote({ ...behaviorForm, subject })
      setBehaviorNote(result.behavior_note)
      setToolView('behavior')
      setShowBehaviorForm(false)
    })
  }

  async function handleGenerateConference(e) {
    e.preventDefault()
    await run(setGeneratingConference, async () => {
      const result = await generateConferencePrep({ ...conferenceForm, subject })
      setConferencePrep(result.conference_prep)
      setToolView('conference')
      setShowConferenceForm(false)
    })
  }

  async function handleGenerateWarmup() {
    await run(setGeneratingWarmup, async () => {
      const result = await generateWarmup({ subject, gradeBand: lo?.grade_bands?.[0] ?? 5, duration: 10, equipment: lo?.equipment_needed ?? [] })
      setWarmupOptions(result.warmup_options)
      setToolView('warmup')
    })
  }

  async function handleGenerateWorksheet(e) {
    e.preventDefault()
    if (worksheetFormats.length === 0) { setError('Pick at least one worksheet format.'); return }
    await run(setGeneratingWorksheet, async () => {
      const result = await generateWorksheet(savedId, worksheetFormats)
      setWorksheet(result.worksheet)
      setWorksheetSaved({})
      setToolView('worksheet')
      setShowWorksheetForm(false)
    })
  }

  // Cut & paste worksheets can be banked like quizzes/rubrics.
  const WORKSHEET_BANK_LABELS = { cut_paste: 'Cut & Paste' }
  async function handleSaveWorksheetToBank(fmt) {
    try {
      await createAssessment({
        title: `${lo?.title ?? 'Lesson'} — ${WORKSHEET_BANK_LABELS[fmt.type] ?? fmt.type}`,
        subject: lo?.subject,
        gradeBands: lo?.grade_bands ?? [],
        assessmentType: fmt.type,
        content: fmt,
        lessonId: savedId,
      })
      setWorksheetSaved(s => ({ ...s, [fmt.type]: true }))
    } catch (err) { setError(err.message) }
  }

  async function handlePrintPoster() {
    const svgEl = posterSvgRef.current
    if (!svgEl) return
    if (!(await requestExport())) return
    // Trial exports carry a print-only watermark footer (paid users don't).
    const watermark = isPaid
      ? ''
      : `<div style="position:fixed;bottom:0;left:0;right:0;padding:4px 0;border-top:1px solid #ccc;text-align:center;font-size:9px;color:#6b7280">${WATERMARK_TEXT}</div>`
    const html = `<!DOCTYPE html><html><head><title>Lesson Poster</title><style>body{margin:0;padding:0}svg{display:block;width:100%;height:auto}</style></head><body>${svgEl.outerHTML}${watermark}</body></html>`
    const win = window.open('', '_blank', 'width=900,height=1100')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  async function handleDownloadPoster() {
    const svgEl = posterSvgRef.current
    if (!svgEl) return
    if (!(await requestExport('pdf'))) return
    setExportNotice(null)
    try {
      const SCALE = 2
      const SVG_W = 816
      const SVG_H = 1056
      const svgStr = new XMLSerializer().serializeToString(svgEl)
      const blobUrl = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml' }))
      const img = new Image()
      img.src = blobUrl
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
      const canvas = document.createElement('canvas')
      canvas.width = SVG_W * SCALE
      canvas.height = SVG_H * SCALE
      const ctx = canvas.getContext('2d')
      ctx.scale(SCALE, SCALE)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(blobUrl)
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 612, 792)
      // Trial exports carry a watermark footer (paid users don't).
      if (!isPaid) {
        pdf.setFontSize(8)
        pdf.setTextColor(107, 114, 128)
        pdf.text(WATERMARK_TEXT, 306, 782, { align: 'center' })
      }
      pdf.save(`${(lo?.title ?? 'lesson').replace(/\s+/g, '-').toLowerCase()}-poster.pdf`)
      flashExport('success', 'Poster PDF downloaded.')
    } catch (err) {
      flashExport('error', err?.message ?? 'Poster PDF failed to generate — please try again.')
    }
  }

  return (
    <div className="mt-10 print:hidden flex flex-col gap-6">
      {/* Tool button strip. order-last drops it BELOW the active tool output
          (rendered as the earlier siblings), so a generated sub plan/quiz sits
          right under the lesson instead of being wedged beneath these buttons. */}
      <div className="order-last border-t border-ink-900 pt-6 space-y-4">
        <div className="rounded-2xl border border-accent-500/20 bg-gradient-to-r from-accent-500/10 via-transparent to-violet-500/10 p-4">
          <p className="label-eyebrow text-accent-500">Your Lesson Kit</p>
          <h2 className="mt-1 text-lg font-semibold text-ink-100">Plan, teach, display, and assess—all from this lesson</h2>
          <p className="mt-1 text-sm text-ink-500">Choose only what you need. Student materials and assessments are generated separately so the main lesson stays easy to scan.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {[
              ['teach', 'Teach', 'At-a-glance plan'],
              ['materials', 'Student materials', 'Cards & worksheets'],
              ['assess', 'Assess', allowQuizRubric ? 'Quiz, rubric & exit ticket' : 'Progress & observation tools'],
              ['export', 'Share & export', 'Print, Word & slides'],
            ].map(([key, label, detail]) => (
              <button key={key} type="button" onClick={() => openKitShortcut(key)} className="group rounded-lg border border-transparent bg-white/60 px-3 py-2 text-left transition hover:border-accent-500/30 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:bg-ink-950/40 dark:hover:bg-ink-950/70">
                <span className="flex items-center justify-between gap-1"><strong className="text-ink-200">{label}</strong><ChevronRight size={13} className="text-accent-500 transition-transform group-hover:translate-x-0.5" /></span>
                <span className="mt-0.5 block text-ink-500">{detail}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="label-eyebrow text-ink-400">Lesson kit tools</p>

        {/* Primary tools — always visible */}
        <div id="lesson-kit-primary" className="flex flex-wrap gap-2">
          {/* Sub plan */}
          {!hasSubPlan ? (
            <button onClick={handleGenerateSubPlan} disabled={generatingSubPlan} className="btn-primary">
              {generatingSubPlan ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Generate sub plan
            </button>
          ) : (
            <button onClick={() => toggle('subplan')} className={toolView === 'subplan' ? 'btn-primary' : 'btn-secondary'}>
              <FileText size={16} />
              Sub plan
            </button>
          )}

          {/* Quiz — hidden for non-evaluative modules */}
          {allowQuizRubric && (!hasQuiz ? (
            <button onClick={handleGenerateQuiz} disabled={generatingQuiz} className="btn-primary">
              {generatingQuiz ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} />}
              Generate quiz
            </button>
          ) : (
            <button onClick={() => toggle('quiz')} className={toolView === 'quiz' ? 'btn-primary' : 'btn-secondary'}>
              <ClipboardList size={16} />
              Quiz
            </button>
          ))}

          {/* Worksheet — independent practice; hidden for non-evaluative modules.
              Always opens the format picker so a teacher can generate MULTIPLE
              different formats from the same lesson (each generation replaces the
              shown sheet; the picker is the way back to make another). */}
          {allowQuizRubric && (
            <button id="lesson-kit-worksheet" onClick={() => setShowWorksheetForm(f => !f)} className={showWorksheetForm || toolView === 'worksheet' ? 'btn-primary' : 'btn-secondary'}>
              <PencilRuler size={16} />
              Worksheet
            </button>
          )}

          {/* Observation prep */}
          {!hasObsSummary ? (
            <button onClick={handleGenerateObsSummary} disabled={generatingObsSummary} className="btn-secondary">
              {generatingObsSummary ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
              Observation prep
            </button>
          ) : (
            <button onClick={() => toggle('observation')} className={toolView === 'observation' ? 'btn-primary' : 'btn-secondary'}>
              <ClipboardCheck size={16} />
              Obs. prep
            </button>
          )}

          {/* Parent note */}
          {!hasParentNote ? (
            <button onClick={handleGenerateParentNote} disabled={generatingParentNote} className="btn-secondary">
              {generatingParentNote ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Parent note
            </button>
          ) : (
            <button onClick={() => toggle('parentnote')} className={toolView === 'parentnote' ? 'btn-primary' : 'btn-secondary'}>
              <Mail size={16} />
              Parent note
            </button>
          )}

          {/* Complete Resource Bundle — one-click Teacher Packet for lesson-based modules. */}
          {allowQuizRubric && <MakeTomorrowReady savedId={savedId} lessonObject={lo} />}

          {/* Teaching view — condensed at-a-glance (PE & Health) */}
          <button onClick={() => toggle('teachingview')} className={toolView === 'teachingview' ? 'btn-primary' : 'btn-secondary'}>
            <Eye size={16} />
            Teaching view
          </button>

          {/* Print */}
          <button id="lesson-kit-export" onClick={async () => { if (await requestExport()) window.print() }} className="btn-secondary">
            <Printer size={16} />
            Print lesson
          </button>

          {/* Word (.docx) — paid only; trial users see the upgrade prompt */}
          <button onClick={handleDownloadLessonDocx} className="btn-secondary" title={isPaid ? 'Download as an editable Word document' : 'Upgrade to download as an editable Word document'}>
            {isPaid ? <FileDown size={16} /> : <Lock size={16} />}
            Word (.docx)
          </button>

          {/* PowerPoint (.pptx) — paid only; trial users see the upgrade prompt */}
          <button onClick={handleDownloadLessonPptx} className="btn-secondary" title={isPaid ? 'Download as presentation-ready PowerPoint slides' : 'Upgrade to download as PowerPoint slides'}>
            {isPaid ? <Presentation size={16} /> : <Lock size={16} />}
            PowerPoint (.pptx)
          </button>
        </div>

        {exportNotice && (
          <p role="status" aria-live="polite"
             className={`mt-2 text-sm ${exportNotice.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            {exportNotice.msg}
          </p>
        )}

        {/* Separator + expand toggle */}
        <div className="border-t border-ink-900/50 pt-3">
          <button onClick={() => setExpanded(e => !e)} className="btn-secondary flex items-center gap-1.5 text-xs">
            <ChevronDown size={13} className={`transition-transform duration-150${expanded ? ' rotate-180' : ''}`} />
            More tools
          </button>
        </div>

        {/* Secondary tools — expanded on demand */}
        {expanded && (
          <div id="lesson-kit-more" className="flex flex-wrap gap-2">
            {/* Weather alt — PE subjects only */}
            {isPE && (
              !hasWeatherAlt ? (
                <button onClick={handleGenerateWeatherAlt} disabled={generatingWeatherAlt} className="btn-secondary">
                  {generatingWeatherAlt ? <Loader2 size={16} className="animate-spin" /> : <CloudRain size={16} />}
                  Weather alternative
                </button>
              ) : (
                <button onClick={() => toggle('weatheralt')} className={toolView === 'weatheralt' ? 'btn-primary' : 'btn-secondary'}>
                  <CloudRain size={16} />
                  Indoor alt
                </button>
              )
            )}

            {/* Visual teaching resources — buildable, text-based materials the
                lesson calls for (checklists, vocab/scenario/cue cards, organizers).
                Available for every subject; "found none" is a valid outcome. */}
            {!visualResourcesRun ? (
              <button onClick={handleGenerateVisualResources} disabled={generatingVisualResources} className="btn-secondary">
                {generatingVisualResources ? <Loader2 size={16} className="animate-spin" /> : <Files size={16} />}
                Visual resources
              </button>
            ) : hasVisualResources ? (
              <button onClick={() => toggle('visualresources')} className={toolView === 'visualresources' ? 'btn-primary' : 'btn-secondary'}>
                <Files size={16} />
                Visual resources ({visualResources.length})
              </button>
            ) : (
              <button onClick={handleGenerateVisualResources} disabled={generatingVisualResources} className="btn-secondary opacity-60"
                title="This lesson didn't call for any buildable materials. Click to re-scan.">
                {generatingVisualResources ? <Loader2 size={16} className="animate-spin" /> : <Files size={16} />}
                No visual resources needed
              </button>
            )}

            {/* Poster */}
            {!hasPoster ? (
              <button onClick={handleGeneratePoster} disabled={generatingPoster} className="btn-secondary">
                {generatingPoster ? <Loader2 size={16} className="animate-spin" /> : <LayoutTemplate size={16} />}
                Generate poster
              </button>
            ) : (
              <button onClick={() => setShowPoster(true)} className="btn-secondary">
                <LayoutTemplate size={16} />
                View poster
              </button>
            )}

            {/* Rubric — hidden for non-evaluative modules */}
            {allowQuizRubric && (
            <button id="lesson-kit-assess" onClick={rubric ? () => toggle('rubric') : handleGenerateRubric} disabled={generatingRubric} className={rubric && toolView === 'rubric' ? 'btn-primary' : 'btn-secondary'}>
              {generatingRubric ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
              {rubric ? 'Rubric' : 'Generate rubric'}
            </button>
            )}

            {/* Exit ticket */}
            <button onClick={exitTickets ? () => toggle('exitticket') : handleGenerateExitTicket} disabled={generatingExitTicket} className={exitTickets && toolView === 'exitticket' ? 'btn-primary' : 'btn-secondary'}>
              {generatingExitTicket ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
              Exit ticket
            </button>

            {/* Family newsletter */}
            <button onClick={newsletter ? () => toggle('newsletter') : handleGenerateNewsletter} disabled={generatingNewsletter} className={newsletter && toolView === 'newsletter' ? 'btn-primary' : 'btn-secondary'}>
              {generatingNewsletter ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Family newsletter
            </button>

            {/* Differentiation */}
            {!diffLesson ? (
              <div className="relative group/diff">
                <button disabled={generatingDiff} className="btn-secondary">
                  {generatingDiff ? <Loader2 size={16} className="animate-spin" /> : <Shuffle size={16} />}
                  Differentiate
                </button>
                <div className="absolute top-full left-0 z-10 mt-1 hidden group-hover/diff:block min-w-[140px] rounded-lg border border-ink-800 bg-ink-100 shadow-lg">
                  {DIFF_TYPES.map(type => (
                    <button key={type} onClick={() => handleGenerateDiff(type)} className="block w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-200 first:rounded-t-lg last:rounded-b-lg">
                      {DIFF_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={() => toggle('diff')} className={toolView === 'diff' ? 'btn-primary' : 'btn-secondary'}>
                <Shuffle size={16} /> Differentiation
              </button>
            )}

            {/* Cross-curricular */}
            <button onClick={crossConnections ? () => toggle('cross') : handleGenerateCross} disabled={generatingCross} className={crossConnections && toolView === 'cross' ? 'btn-primary' : 'btn-secondary'}>
              {generatingCross ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
              Cross-curricular
            </button>

            {/* Warm-up */}
            <button onClick={warmupOptions ? () => toggle('warmup') : handleGenerateWarmup} disabled={generatingWarmup} className={warmupOptions && toolView === 'warmup' ? 'btn-primary' : 'btn-secondary'}>
              {generatingWarmup ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
              Warm-up options
            </button>

            {/* Progress note */}
            <button onClick={() => setShowProgressForm(f => !f)} className={showProgressForm || toolView === 'progress' ? 'btn-primary' : 'btn-secondary'}>
              <BookOpen size={16} />
              Progress note
            </button>

            {/* Behavior note */}
            <button onClick={() => setShowBehaviorForm(f => !f)} className={showBehaviorForm || toolView === 'behavior' ? 'btn-primary' : 'btn-secondary'}>
              <FileWarning size={16} />
              Behavior note
            </button>

            {/* Conference prep */}
            <button onClick={() => setShowConferenceForm(f => !f)} className={showConferenceForm || toolView === 'conference' ? 'btn-primary' : 'btn-secondary'}>
              <Users size={16} />
              Conference prep
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Visual-resource callouts: small chips near the lesson that link to the
            separate preview/print area (keeps the core lesson document clean). */}
        {hasVisualResources && (
          <div className="no-print flex flex-wrap items-center gap-2 border-t border-ink-900/50 pt-3">
            <span className="text-xs font-medium text-ink-400">Visual resources generated:</span>
            {visualResources.map((r, i) => (
              <button
                key={i}
                onClick={() => setToolView('visualresources')}
                className="inline-flex items-center gap-1 rounded-full border border-accent-500/40 bg-accent-500/10 px-2.5 py-0.5 text-xs text-accent-300 transition-colors hover:bg-accent-500/20"
                title={r.supports ? `Supports: ${r.supports}` : undefined}
              >
                <Files size={12} />
                {r.title}{r.supports ? ` · ${r.supports}` : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active tool output */}
      {toolView === 'teachingview' && (
        <div id="lesson-kit-output" ref={toolPrintRef} className="scroll-mt-24 space-y-3">
          <TeachingView lesson={lo} />
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'subplan' && hasSubPlan && (
        <div ref={toolPrintRef} className="space-y-3">
          <SubPlanRenderer lesson={lo} />
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'quiz' && hasQuiz && (
        <div ref={toolPrintRef} className="space-y-3">
          {isWorldLanguages && (
            <p className="no-print rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-ink-200">
              ⚠️ Verify all target-language text (spelling, grammar, register) with a native/heritage speaker before use — especially for less commonly taught languages.
            </p>
          )}
          <QuizRenderer quiz_questions={lo.quiz_questions} />
          {!quizSavedToBank && (
            <button onClick={handleSaveQuizToBank} className="no-print btn-secondary text-xs">
              <BookMarked size={14} /> Save quiz to Assessment Bank
            </button>
          )}
          {quizSavedToBank && <p className="no-print text-xs text-green-400">Saved to Assessment Bank ✓</p>}
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'worksheet' && worksheet && (
        <div ref={toolPrintRef} className="space-y-3">
          {isWorldLanguages && (
            <p className="no-print rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-ink-200">
              ⚠️ Verify all target-language text (spelling, grammar) with a native/heritage speaker before use.
            </p>
          )}
          <WorksheetRenderer worksheet={worksheet} />
          {allowQuizRubric && (worksheet.formats ?? [])
            .filter(f => f.type === 'cut_paste' && f.applicable !== false)
            .map(f => (
              worksheetSaved[f.type]
                ? <p key={f.type} className="no-print text-xs text-green-400">Saved {WORKSHEET_BANK_LABELS[f.type]} to Assessment Bank ✓</p>
                : <button key={f.type} onClick={() => handleSaveWorksheetToBank(f)} className="no-print btn-secondary text-xs">
                    <BookMarked size={14} /> Save {WORKSHEET_BANK_LABELS[f.type]} to Assessment Bank
                  </button>
            ))}
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'weatheralt' && hasWeatherAlt && (
        <div ref={toolPrintRef} className="space-y-3">
          <WeatherAltRenderer lesson={lo} />
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'visualresources' && hasVisualResources && (
        <div ref={toolPrintRef} className="space-y-3">
          <p className="no-print text-xs text-ink-500">
            {visualResources.length} ready-to-use resource{visualResources.length > 1 ? 's' : ''} built from this lesson. Diagrams and illustrations aren't included yet (a future image-generation capability).
          </p>
          <VisualResourceRenderer resources={visualResources} />
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'parentnote' && hasParentNote && (
        <div ref={toolPrintRef} className="space-y-3">
          <ParentNoteRenderer lesson={lo} />
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'observation' && hasObsSummary && (
        <div ref={toolPrintRef} className="space-y-3">
          <ObservationSummaryRenderer lesson={lo} />
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'rubric' && rubric && (
        <div ref={toolPrintRef} className="space-y-3">
          <RubricRenderer rubric={rubric} />
          {!rubricSavedToBank && (
            <button onClick={handleSaveRubricToBank} className="no-print btn-secondary text-xs">
              <BookMarked size={14} /> Save rubric to Assessment Bank
            </button>
          )}
          {rubricSavedToBank && <p className="no-print text-xs text-green-400">Saved to Assessment Bank ✓</p>}
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'newsletter' && newsletter && (
        <div ref={toolPrintRef} className="space-y-3">
          <FamilyNewsletterRenderer newsletter={newsletter} />
          <ToolActions
            printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT}
            copyText={[
              newsletter.subject_line,
              newsletter.week_of ? `Week of ${newsletter.week_of}` : null,
              newsletter.what_we_learned ? `WHAT WE LEARNED\n${newsletter.what_we_learned}` : null,
              newsletter.why_it_matters ? `WHY IT MATTERS\n${newsletter.why_it_matters}` : null,
              newsletter.try_at_home?.length ? `TRY IT AT HOME\n${newsletter.try_at_home.map(t => `· ${t}`).join('\n')}` : null,
              newsletter.coming_up_next ? `COMING UP NEXT\n${newsletter.coming_up_next}` : null,
              newsletter.closing ?? null,
            ].filter(Boolean).join('\n\n')}
            onClose={() => setToolView(null)}
          />
        </div>
      )}
      {toolView === 'diff' && diffLesson && (
        <div ref={toolPrintRef} className="space-y-3">
          <DifferentiatedLessonRenderer differentiation={diffLesson} />
          <ToolActions
            printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT}
            copyText={Object.entries(diffLesson).map(([, p]) => [
              `── ${p.label ?? 'Differentiation'} ──`,
              p.warm_up ? `Warm-up\n${p.warm_up}` : null,
              p.main_activity ? `Main Activity\n${p.main_activity}` : null,
              p.materials ? `Materials\n${p.materials}` : null,
              p.assessment ? `Assessment\n${p.assessment}` : null,
              p.notes ? `Notes\n${p.notes}` : null,
            ].filter(Boolean).join('\n\n')).join('\n\n')}
            onClose={() => setToolView(null)}
          />
        </div>
      )}
      {toolView === 'exitticket' && exitTickets && (
        <div ref={toolPrintRef} className="space-y-4">
          <p className="label-eyebrow text-ink-400">Exit Tickets — 3 formats</p>
          {exitTickets.map((et, i) => (
            <div key={i} className="card p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="label-eyebrow text-ink-500">{et.format}</span>
                <span className="font-semibold text-ink-50">{et.title}</span>
              </div>
              <p className="text-sm text-ink-700">{et.question}</p>
              {et.instructions && <p className="text-xs text-ink-500 italic">{et.instructions}</p>}
            </div>
          ))}
          <ToolActions
            printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT}
            copyText={['EXIT TICKETS', ...exitTickets.map(et =>
              [
                `${et.format.toUpperCase()} — ${et.title}`,
                et.question,
                et.instructions ? `Instructions: ${et.instructions}` : null,
              ].filter(Boolean).join('\n')
            )].join('\n\n')}
            onClose={() => setToolView(null)}
          />
        </div>
      )}
      {toolView === 'cross' && crossConnections && (
        <div ref={toolPrintRef} className="space-y-3">
          <p className="label-eyebrow text-ink-400">Cross-Curricular Connections</p>
          {crossConnections.map((c, i) => (
            <div key={i} className="card p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="label-eyebrow text-ink-500">{c.subject}</span>
                <code className="text-xs bg-ink-900 px-1.5 py-0.5 rounded text-ink-300">{c.standard_code}</code>
              </div>
              <p className="text-xs text-ink-600">{c.standard_text}</p>
              <p className="text-sm text-ink-700">{c.connection_description}</p>
            </div>
          ))}
          <ToolActions
            printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT}
            copyText={['CROSS-CURRICULAR CONNECTIONS', ...crossConnections.map(c =>
              `${c.subject} — ${c.standard_code}\n${c.standard_text}\n${c.connection_description}`
            )].join('\n\n')}
            onClose={() => setToolView(null)}
          />
        </div>
      )}
      {toolView === 'warmup' && warmupOptions && (
        <div ref={toolPrintRef} className="space-y-3">
          <p className="label-eyebrow text-ink-400">Warm-Up Options</p>
          {warmupOptions.map((w, i) => (
            <div key={i} className="card p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-50">{w.title}</span>
                <span className="text-xs text-ink-500">{w.duration_mins} min</span>
              </div>
              <p className="text-sm text-ink-700">{w.description}</p>
              {w.equipment_needed?.length > 0 && (
                <p className="text-xs text-ink-600">Equipment: {w.equipment_needed.join(', ')}</p>
              )}
            </div>
          ))}
          <ToolActions
            printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT}
            copyText={['WARM-UP OPTIONS', ...warmupOptions.map(w =>
              [
                `${w.title} (${w.duration_mins} min)`,
                w.description,
                w.equipment_needed?.length ? `Equipment: ${w.equipment_needed.join(', ')}` : null,
              ].filter(Boolean).join('\n')
            )].join('\n\n')}
            onClose={() => setToolView(null)}
          />
        </div>
      )}
      {toolView === 'progress' && progressNote && (
        <div ref={toolPrintRef} className="card p-5 space-y-3">
          <p className="label-eyebrow text-ink-400">IEP Progress Note</p>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{progressNote}</p>
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} copyText={progressNote} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'behavior' && behaviorNote && (
        <div ref={toolPrintRef} className="card p-5 space-y-3">
          <p className="label-eyebrow text-ink-400">Behavior Management Note</p>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{behaviorNote}</p>
          <ToolActions printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT} copyText={behaviorNote} onClose={() => setToolView(null)} />
        </div>
      )}
      {toolView === 'conference' && conferencePrep && (
        <div ref={toolPrintRef} className="card p-5 space-y-4">
          <p className="label-eyebrow text-ink-400">Conference Prep</p>
          {conferencePrep.opening_statement && <p className="text-sm text-ink-700"><strong>Opening:</strong> {conferencePrep.opening_statement}</p>}
          {conferencePrep.strengths?.length > 0 && (
            <div><p className="text-xs font-semibold text-ink-500 mb-1">Strengths</p>
              <ul className="space-y-0.5">{conferencePrep.strengths.map((s,i) => <li key={i} className="text-sm text-ink-700 flex gap-2"><span>·</span>{s}</li>)}</ul>
            </div>
          )}
          {conferencePrep.concerns?.length > 0 && (
            <div><p className="text-xs font-semibold text-ink-500 mb-1">Concerns</p>
              <ul className="space-y-0.5">{conferencePrep.concerns.map((s,i) => <li key={i} className="text-sm text-ink-700 flex gap-2"><span>·</span>{s}</li>)}</ul>
            </div>
          )}
          {conferencePrep.specific_examples?.length > 0 && (
            <div><p className="text-xs font-semibold text-ink-500 mb-1">Specific Examples</p>
              <ul className="space-y-0.5">{conferencePrep.specific_examples.map((s,i) => <li key={i} className="text-sm text-ink-700 flex gap-2"><span>·</span>{s}</li>)}</ul>
            </div>
          )}
          {conferencePrep.next_steps?.length > 0 && (
            <div><p className="text-xs font-semibold text-ink-500 mb-1">Next Steps</p>
              <ul className="space-y-0.5">{conferencePrep.next_steps.map((s,i) => <li key={i} className="text-sm text-ink-700 flex gap-2"><span>·</span>{s}</li>)}</ul>
            </div>
          )}
          {conferencePrep.closing_statement && <p className="text-sm text-ink-700"><strong>Closing:</strong> {conferencePrep.closing_statement}</p>}
          <ToolActions
            printRef={toolPrintRef} printWatermark={isPaid ? null : WATERMARK_TEXT}
            copyText={[
              conferencePrep.opening_statement ? `Opening:\n${conferencePrep.opening_statement}` : null,
              conferencePrep.strengths?.length ? `Strengths:\n${conferencePrep.strengths.map(s => `· ${s}`).join('\n')}` : null,
              conferencePrep.concerns?.length ? `Concerns:\n${conferencePrep.concerns.map(s => `· ${s}`).join('\n')}` : null,
              conferencePrep.specific_examples?.length ? `Specific Examples:\n${conferencePrep.specific_examples.map(s => `· ${s}`).join('\n')}` : null,
              conferencePrep.next_steps?.length ? `Next Steps:\n${conferencePrep.next_steps.map(s => `· ${s}`).join('\n')}` : null,
              conferencePrep.closing_statement ? `Closing:\n${conferencePrep.closing_statement}` : null,
            ].filter(Boolean).join('\n\n')}
            onClose={() => { setConferencePrep(null); setToolView(null) }}
          />
        </div>
      )}

      {/* Inline forms */}
      {showProgressForm && (
        <form onSubmit={handleGenerateProgress} className="card p-5 space-y-3">
          <p className="label-eyebrow text-ink-400">IEP Progress Note</p>
          {[
            { key: 'studentName', label: 'Student name', placeholder: 'First name or initials' },
            { key: 'iepGoal', label: 'IEP goal', placeholder: 'Describe the specific IEP goal…' },
            { key: 'observationNotes', label: 'Observation notes', placeholder: 'What did you observe this week?' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
              <textarea rows={2} value={progressForm[key]} onChange={e => setProgressForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="input-field resize-none" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Goal category</label>
              <select value={progressForm.goalCategory} onChange={e => setProgressForm(f => ({ ...f, goalCategory: e.target.value }))} className="input-field">
                {['participation', 'skill_acquisition', 'behavior', 'communication', 'independence'].map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1">Performance level</label>
              <select value={progressForm.performanceLevel} onChange={e => setProgressForm(f => ({ ...f, performanceLevel: e.target.value }))} className="input-field">
                {['emerging', 'approaching', 'meeting', 'exceeding'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={generatingProgress} className="btn-primary">
            {generatingProgress ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />} Generate note
          </button>
        </form>
      )}

      {showBehaviorForm && (
        <form onSubmit={handleGenerateBehavior} className="card p-5 space-y-3">
          <p className="label-eyebrow text-ink-400">Behavior Management Note</p>
          {[
            { key: 'studentName', label: 'Student name', placeholder: 'First name or initials' },
            { key: 'gradeLevel', label: 'Grade level', placeholder: 'e.g. 4' },
            { key: 'incidentDescription', label: 'Incident description', placeholder: 'Describe what happened objectively…' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
              <textarea rows={key === 'incidentDescription' ? 3 : 1} value={behaviorForm[key]} onChange={e => setBehaviorForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="input-field resize-none" />
            </div>
          ))}
          <button type="submit" disabled={generatingBehavior} className="btn-primary">
            {generatingBehavior ? <Loader2 size={14} className="animate-spin" /> : <FileWarning size={14} />} Generate note
          </button>
        </form>
      )}

      {showConferenceForm && (
        <form onSubmit={handleGenerateConference} className="card p-5 space-y-3">
          <p className="label-eyebrow text-ink-400">Parent Conference Prep</p>
          {[
            { key: 'studentName', label: 'Student name', placeholder: 'First name or initials' },
            { key: 'gradeBand', label: 'Grade band', placeholder: 'e.g. 3-5' },
            { key: 'strengths', label: 'Strengths', placeholder: 'What is this student doing well?' },
            { key: 'areasOfConcern', label: 'Areas of concern', placeholder: 'What needs to improve?' },
            { key: 'goals', label: 'Goals to discuss', placeholder: 'What goals will you set together?' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
              <textarea rows={2} value={conferenceForm[key]} onChange={e => setConferenceForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="input-field resize-none" />
            </div>
          ))}
          <button type="submit" disabled={generatingConference} className="btn-primary">
            {generatingConference ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />} Generate prep
          </button>
        </form>
      )}

      {showWorksheetForm && (
        <form onSubmit={handleGenerateWorksheet} className="card p-5 space-y-3">
          <p className="label-eyebrow text-ink-400">Worksheet — choose format(s)</p>
          <div className="flex flex-wrap gap-2">
            {WORKSHEET_FORMAT_OPTIONS.map(({ key, label }) => {
              const on = worksheetFormats.includes(key)
              return (
                <button type="button" key={key}
                  onClick={() => setWorksheetFormats(fs => on ? fs.filter(k => k !== key) : [...fs, key])}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${on ? 'border-teal-500 bg-teal-500/15 text-teal-400' : 'border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-200'}`}>
                  {label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-ink-500">Independent-practice materials built from this lesson's vocabulary & concepts. A format that doesn't fit the content is noted instead of forced.</p>
          <button type="submit" disabled={generatingWorksheet} className="btn-primary">
            {generatingWorksheet ? <Loader2 size={14} className="animate-spin" /> : <PencilRuler size={14} />} Generate worksheet
          </button>
        </form>
      )}

      {/* Poster modal */}
      {showPoster && hasPoster && (
        <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-black/75 px-4 py-6">
          <div className="flex w-full max-w-[816px] items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-semibold text-white">Lesson Poster</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPoster}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
              >
                <Printer size={15} />
                Print
              </button>
              <button
                onClick={handleDownloadPoster}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
              >
                <Download size={15} />
                Download PDF
              </button>
              <button
                onClick={() => setShowPoster(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
              >
                <X size={15} />
                Close
              </button>
            </div>
          </div>
          <div className="w-full max-w-[816px] rounded-lg overflow-hidden shadow-2xl shrink-0">
            <PosterRenderer ref={posterSvgRef} posterContent={lo.poster_content} />
          </div>
        </div>
      )}
    </div>
  )
}

function ToolActions({ copyText, onClose, printRef, printWatermark, docxTitle }) {
  const { requestExport, isPaid, openPaywall } = useTrial()
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState(null) // { type:'error'|'success', msg }
  function flashNotice(type, msg) {
    setNotice({ type, msg })
    if (type === 'success') setTimeout(() => setNotice(null), 4000)
  }
  function handleCopy() {
    navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  // With a printRef, print ONLY that artifact in an isolated window (the tool
  // outputs live in a print:hidden panel, so a plain window.print() would print
  // the underlying lesson instead). Without one, fall back to the page print.
  async function handlePrint() {
    if (!(await requestExport())) return
    if (printRef?.current) {
      if (printArtifact(printRef.current, printWatermark) === false)
        flashNotice('error', 'Your browser blocked the print window. Allow pop-ups for this site and try again.')
    } else window.print()
  }
  // Word (.docx) — PAID ONLY, built from this artifact's rendered content.
  async function handleDocx() {
    if (!isPaid) { openPaywall('docx-export'); return }
    if (!printRef?.current) return
    setNotice(null)
    try {
      await requestDocx({ filename: docxTitle || 'plansk12-export', title: docxTitle, blocks: domToBlocks(printRef.current) })
      flashNotice('success', 'Word document downloaded.')
    } catch (err) {
      if (err.status === 403) openPaywall('docx-export')
      else flashNotice('error', err.message ?? 'Word download failed — please try again.')
    }
  }
  return (
    <>
    <div className="no-print flex gap-2 border-t border-ink-900 pt-3 mt-1">
      {copyText !== undefined && (
        <button onClick={handleCopy} className="no-print btn-secondary text-xs">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
      <button onClick={handlePrint} className="no-print btn-secondary text-xs">
        <Printer size={13} /> Print
      </button>
      {printRef && (
        <button onClick={handleDocx} className="no-print btn-secondary text-xs" title={isPaid ? 'Download as an editable Word document' : 'Upgrade to download as an editable Word document'}>
          {isPaid ? <FileDown size={13} /> : <Lock size={13} />} Word
        </button>
      )}
      <button onClick={onClose} className="no-print btn-secondary text-xs">
        <X size={13} /> Close
      </button>
    </div>
    {notice && (
      <p role="status" aria-live="polite"
         className={`no-print mt-2 text-xs ${notice.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
        {notice.msg}
      </p>
    )}
    </>
  )
}
