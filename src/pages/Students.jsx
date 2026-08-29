import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Loader2, X, Check, ShieldAlert, ClipboardPaste, Upload, Users2, ClipboardCheck } from 'lucide-react'
import { listStudents, createStudent, createStudents, updateStudent, deleteStudent } from '../services/studentsService'
import { listPeriods } from '../services/classPeriodsService'
import { gradeLabel } from '../types/lessonObject'
import { parseRosterCsv } from '../lib/rosterImport'

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

  // Bulk-paste roster
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkPeriod, setBulkPeriod] = useState('')
  const [bulkGrade, setBulkGrade] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkError, setBulkError] = useState(null)
  const [csvRows, setCsvRows] = useState(null)
  const [csvFileName, setCsvFileName] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch((err) => setError(err.message))
    listPeriods()
      .then((data) => {
        setPeriods(data)
        setSelectedPeriod((current) => current || data[0]?.id || 'all')
      })
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

  // Parse the pasted list: one name per line, trimmed, de-duped within the paste
  // AND against names already in the chosen period.
  const bulkParsed = useMemo(() => {
    const pastedRows = bulkText.split('\n').map((l) => ({ name: l.trim(), grade: null })).filter((r) => r.name)
    const incoming = csvRows ?? pastedRows
    const seen = new Set()
    const unique = []
    for (const row of incoming) {
      const k = row.name.toLowerCase()
      if (!seen.has(k)) { seen.add(k); unique.push(row) }
    }
    const inPeriod = new Set(
      (students ?? [])
        .filter((s) => s.class_period_id === bulkPeriod)
        .map((s) => (s.name_or_initials ?? '').trim().toLowerCase()),
    )
    const toAdd = unique.filter((row) => !inPeriod.has(row.name.toLowerCase()))
    return {
      pasted: incoming.length,
      toAdd,
      dupInPaste: incoming.length - unique.length,
      dupInPeriod: unique.length - toAdd.length,
    }
  }, [bulkText, csvRows, students, bulkPeriod])

  function openBulk() {
    setBulkOpen(true)
    setBulkError(null)
    setBulkPeriod((cur) => cur || periods[0]?.id || '')
  }
  function closeBulk() {
    setBulkOpen(false)
    setBulkText('')
    setCsvRows(null)
    setCsvFileName('')
    setBulkGrade('')
    setBulkError(null)
  }

  async function handleBulkAdd(e) {
    e.preventDefault()
    if (!bulkPeriod) { setBulkError('Pick a class period for the batch.'); return }
    if (bulkParsed.toAdd.length === 0) { setBulkError('No new names to add.'); return }
    setBulkSaving(true)
    setBulkError(null)
    try {
      const rows = bulkParsed.toAdd.map((row) => ({
        name_or_initials: row.name,
        grade: row.grade ?? (bulkGrade !== '' ? Number(bulkGrade) : null),
        class_period_id: bulkPeriod,
        accommodation_type: 'None',
        accommodation_notes: null,
      }))
      const created = await createStudents(rows)
      setStudents((prev) =>
        [...(prev ?? []), ...created].sort((a, b) => a.name_or_initials.localeCompare(b.name_or_initials)),
      )
      closeBulk()
    } catch (err) {
      setBulkError(err.message)
    } finally {
      setBulkSaving(false)
    }
  }

  async function handleCsvFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBulkError(null)
    try {
      const parsed = parseRosterCsv(await file.text())
      if (!parsed.rows.length) throw new Error('No student names were found in that CSV.')
      setCsvRows(parsed.rows)
      setCsvFileName(file.name)
      setBulkText('')
    } catch (err) {
      setCsvRows(null)
      setCsvFileName('')
      setBulkError(err.message ?? 'Could not read that CSV file.')
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

  const visibleStudents = selectedPeriod === 'all'
    ? (students ?? [])
    : (students ?? []).filter((student) => student.class_period_id === selectedPeriod)

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-eyebrow mb-2">PE tools</p>
          <h1 className="text-2xl font-semibold">My Classes &amp; Rosters</h1>
          <p className="mt-1 text-sm text-ink-500">
            Enter each roster once. The same classes appear in Participation, the Run Tracker, and future PE tools.
          </p>
        </div>
        {formMode === null && !bulkOpen && (
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
            <button onClick={openBulk} className="btn-secondary">
              <ClipboardPaste size={16} />
              Import roster
            </button>
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16} />
              Add student
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/schedule" className="card flex items-center gap-3 p-4 transition-colors hover:border-accent-500/40">
          <Users2 size={20} className="text-accent-600" />
          <div><p className="font-medium text-ink-100">Manage classes</p><p className="text-xs text-ink-500">Names, periods, and schedules</p></div>
        </Link>
        <Link to="/participation" className="card flex items-center gap-3 p-4 transition-colors hover:border-accent-500/40">
          <ClipboardCheck size={20} className="text-accent-600" />
          <div><p className="font-medium text-ink-100">Participation</p><p className="text-xs text-ink-500">Uses these rosters automatically</p></div>
        </Link>
        <div className="card flex items-center gap-3 p-4 opacity-75">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/15 text-xs font-bold text-accent-600">½</span>
          <div><p className="font-medium text-ink-100">Run Tracker</p><p className="text-xs text-ink-500">Coming next · uses these rosters</p></div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <p className="text-sm text-amber-400">
          Follow your school’s student-data policy. Do not enter diagnoses, medical details, or other sensitive records in roster notes.
        </p>
      </div>

      {error && (
        <div className="card border-red-500/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {bulkOpen && (
        <form onSubmit={handleBulkAdd} className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div><h2 className="font-semibold text-ink-100">Import a roster</h2><p className="text-xs text-ink-500">Paste names or upload a CSV. Review the count before adding.</p></div>
            <button type="button" onClick={closeBulk} className="text-ink-500 hover:text-ink-200"><X size={18} /></button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-300">Class period</label>
              <select value={bulkPeriod} onChange={(e) => setBulkPeriod(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-white px-3 py-2 text-sm text-ink-50 dark:bg-ink-800">
                <option value="">Select…</option>
                {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-300">Grade for batch (optional)</label>
              <select value={bulkGrade} onChange={(e) => setBulkGrade(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-white px-3 py-2 text-sm text-ink-50 dark:bg-ink-800">
                <option value="">—</option>
                {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-ink-300">Copy and paste — one name per line</label>
              <label className="btn-secondary cursor-pointer text-xs">
                <Upload size={14} /> Upload CSV
                <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} className="sr-only" />
              </label>
            </div>
            <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={8}
              placeholder={'Smith, John\nJohn D.\nA.K.\n…'}
              disabled={Boolean(csvRows)}
              className="w-full rounded-lg border border-ink-700 bg-white px-3 py-2 font-mono text-sm text-ink-50 disabled:opacity-50 dark:bg-ink-800" />
            {csvRows ? <p className="mt-1.5 text-xs text-emerald-600">{csvFileName}: {csvRows.length} name{csvRows.length === 1 ? '' : 's'} found. <button type="button" className="underline" onClick={() => { setCsvRows(null); setCsvFileName('') }}>Remove CSV</button></p>
              : <p className="mt-1.5 text-xs text-ink-500">Works with copied spreadsheet columns and names formatted as First Last or Last, First.</p>}
          </div>

          {(bulkText.trim() || csvRows) && (
            <div className="rounded-lg border border-ink-800 bg-ink-950 px-3 py-2 text-sm text-ink-300">
              <span className="font-semibold text-ink-100">{bulkParsed.toAdd.length}</span> to add
              {bulkParsed.dupInPeriod > 0 && <span className="text-ink-500"> · {bulkParsed.dupInPeriod} already in this period (skipped)</span>}
              {bulkParsed.dupInPaste > 0 && <span className="text-ink-500"> · {bulkParsed.dupInPaste} duplicate line{bulkParsed.dupInPaste > 1 ? 's' : ''} skipped</span>}
            </div>
          )}

          {bulkError && <p className="text-sm text-red-400">{bulkError}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={bulkSaving || bulkParsed.toAdd.length === 0 || !bulkPeriod} className="btn-primary disabled:opacity-50">
              {bulkSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Add {bulkParsed.toAdd.length || ''} student{bulkParsed.toAdd.length === 1 ? '' : 's'}
            </button>
            <button type="button" onClick={closeBulk} className="btn-secondary">Cancel</button>
          </div>
        </form>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-medium text-ink-300" htmlFor="roster-class-filter">View roster</label>
            <select id="roster-class-filter" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="input-field sm:max-w-xs">
              <option value="all">All classes ({students.length})</option>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.label} ({students.filter((student) => student.class_period_id === period.id).length})</option>)}
            </select>
          </div>
          {visibleStudents.length === 0 && <div className="card p-6 text-center text-sm text-ink-500">No students are assigned to this class yet. Use <span className="font-medium text-ink-200">Import roster</span> to add them.</div>}
          {visibleStudents.map((student) => (
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
