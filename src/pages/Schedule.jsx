import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'
import { listPeriods, createPeriod, updatePeriod, deletePeriod } from '../services/classPeriodsService'
import { SUBJECT_AREAS, gradeLabel } from '../types/lessonObject'

const GRADE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const BLANK_FORM = {
  label: '',
  subject: 'PE',
  grade_bands: [],
  class_size: 28,
  duration_minutes: 45,
  room_label: '',
}

export default function Schedule() {
  const [periods, setPeriods] = useState(null)
  const [error, setError] = useState(null)
  const [formMode, setFormMode] = useState(null) // null | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    listPeriods()
      .then(setPeriods)
      .catch((err) => setError(err.message))
  }, [])

  function openAdd() {
    setForm(BLANK_FORM)
    setEditingId(null)
    setFormMode('add')
    setFormError(null)
  }

  function openEdit(period) {
    setForm({
      label: period.label,
      subject: period.subject,
      grade_bands: period.grade_bands ?? [],
      class_size: period.class_size,
      duration_minutes: period.duration_minutes,
      room_label: period.room_label ?? '',
    })
    setEditingId(period.id)
    setFormMode('edit')
    setFormError(null)
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setFormError(null)
  }

  function toggleGrade(grade) {
    setForm((prev) => ({
      ...prev,
      grade_bands: prev.grade_bands.includes(grade)
        ? prev.grade_bands.filter((g) => g !== grade)
        : [...prev.grade_bands, grade].sort((a, b) => a - b),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        ...form,
        class_size: Number(form.class_size),
        duration_minutes: Number(form.duration_minutes),
      }
      if (formMode === 'add') {
        const created = await createPeriod(payload)
        setPeriods((prev) => [...(prev ?? []), created])
      } else {
        const updated = await updatePeriod(editingId, payload)
        setPeriods((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      }
      closeForm()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this class period?')) return
    try {
      await deletePeriod(id)
      setPeriods((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-eyebrow mb-2">Schedule</p>
          <h1 className="text-2xl font-semibold">My Schedule</h1>
        </div>
        {formMode === null && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} />
            Add period
          </button>
        )}
      </div>

      {error && (
        <div className="card border-red-500/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {formMode !== null && (
        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <h2 className="text-sm font-semibold text-ink-200">
            {formMode === 'add' ? 'New class period' : 'Edit class period'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Period name">
              <input
                className="input-field"
                placeholder="Period 1"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                required
              />
            </FormField>
            <FormField label="Room (optional)">
              <input
                className="input-field"
                placeholder="Gym A"
                value={form.room_label}
                onChange={(e) => setForm((p) => ({ ...p, room_label: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Subject">
            <div className="flex flex-wrap gap-2">
              {SUBJECT_AREAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, subject: s }))}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    form.subject === s
                      ? 'bg-accent-500 text-white'
                      : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Grade bands">
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
                    form.grade_bands.includes(g)
                      ? 'bg-accent-500 text-white'
                      : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                  }`}
                >
                  {gradeLabel(g)}
                </button>
              ))}
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Class size">
              <input
                type="number"
                min={1}
                className="input-field"
                value={form.class_size}
                onChange={(e) => setForm((p) => ({ ...p, class_size: e.target.value }))}
              />
            </FormField>
            <FormField label="Duration (minutes)">
              <input
                type="number"
                min={5}
                step={5}
                className="input-field"
                value={form.duration_minutes}
                onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
              />
            </FormField>
          </div>

          {formError && (
            <p className="text-sm text-red-400">{formError}</p>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {formMode === 'add' ? 'Save period' : 'Save changes'}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary">
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>
      )}

      {periods === null && !error && (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      )}

      {periods !== null && periods.length === 0 && formMode === null && (
        <div className="card p-8 text-center">
          <p className="text-ink-500">No class periods yet.</p>
          <button onClick={openAdd} className="btn-primary mt-4 inline-flex">
            <Plus size={16} />
            Add your first period
          </button>
        </div>
      )}

      {periods !== null && periods.length > 0 && (
        <div className="space-y-3">
          {periods.map((period) => (
            <div
              key={period.id}
              className={`card flex items-center justify-between gap-4 px-5 py-4 ${
                editingId === period.id ? 'ring-1 ring-accent-500/40' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-ink-100 truncate">{period.label}</p>
                <p className="text-sm text-ink-400">
                  {period.subject} · {(period.grade_bands ?? []).map(gradeLabel).join('/')} ·{' '}
                  {period.class_size} students · {period.duration_minutes} min
                  {period.room_label ? ` · ${period.room_label}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEdit(period)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-100"
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(period.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-accent-400"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}</label>
      {children}
    </div>
  )
}
