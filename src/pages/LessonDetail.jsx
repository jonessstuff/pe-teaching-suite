
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Printer, ChevronLeft, ChevronRight, Copy, Pencil, Check, X, Share2, Tag, Plus, Play, FileSliders, Save } from 'lucide-react'
import { getLesson, listLessons, updateLesson, deleteLesson, deleteUnit, duplicateLesson, updateTags } from '../services/lessonsService'
import { createShare, getShare, deleteShare } from '../services/sharingService'
import { track } from '../lib/analytics'
import AdaptivePERenderer from '../components/renderers/AdaptivePERenderer'
import LessonBody, { cleanLessonForDisplay } from '../components/lesson/lessonBodyRenderers'
import LessonPrintFix from '../components/LessonPrintFix'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'
import { useTrial } from '../context/TrialContext'
import TeachMode from '../components/lesson/TeachMode'
import TeachingView from '../components/lesson/TeachingView'
import { SPECIALTY_CONTEXTS } from '../constants/moduleHomes'
import PersonalPlanRenderer, { RequirementCheck } from '../components/lesson/PersonalPlanRenderer'
import { recommendInstructionalPractices, recommendMtssGoals } from '../lib/personalPlanContent'
import { getDefaultLessonPlanFormat, getLessonPlanFormatValues, saveLessonPlanFormatValues } from '../services/lessonPlanFormatService'

export default function LessonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { requestExport } = useTrial()
  const [lesson, setLesson] = useState(null)
  const [unitLessons, setUnitLessons] = useState([])
  const [error, setError] = useState(null)
  const [editingMeta, setEditingMeta] = useState(false)
  const [metaForm, setMetaForm] = useState({ scheduled_date: '', period_label: '' })
  const [savingMeta, setSavingMeta] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [contentForm, setContentForm] = useState({})
  const [savingContent, setSavingContent] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareToken, setShareToken] = useState(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [showTeachMode, setShowTeachMode] = useState(searchParams.get('teach') === '1')
  const [lessonView, setLessonView] = useState('quick')
  const [personalFormat, setPersonalFormat] = useState(null)
  const [formatValues, setFormatValues] = useState({ mtss_goal_numbers: [], mtss_notes: '', instructional_practice_ids: [] })
  const [savingFormatValues, setSavingFormatValues] = useState(false)
  const [formatNotice, setFormatNotice] = useState('')
  const [showAllMtssGoals, setShowAllMtssGoals] = useState(false)
  const [showAllInstructionalPractices, setShowAllInstructionalPractices] = useState(false)
  const moduleContext = searchParams.get('module')
  const moduleConfig = Object.values(SPECIALTY_CONTEXTS).find((config) =>
    config.moduleLabel === moduleContext || config.title === moduleContext
  )
  const libraryPath = moduleContext
    ? moduleConfig?.browsePath ?? `/lessons?module=${encodeURIComponent(moduleContext)}`
    : '/lessons'
  const lessonPath = (lessonId) => `/lessons/${lessonId}${moduleContext ? `?module=${encodeURIComponent(moduleContext)}` : ''}`

  function closeTeachMode() {
    setShowTeachMode(false)
    if (searchParams.has('teach')) {
      const next = new URLSearchParams(searchParams)
      next.delete('teach')
      setSearchParams(next, { replace: true })
    }
  }

  useEffect(() => {
    getLesson(id)
      .then((l) => {
        setLesson(l)
        setTags(l.tags ?? [])
        if (l.unit_id) {
          listLessons({ unitId: l.unit_id }).then((days) => {
            const sorted = [...days].sort((a, b) =>
              (a.lesson_object?.unit_day_number ?? 0) - (b.lesson_object?.unit_day_number ?? 0)
            )
            setUnitLessons(sorted)
          })
        }
        getShare(id).then(share => { if (share) setShareToken(share.share_token) }).catch(() => {})
      })
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(() => {
    if (!lesson) return undefined
    let active = true
    getDefaultLessonPlanFormat().then(async (format) => {
      if (!active || !format) return
      setPersonalFormat(format)
      setLessonView('personal')
      const values = await getLessonPlanFormatValues(id, format.id)
      if (!active) return
      if (values) {
        setFormatValues({
          mtss_goal_numbers: values.mtss_goal_numbers ?? [],
          mtss_notes: values.mtss_notes ?? '',
          instructional_practice_ids: values.instructional_practice_ids ?? [],
        })
        return
      }
      const recommended = recommendMtssGoals(lesson.lesson_object, format.mtss_goal_bank ?? [])
      const recommendedPractices = recommendInstructionalPractices(lesson.lesson_object, format.instructional_practice_bank ?? [])
      if (!recommended.length && !recommendedPractices.length) return
      const automaticValues = { mtss_goal_numbers: recommended, mtss_notes: '', instructional_practice_ids: recommendedPractices }
      const saved = await saveLessonPlanFormatValues(id, format.id, automaticValues)
      if (!active) return
      setFormatValues({
        mtss_goal_numbers: saved.mtss_goal_numbers ?? recommended,
        mtss_notes: saved.mtss_notes ?? '',
        instructional_practice_ids: saved.instructional_practice_ids ?? recommendedPractices,
      })
      const matches = [
        recommended.length ? `${recommended.length} numbered MTSS goals` : '',
        recommendedPractices.length ? `${recommendedPractices.length} instructional practices` : '',
      ].filter(Boolean).join(' and ')
      setFormatNotice(`PlansK12 automatically matched ${matches} to this lesson. You can change them anytime.`)
    }).catch(() => {
      // A personal format is optional; standard lesson views still work.
    })
    return () => { active = false }
  }, [id, lesson])

  function toggleMtssGoal(number) {
    setFormatValues((current) => ({ ...current, mtss_goal_numbers: current.mtss_goal_numbers.includes(number) ? current.mtss_goal_numbers.filter((value) => value !== number) : [...current.mtss_goal_numbers, number] }))
    setFormatNotice('')
  }

  function toggleInstructionalPractice(practiceId) {
    setFormatValues((current) => ({
      ...current,
      instructional_practice_ids: current.instructional_practice_ids.includes(practiceId)
        ? current.instructional_practice_ids.filter((value) => value !== practiceId)
        : [...current.instructional_practice_ids, practiceId],
    }))
    setFormatNotice('')
  }

  async function saveFormatSelections() {
    if (!personalFormat) return
    setSavingFormatValues(true)
    try {
      const saved = await saveLessonPlanFormatValues(id, personalFormat.id, formatValues)
      setFormatValues({
        mtss_goal_numbers: saved.mtss_goal_numbers ?? [],
        mtss_notes: saved.mtss_notes ?? '',
        instructional_practice_ids: saved.instructional_practice_ids ?? [],
      })
      setFormatNotice('Instructional practices and MTSS choices saved to this lesson.')
    } catch (err) {
      setError(err.message || 'The school-format selections could not be saved.')
    } finally {
      setSavingFormatValues(false)
    }
  }

  function openContentEdit() {
    const lo = lesson.lesson_object
    setContentForm({
      title: lo?.title ?? '',
      warm_up: lo?.warm_up ?? '',
      fitness_activities: lo?.fitness_activities ?? '',
      whole_group_instruction: lo?.whole_group_instruction ?? '',
      independent_practice: lo?.independent_practice ?? '',
      closure: lo?.closure ?? '',
      location: lo?.location ?? '',
      equipment_needed: (lo?.equipment_needed ?? []).join(', '),
      known_vocabulary: (lo?.known_vocabulary ?? []).join(', '),
      new_vocabulary: (lo?.new_vocabulary ?? []).join(', '),
    })
    setEditingContent(true)
  }

  function handleContentChange(field, value) {
    setContentForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSaveContent() {
    setSavingContent(true)
    try {
      const splitList = (str) => str.split(',').map((s) => s.trim()).filter(Boolean)
      const updated = await updateLesson(id, {
        lessonObject: {
          ...contentForm,
          equipment_needed: splitList(contentForm.equipment_needed),
          known_vocabulary: splitList(contentForm.known_vocabulary),
          new_vocabulary: splitList(contentForm.new_vocabulary),
        },
      })
      setLesson(updated)
      setEditingContent(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingContent(false)
    }
  }

  async function handleDuplicateLesson() {
    try {
      const copy = await duplicateLesson(id)
      navigate(lessonPath(copy.id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleShare() {
    try {
      const isNewShare = !shareToken
      const share = shareToken ? { share_token: shareToken } : await createShare(id)
      setShareToken(share.share_token)
      setShowShare(true)
      // Only count creating a share link as an export (not re-opening the panel).
      if (isNewShare) track('lesson_exported', { format: 'share' })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRevokeShare() {
    try {
      const share = await getShare(id)
      if (share) await deleteShare(share.id)
      setShareToken(null)
      setShowShare(false)
    } catch (err) {
      setError(err.message)
    }
  }

  function copyShareLink() {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${shareToken}`)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  async function handleAddTag() {
    const trimmed = tagInput.trim()
    if (!trimmed || tags.includes(trimmed)) { setTagInput(''); return }
    const next = [...tags, trimmed]
    setTags(next)
    setTagInput('')
    try { await updateTags(id, next) } catch (err) { setError(err.message) }
  }

  async function handleRemoveTag(tag) {
    const next = tags.filter(t => t !== tag)
    setTags(next)
    try { await updateTags(id, next) } catch (err) { setError(err.message) }
  }

  function openMetaEdit() {
    setMetaForm({
      scheduled_date: lesson.scheduled_date ?? '',
      period_label: lesson.period_label ?? '',
    })
    setEditingMeta(true)
  }

  async function handleSaveMeta() {
    setSavingMeta(true)
    try {
      const updated = await updateLesson(id, {
        meta: {
          scheduled_date: metaForm.scheduled_date || null,
          period_label: metaForm.period_label || null,
        },
      })
      setLesson(updated)
      setEditingMeta(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleDeleteLesson() {
    if (!window.confirm('Delete this lesson? This cannot be undone.')) return
    try {
      await deleteLesson(id)
      navigate(libraryPath)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteUnit() {
    if (!window.confirm('Delete this entire unit and all its lessons? This cannot be undone.')) return
    try {
      await deleteUnit(lesson.unit_id)
      navigate(libraryPath)
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) {
    return (
      <div className="card border-red-500/30 p-4 text-sm text-red-400">
        Couldn&rsquo;t load this lesson: {error}
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex items-center gap-2 text-ink-400 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading lesson…
      </div>
    )
  }

  const lo = lesson.lesson_object
  const isAPE = lo?.subject === 'Adaptive PE'
  const selectedMtssGoals = (personalFormat?.mtss_goal_bank ?? []).filter((goal) => formatValues.mtss_goal_numbers.includes(goal.number))
  const visibleMtssGoals = showAllMtssGoals || selectedMtssGoals.length === 0 ? (personalFormat?.mtss_goal_bank ?? []) : selectedMtssGoals
  const selectedInstructionalPractices = (personalFormat?.instructional_practice_bank ?? []).filter((practice) => formatValues.instructional_practice_ids.includes(practice.id))
  const visibleInstructionalPractices = showAllInstructionalPractices || selectedInstructionalPractices.length === 0
    ? (personalFormat?.instructional_practice_bank ?? [])
    : selectedInstructionalPractices

  const currentIndex = unitLessons.findIndex((l) => l.id === id)
  const prevLesson = currentIndex > 0 ? unitLessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < unitLessons.length - 1 ? unitLessons[currentIndex + 1] : null

  return (
    <div className="space-y-6">
      {showTeachMode && <TeachMode lesson={lo} onClose={closeTeachMode} />}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link to={libraryPath} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-50">
          <ArrowLeft size={16} />
          {moduleContext ? `Back to ${moduleContext} library` : 'Back to library'}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {!isAPE && <button onClick={() => setShowTeachMode(true)} className="btn-primary"><Play size={16} /> Teach now</button>}
          {!isAPE && (
            <button onClick={openContentEdit} className="btn-secondary">
              <Pencil size={16} />
              Edit lesson
            </button>
          )}

          {!lesson.unit_id && (
            <button onClick={handleDuplicateLesson} className="btn-secondary">
              <Copy size={16} />
              Duplicate
            </button>
          )}

          <button onClick={handleShare} className={showShare ? 'btn-primary' : 'btn-ghost'}>
            <Share2 size={16} />
            Share
          </button>

          <button onClick={() => setShowTags(t => !t)} className={showTags ? 'btn-primary' : 'btn-ghost'}>
            <Tag size={16} />
            Tags {tags.length > 0 ? `(${tags.length})` : ''}
          </button>

          <button onClick={openMetaEdit} className="btn-ghost">
            <Pencil size={16} />
            Edit details
          </button>
          <button onClick={async () => { if (await requestExport()) window.print() }} className="btn-ghost">
            <Printer size={16} />
            Print
          </button>

          <div className="ml-1 border-l border-ink-800 pl-3">
            {lesson.unit_id ? (
              <button onClick={handleDeleteUnit} className="btn-danger">
                Delete unit
              </button>
            ) : (
              <button onClick={handleDeleteLesson} className="btn-danger">
                Delete lesson
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline meta editor */}
      {editingMeta && (
        <div className="no-print card px-5 py-4 space-y-4">
          <h3 className="text-sm font-semibold text-ink-200">Edit lesson details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-400">Scheduled date</label>
              <input
                type="date"
                className="input-field"
                value={metaForm.scheduled_date}
                onChange={(e) => setMetaForm((p) => ({ ...p, scheduled_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-400">Period label</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Period 2"
                value={metaForm.period_label}
                onChange={(e) => setMetaForm((p) => ({ ...p, period_label: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveMeta} disabled={savingMeta} className="btn-primary">
              {savingMeta ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save
            </button>
            <button onClick={() => setEditingMeta(false)} className="btn-secondary">
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Share panel */}
      {showShare && shareToken && (
        <div className="no-print card px-5 py-4 space-y-3">
          <h3 className="text-sm font-semibold text-ink-200 flex items-center gap-2"><Share2 size={14} /> Share this lesson</h3>
          <p className="text-xs text-ink-500">Anyone with the link can view this lesson — no account required. The link expires 30 days after it's created.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-ink-300 truncate">
              {window.location.origin}/shared/{shareToken}
            </code>
            <button onClick={copyShareLink} className="btn-secondary text-xs">
              {shareCopied ? <Check size={14} /> : <Copy size={14} />} {shareCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={handleRevokeShare} className="text-xs text-red-400 hover:text-red-300">Revoke link</button>
        </div>
      )}

      {/* Tags panel */}
      {showTags && (
        <div className="no-print card px-5 py-4 space-y-3">
          <h3 className="text-sm font-semibold text-ink-200 flex items-center gap-2"><Tag size={14} /> Lesson tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-accent-500/30 bg-accent-500/10 px-2.5 py-0.5 text-xs text-accent-400">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-400 ml-0.5"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
              placeholder="Add a tag… (Enter to add)"
              className="input-field flex-1 text-sm"
            />
            <button type="button" onClick={handleAddTag} className="btn-secondary">
              <Plus size={14} />
            </button>
          </div>
          {['PE', 'Health', 'outdoor', 'indoor', 'cooperative', 'assessment', 'favorite', 'holiday'].map(suggestion => (
            !tags.includes(suggestion) && (
              <button key={suggestion} type="button" onClick={() => { setTagInput(suggestion) }} className="mr-1 rounded-full bg-ink-900 px-2.5 py-0.5 text-xs text-ink-400 hover:bg-ink-800">
                + {suggestion}
              </button>
            )
          ))}
        </div>
      )}

      {/* Unit day navigation */}
      {unitLessons.length > 1 && (
        <div className="no-print flex items-center justify-between rounded-lg bg-ink-900 px-4 py-2">
          <button
            onClick={() => prevLesson && navigate(lessonPath(prevLesson.id))}
            disabled={!prevLesson}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-ink-50 disabled:opacity-30 disabled:hover:text-ink-400"
          >
            <ChevronLeft size={16} />
            {prevLesson ? `Day ${prevLesson.lesson_object?.unit_day_number}` : 'Previous'}
          </button>

          <span className="text-sm text-ink-400">
            {lo?.unit} · Day {lo?.unit_day_number} of {lo?.unit_total_days}
          </span>

          <button
            onClick={() => nextLesson && navigate(lessonPath(nextLesson.id))}
            disabled={!nextLesson}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-ink-50 disabled:opacity-30 disabled:hover:text-ink-400"
          >
            {nextLesson ? `Day ${nextLesson.lesson_object?.unit_day_number}` : 'Next'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Print-only header (title + meta) for every module's lesson, and the
          document.title swap so the browser print header shows the lesson name.
          One insertion point for all ~30 modules — see LessonPrintFix. */}
      <LessonPrintFix lesson={lesson} />

      {isAPE ? (
        // Adaptive PE renders outside LessonBody, so apply the same display-time
        // hedge/verification-note cleanup here for parity with every other module.
        <AdaptivePERenderer lesson={cleanLessonForDisplay(lo)} />
      ) : editingContent ? (
        <LessonEditForm
          form={contentForm}
          onChange={handleContentChange}
          onSave={handleSaveContent}
          onCancel={() => setEditingContent(false)}
          saving={savingContent}
        />
      ) : (
        <div className="space-y-4">
          <div className="no-print flex flex-col gap-3 rounded-xl border border-ink-800 bg-ink-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-100">Choose how much detail you need</p>
              <p className="mt-0.5 text-xs text-ink-500">Your school format is personal to you. The original PlansK12 views always remain available.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex w-fit flex-wrap rounded-lg border border-ink-800 bg-white/60 p-1 dark:bg-ink-950/50">
              <button type="button" onClick={() => setLessonView('quick')} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${lessonView === 'quick' ? 'bg-accent-500 text-white shadow-sm' : 'text-ink-400 hover:text-ink-100'}`}>Teacher at-a-glance</button>
              <button type="button" onClick={() => setLessonView('full')} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${lessonView === 'full' ? 'bg-accent-500 text-white shadow-sm' : 'text-ink-400 hover:text-ink-100'}`}>Complete plan</button>
              {personalFormat && <button type="button" onClick={() => setLessonView('personal')} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${lessonView === 'personal' ? 'bg-teal-500 text-white shadow-sm' : 'text-ink-400 hover:text-ink-100'}`}>My school format</button>}
            </div>
            <Link to="/lesson-format" className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300"><FileSliders size={14} />{personalFormat ? 'Edit format' : 'Set up my format'}</Link>
            </div>
          </div>

          <div className={`${lessonView === 'quick' ? 'block print:block' : 'hidden print:hidden'} card p-5 sm:p-7`}>
            <TeachingView lesson={cleanLessonForDisplay(lo)} />
          </div>
          <div className={`${lessonView === 'full' ? 'block print:block' : 'hidden print:hidden'}`}>
            <LessonBody
              subject={lo?.subject}
              lesson={{
                ...lo,
                scheduled_date: lesson.scheduled_date,
                period_label: lesson.period_label,
              }}
            />
          </div>
          {personalFormat && <div className={`${lessonView === 'personal' ? 'block print:block' : 'hidden print:hidden'} space-y-4`}>
            {(personalFormat.instructional_practice_bank ?? []).length > 0 && <section className="no-print card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label-eyebrow text-violet-400">This lesson</p>
                  <h3 className="mt-1 text-lg font-black text-ink-50">Instructional practices selected automatically</h3>
                  <p className="mt-1 text-xs text-ink-500">PlansK12 compares the lesson to your separate school-approved practice bank and recommends only the strongest matches.</p>
                </div>
                <button type="button" onClick={saveFormatSelections} disabled={savingFormatValues} className="btn-primary">{savingFormatValues ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{savingFormatValues ? 'Saving…' : 'Save changes'}</button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-violet-300">{formatValues.instructional_practice_ids.length} recommended practices</p>
                <button type="button" onClick={() => setShowAllInstructionalPractices((value) => !value)} className="btn-ghost text-xs">{showAllInstructionalPractices ? 'Show recommendations only' : 'Change recommendations'}</button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{visibleInstructionalPractices.map((practice) => <label key={practice.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${formatValues.instructional_practice_ids.includes(practice.id) ? 'border-violet-500/50 bg-violet-500/10' : 'border-ink-800 bg-ink-950/30'}`}><input type="checkbox" className="mt-1" checked={formatValues.instructional_practice_ids.includes(practice.id)} onChange={() => toggleInstructionalPractice(practice.id)} /><span><span className="block text-xs font-black text-violet-400">{practice.category}</span><span className="mt-0.5 block text-sm text-ink-300">{practice.label}</span></span></label>)}</div>
            </section>}
            {(personalFormat.mtss_goal_bank ?? []).length > 0 && <section className="no-print card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-eyebrow text-blue-400">This lesson</p><h3 className="mt-1 text-lg font-black text-ink-50">MTSS goals selected automatically</h3><p className="mt-1 text-xs text-ink-500">PlansK12 matches the lesson's actual Tier 1 supports, Tier 2 intervention, and progress checks to your numbered bank.</p></div><button type="button" onClick={saveFormatSelections} disabled={savingFormatValues} className="btn-primary">{savingFormatValues ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{savingFormatValues ? 'Saving…' : 'Save changes'}</button></div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-blue-300">{formatValues.mtss_goal_numbers.length} recommended goals</p><button type="button" onClick={() => setShowAllMtssGoals((value) => !value)} className="btn-ghost text-xs">{showAllMtssGoals ? 'Show recommendations only' : 'Change recommendations'}</button></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{visibleMtssGoals.map((goal) => <label key={goal.number} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${formatValues.mtss_goal_numbers.includes(goal.number) ? 'border-blue-500/50 bg-blue-500/10' : 'border-ink-800 bg-ink-950/30'}`}><input type="checkbox" className="mt-1" checked={formatValues.mtss_goal_numbers.includes(goal.number)} onChange={() => toggleMtssGoal(goal.number)} /><span><span className="block text-xs font-black text-blue-400">{goal.tier === 'tier_2' ? 'Tier 2' : 'Tier 1'} · {goal.number}</span><span className="mt-0.5 block text-sm text-ink-300">{goal.label}</span></span></label>)}</div>
              <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-ink-300">Tier 2 evidence or progress-check note (optional)</span><textarea className="input min-h-20 w-full" value={formatValues.mtss_notes} onChange={(event) => { setFormatValues({ ...formatValues, mtss_notes: event.target.value }); setFormatNotice('') }} placeholder="Example: Students identified by the prior skill check meet in a targeted group; recheck after four practice items." /></label>
              {formatNotice && <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-400"><Check size={14} />{formatNotice}</p>}
            </section>}
            <div className="print:hidden"><RequirementCheck lesson={cleanLessonForDisplay(lo)} format={personalFormat} formatValues={formatValues} /></div>
            <PersonalPlanRenderer lesson={cleanLessonForDisplay(lo)} format={personalFormat} formatValues={formatValues} />
          </div>}
        </div>
      )}

      <SecondaryToolsPanel key={id} savedId={id} lessonObject={lo} subject={lesson.subject} />
    </div>
  )
}

function EditField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}

function LessonEditForm({ form, onChange, onSave, onCancel, saving }) {
  const ta = (field, minH = 'min-h-[100px]') => (
    <textarea
      className={`input-field ${minH}`}
      value={form[field] ?? ''}
      onChange={(e) => onChange(field, e.target.value)}
    />
  )
  const inp = (field, placeholder = '') => (
    <input
      type="text"
      className="input-field"
      placeholder={placeholder}
      value={form[field] ?? ''}
      onChange={(e) => onChange(field, e.target.value)}
    />
  )

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-8">
      <EditField label="Title">
        {inp('title')}
      </EditField>

      <section className="space-y-5">
        <h3 className="label-eyebrow border-b border-ink-900 pb-1 text-ink-400">Lesson / Instruction</h3>
        <EditField label="Warm Up">{ta('warm_up')}</EditField>
        <EditField label="Fitness Activities">{ta('fitness_activities')}</EditField>
        <EditField label="Whole Group Instruction">{ta('whole_group_instruction', 'min-h-[120px]')}</EditField>
        <EditField label="Independent Practice">{ta('independent_practice')}</EditField>
        <EditField label="Closure (Cool Down)">{ta('closure')}</EditField>
      </section>

      <section className="space-y-5">
        <h3 className="label-eyebrow border-b border-ink-900 pb-1 text-ink-400">Materials / Resources</h3>
        <EditField label="Location">{inp('location', 'e.g. Baseball field, Gym')}</EditField>
        <EditField label="Equipment needed" hint="Comma-separated list — e.g. Kickballs (8), Cones, Bases">
          {ta('equipment_needed', 'min-h-[80px]')}
        </EditField>
      </section>

      <section className="space-y-5">
        <h3 className="label-eyebrow border-b border-ink-900 pb-1 text-ink-400">Vocabulary</h3>
        <EditField label="Words they should know" hint="Comma-separated">
          {inp('known_vocabulary')}
        </EditField>
        <EditField label="Words they will learn" hint="Comma-separated">
          {inp('new_vocabulary')}
        </EditField>
      </section>

      <div className="flex gap-2 border-t border-ink-900 pt-6">
        <button onClick={onSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Save changes
        </button>
        <button onClick={onCancel} className="btn-ghost">
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  )
}
