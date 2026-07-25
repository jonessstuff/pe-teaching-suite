import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, X, Check } from 'lucide-react'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function truncate(text, max) {
  if (!text) return ''
  const flat = String(text).replace(/\s+/g, ' ').trim()
  return flat.length <= max ? flat : flat.slice(0, max).trimEnd() + '…'
}

function DayCard({ lesson, dayName, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    title: lesson.title || '',
    warm_up: lesson.warm_up || '',
    fitness_activities: lesson.fitness_activities || lesson.whole_group_instruction || '',
    closure: lesson.closure || '',
  })

  const firstGrade = (lesson.grade_bands ?? [])[0]
  const objective = lesson.learning_targets?.[firstGrade] ?? ''
  const mainActivity = lesson.fitness_activities || lesson.whole_group_instruction || ''
  const materials = (lesson.equipment_needed ?? []).slice(0, 6)

  function handleSave() {
    const updated = {
      ...lesson,
      title: draft.title,
      warm_up: draft.warm_up,
      fitness_activities: draft.fitness_activities,
      closure: draft.closure,
    }
    onUpdate?.(updated)
    setEditing(false)
  }

  function handleCancel() {
    setDraft({
      title: lesson.title || '',
      warm_up: lesson.warm_up || '',
      fitness_activities: lesson.fitness_activities || lesson.whole_group_instruction || '',
      closure: lesson.closure || '',
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-ink-900 p-4 print:hidden">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-500">
          {dayName} — editing
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Title</label>
            <input
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-amber-500"
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Warm-up</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-amber-500 resize-none"
              value={draft.warm_up}
              onChange={(e) => setDraft((p) => ({ ...p, warm_up: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Main activity</label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-amber-500 resize-none"
              value={draft.fitness_activities}
              onChange={(e) => setDraft((p) => ({ ...p, fitness_activities: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-400">Closure</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-ink-50 outline-none focus:border-amber-500 resize-none"
              value={draft.closure}
              onChange={(e) => setDraft((p) => ({ ...p, closure: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-400"
          >
            <Check size={14} /> Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-700 px-3 py-1.5 text-sm font-medium text-ink-200 hover:bg-ink-600"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative rounded-lg border border-ink-800 p-4 print:rounded print:border-gray-400 print:break-inside-avoid">
      {onUpdate && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute right-2 top-2 hidden rounded p-1 text-ink-500 hover:bg-ink-700 hover:text-ink-200 group-hover:flex print:hidden"
          aria-label="Edit day"
        >
          <Pencil size={13} />
        </button>
      )}

      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-500 print:text-gray-500">
        {dayName}
      </p>
      <p className="font-semibold text-ink-50 leading-snug print:text-black">
        {lesson.title || dayName}
      </p>

      {objective && (
        <p className="mt-2 text-sm text-ink-300 print:text-gray-800">
          <span className="font-medium text-ink-400 print:text-gray-500">Objective: </span>
          {truncate(objective, 200)}
        </p>
      )}

      {lesson.warm_up && (
        <p className="mt-1.5 text-sm text-ink-300 print:text-gray-800">
          <span className="font-medium text-ink-400 print:text-gray-500">Warm-up: </span>
          {truncate(lesson.warm_up, 160)}
        </p>
      )}

      {mainActivity && (
        <p className="mt-1.5 text-sm text-ink-300 print:text-gray-800">
          <span className="font-medium text-ink-400 print:text-gray-500">Main activity: </span>
          {truncate(mainActivity, 220)}
        </p>
      )}

      {lesson.closure && (
        <p className="mt-1.5 text-sm text-ink-300 print:text-gray-800">
          <span className="font-medium text-ink-400 print:text-gray-500">Closure: </span>
          {truncate(lesson.closure, 140)}
        </p>
      )}

      {materials.length > 0 && (
        <p className="mt-2 border-t border-ink-800 pt-2 text-sm text-ink-400 print:border-gray-300 print:text-gray-600">
          <span className="font-medium">Materials: </span>
          {materials.join(' · ')}
        </p>
      )}
    </div>
  )
}

export default function SubBinderRenderer({
  binder,
  subject,
  weekCount,
  classSize,
  duration,
  state,
  routines,
  emergencyNotes,
  onUpdateDay,
  previewWeeks = null,
  previewBanner = null,
}) {
  const [localBinder, setLocalBinder] = useState(binder)
  const [expandedWeeks, setExpandedWeeks] = useState(() => binder.map(() => true))

  function toggleWeek(i) {
    setExpandedWeeks((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  function handleUpdateDay(weekIdx, dayIdx, updatedLesson) {
    const next = localBinder.map((wk, wi) =>
      wi !== weekIdx ? wk : wk.map((d, di) => (di !== dayIdx ? d : updatedLesson))
    )
    setLocalBinder(next)
    onUpdateDay?.(weekIdx, dayIdx, updatedLesson)
  }

  return (
    <div className="space-y-10">
      {/* ── Binder header ─────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-ink-700 p-6 print:border-gray-400">
        <h1 className="text-xl font-bold text-ink-50 print:text-black">
          Long-Term Substitute Binder
        </h1>
        <p className="mt-0.5 text-sm text-ink-400 print:text-gray-600">
          {subject} &nbsp;·&nbsp; {weekCount} week{weekCount !== 1 ? 's' : ''} &nbsp;·&nbsp;{' '}
          {classSize} students &nbsp;·&nbsp; {duration} min &nbsp;·&nbsp; {state}
        </p>

        {routines && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-ink-200 print:text-black">
              Key Routines &amp; Expectations
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-300 print:text-gray-800">
              {routines}
            </p>
          </div>
        )}

        {emergencyNotes && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 print:border-gray-400 print:bg-gray-100">
            <p className="text-sm font-semibold text-ink-100 print:text-black">
              Important Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-100 print:text-gray-800">
              {emergencyNotes}
            </p>
          </div>
        )}
      </div>

      {/* ── Weeks ─────────────────────────────────────────────────────────────── */}
      {(previewWeeks != null ? localBinder.slice(0, previewWeeks) : localBinder).map((weekDays, wi) => {
        const isOpen = expandedWeeks[wi]
        return (
          <div key={wi} className={wi > 0 ? 'print:break-before-page' : ''}>
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-ink-50 print:rounded print:border print:border-gray-400 print:bg-transparent print:text-black">
                Week {wi + 1} of {localBinder.length}
              </span>
              <button
                type="button"
                onClick={() => toggleWeek(wi)}
                className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-200 print:hidden"
              >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {isOpen ? 'Collapse' : 'Expand'}
              </button>
            </div>

            <div
              className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:block print:space-y-4 ${
                isOpen ? '' : 'hidden print:block'
              }`}
            >
              {weekDays.map((lesson, di) => (
                <DayCard
                  key={di}
                  lesson={lesson}
                  dayName={DAY_NAMES[di]}
                  onUpdate={onUpdateDay ? (updated) => handleUpdateDay(wi, di, updated) : undefined}
                />
              ))}
            </div>
          </div>
        )
      })}

      {previewWeeks != null && localBinder.length > previewWeeks && previewBanner}
    </div>
  )
}
