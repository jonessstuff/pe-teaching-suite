
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Printer, ChevronLeft, ChevronRight, Copy, Pencil, Check, X, Share2, Tag, Plus } from 'lucide-react'
import { getLesson, listLessons, updateLesson, deleteLesson, deleteUnit, duplicateLesson, updateTags } from '../services/lessonsService'
import { createShare, getShare, deleteShare } from '../services/sharingService'
import PlanBookRenderer from '../components/renderers/PlanBookRenderer'
import AdaptivePERenderer from '../components/renderers/AdaptivePERenderer'
import CtePlanRenderer from '../components/renderers/CtePlanRenderer'
import SecondaryToolsPanel from '../components/lesson/SecondaryToolsPanel'
import { useTrial } from '../context/TrialContext'

export default function LessonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      navigate(`/lessons/${copy.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleShare() {
    try {
      const share = shareToken ? { share_token: shareToken } : await createShare(id)
      setShareToken(share.share_token)
      setShowShare(true)
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
      navigate('/lessons')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteUnit() {
    if (!window.confirm('Delete this entire unit and all its lessons? This cannot be undone.')) return
    try {
      await deleteUnit(lesson.unit_id)
      navigate('/lessons')
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
  const isCTE = lo?.subject === 'CTE'

  const currentIndex = unitLessons.findIndex((l) => l.id === id)
  const prevLesson = currentIndex > 0 ? unitLessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < unitLessons.length - 1 ? unitLessons[currentIndex + 1] : null

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link to="/lessons" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-50">
          <ArrowLeft size={16} />
          Back to library
        </Link>

        <div className="flex flex-wrap items-center gap-2">
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
          <p className="text-xs text-ink-500">Anyone with the link can view this lesson — no account required.</p>
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
            onClick={() => prevLesson && navigate(`/lessons/${prevLesson.id}`)}
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
            onClick={() => nextLesson && navigate(`/lessons/${nextLesson.id}`)}
            disabled={!nextLesson}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-ink-50 disabled:opacity-30 disabled:hover:text-ink-400"
          >
            {nextLesson ? `Day ${nextLesson.lesson_object?.unit_day_number}` : 'Next'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {!isAPE && (
        <SecondaryToolsPanel savedId={id} lessonObject={lo} subject={lesson.subject} />
      )}

      {isAPE ? (
        <AdaptivePERenderer lesson={lo} />
      ) : editingContent ? (
        <LessonEditForm
          form={contentForm}
          onChange={handleContentChange}
          onSave={handleSaveContent}
          onCancel={() => setEditingContent(false)}
          saving={savingContent}
        />
      ) : isCTE ? (
        <CtePlanRenderer
          lesson={{
            ...lo,
            scheduled_date: lesson.scheduled_date,
            period_label: lesson.period_label,
          }}
        />
      ) : (
        <PlanBookRenderer
          lesson={{
            ...lo,
            scheduled_date: lesson.scheduled_date,
            period_label: lesson.period_label,
          }}
        />
      )}
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
