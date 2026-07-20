import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, X, Check, ShieldAlert } from 'lucide-react'
import { listStudents, createStudent, updateStudent, deleteStudent } from '../services/studentsService'
import { listPeriods } from '../services/classPeriodsService'
import { gradeLabel } from '../types/lessonObject'

const GRADE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const ACCOMMODATION_TYPES = ['None', 'IEP', '504', 'ELL', 'Other']

const BADGE_STYLES = {
  IEP: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  '504': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ELL: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Other: 'bg-ink-600/60 text-ink-300 border border-ink-600',
}

const BLANK_FORM = {
  name_or_initials: '',
  grade: '',
  class_period_id: '',
  accommodation_type: 'None',
  accommodation_notes: '',
}

export default function Students() {
  const [students, setStudents] = useState(null)
  const [periods, setPeriods] = useState([])
  const [error, setError] = useState(null)
  const [formMode, setFormMode] = useState(null) // null | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch((err) => setError(err.message))
    listPeriods()
      .then(setPeriods)
      .catch(() => setPeriods([]))
  }, [])

  function openAdd() {
    setForm(BLANK_FORM)
    setEditingId(null)
    setFormMode('add')
    setFormError(null)
  }

  function openEdit(student) {
    setForm({
      name_or_initials: student.name_or_initials,
      grade: student.grade != null ? String(student.grade) : '',
      class_period_id: student.class_period_id ?? '',
      accommodation_type: student.accommodation_type ?? 'None',
      accommodation_notes: student.accommodation_notes ?? '',
    })
    setEditingId(student.id)
    setFormMode('edit')
    setFormError(null)
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name_or_initials: form.name_or_initials.trim(),
        grade: form.grade !== '' ? Number(form.grade) : null,
        class_period_id: form.class_period_id || null,
        accommodation_type: form.accommodation_type || 'None',
        accommodation_notes: form.accommodation_notes.trim() || null,
      }
      if (formMode === 'add') {
        const created = await createStudent(payload)
        setStudents((prev) => [...(prev ?? []), created].sort((a, b) =>
          a.name_or_initials.localeCompare(b.name_or_initials)
        ))
      } else {
        const updated = await updateStudent(editingId, payload)
        setStudents((prev) =>
          prev
            .map((s) => (s.id === editingId ? updated : s))
            .sort((a, b) => a.name_or_initials.localeCompare(b.name_or_initials))
        )
      }
      closeForm()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this student profile?')) return
    try {
      await deleteStudent(id)
      setStudents((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  function periodName(periodId) {
    return periods.find((p) => p.id === periodId)?.label ?? null
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-eyebrow mb-2">Accommodations</p>
          <h1 className="text-2xl font-semibold">My Students</h1>
          <p className="mt-1 text-sm text-ink-500">
            IEP/504 profiles — accommodations are automatically included when you generate a lesson for that class period.
          </p>
        </div>
        {formMode === null && (
          <button onClick={openAdd} className="btn-primary shrink-0">
            <Plus size={16} />
            Add student
          </button>
        )}
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <p className="text-sm text-amber-400">
          Use initials or nicknames only. Do not store diagnoses, evaluation data, or legally protected health information here. This is a planning reference tool only.
        </p>
      </div>

      {error && (
        <div className="card border-red-500/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {formMode !== null && (
        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <h2 className="text-sm font-semibold text-ink-200">
            {formMode === 'add' ? 'New student profile' : 'Edit student profile'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name or initials">
              <input
                className="input-field"
                placeholder="J.S. or Jordan"
                value={form.name_or_initials}
                onChange={(e) => setForm((p) => ({ ...p, name_or_initials: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="Grade">
              <select
                className="input-field"
                value={form.grade}
                onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
              >
                <option value="">Select grade…</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g === 0 ? 'Kindergarten' : `Grade ${g}`}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Class period (optional)">
            <select
              className="input-field"
              value={form.class_period_id}
              onChange={(e) => setForm((p) => ({ ...p, class_period_id: e.target.value }))}
            >
              <option value="">No period assigned</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}{p.room_label ? ` · ${p.room_label}` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Accommodation type">
            <select
              className="input-field"
              value={form.accommodation_type}
              onChange={(e) => setForm((p) => ({ ...p, accommodation_type: e.target.value }))}
            >
              {ACCOMMODATION_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'None' ? 'None / No accommodation' : t}</option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Accommodation notes"
            hint="Extended time, preferential seating, modified equipment, behavior plans, etc."
          >
            <textarea
              className="input-field min-h-[100px]"
              placeholder="e.g. Extended time on written tasks, preferential seating near teacher, modified grip for fine motor challenges."
              value={form.accommodation_notes}
              onChange={(e) => setForm((p) => ({ ...p, accommodation_notes: e.target.value }))}
            />
          </FormField>

          {formError && (
            <p className="text-sm text-red-400">{formError}</p>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {formMode === 'add' ? 'Save student' : 'Save changes'}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary">
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>
      )}

      {students === null && !error && (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      )}

      {students !== null && students.length === 0 && formMode === null && (
        <div className="card p-8 text-center">
          <p className="text-ink-500">No student profiles yet.</p>
          <p className="mt-1 text-sm text-ink-600">
            Add IEP/504 students and their accommodations will be woven into lesson generation automatically.
          </p>
          <button onClick={openAdd} className="btn-primary mt-4 inline-flex">
            <Plus size={16} />
            Add your first student
          </button>
        </div>
      )}

      {students !== null && students.length > 0 && (
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className={`card px-5 py-4 ${
                editingId === student.id ? 'ring-1 ring-accent-500/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink-100">{student.name_or_initials}</p>
                    {student.accommodation_type && student.accommodation_type !== 'None' && (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${BADGE_STYLES[student.accommodation_type] ?? BADGE_STYLES.Other}`}>
                        {student.accommodation_type}
                      </span>
                    )}
                    {student.grade != null && (
                      <span className="text-xs text-ink-500">
                        Grade {gradeLabel(student.grade)}
                      </span>
                    )}
                    {student.class_period_id && periodName(student.class_period_id) && (
                      <span className="text-xs text-ink-500">
                        · {periodName(student.class_period_id)}
                      </span>
                    )}
                  </div>
                  {student.accommodation_notes && (
                    <p className="mt-1 text-sm text-ink-400 line-clamp-2">
                      {student.accommodation_notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(student)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-100"
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-accent-400"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}
