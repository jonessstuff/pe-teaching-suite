import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarRange, ChevronUp, ChevronDown, Pencil, Trash2,
  Plus, Loader2, Check, X, Sparkles, ArrowRight,
} from 'lucide-react'
import { SUBJECT_AREAS, gradeLabel } from '../types/lessonObject'
import { getProfile } from '../services/profilesService'
import { generateYearPlan } from '../services/generationService'
import {
  getActiveYearPlan,
  createYearPlan,
  bulkAddUnits,
  addUnit,
  updateUnit,
  deleteUnit,
  reorderUnits,
} from '../services/yearPlanService'
import { US_STATES } from '../constants/usStates'
import { useTrial } from '../context/TrialContext'
import { TRIAL_HORIZON_WEEKS } from '../services/trialService'

const GRADE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const SUBJECT_STYLES = {
  'PE':           'bg-accent-500/15 text-accent-400',
  'Health':       'bg-blue-500/15 text-blue-400',
  'Family Life':  'bg-violet-500/15 text-violet-400',
  "Driver's Ed":  'bg-amber-500/15 text-amber-400',
}

function subjectStyle(s) {
  return SUBJECT_STYLES[s] ?? 'bg-ink-700 text-ink-300'
}

function monthName(n) {
  return n ? MONTH_NAMES[Number(n)] ?? '' : ''
}

function emptyUnitForm() {
  return { subject: 'PE', unit_name: '', estimated_weeks: 2, start_month: '', end_month: '', notes: '', standards_covered: [] }
}

const VERIFY_SUFFIX = ' (verify against official standards)'

function StandardsChips({ codes }) {
  if (!codes || codes.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {codes.map((code, i) => {
        const needsVerify = code.includes('(verify')
        const display = needsVerify ? code.replace(VERIFY_SUFFIX, '') : code
        return (
          <span
            key={i}
            title={needsVerify ? 'Verify against official standards before use' : undefined}
            className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] leading-none ${
              needsVerify
                ? 'border border-dashed border-ink-600 text-ink-500'
                : 'bg-ink-800 text-ink-300'
            }`}
          >
            {display}{needsVerify ? ' ?' : ''}
          </span>
        )
      })}
    </div>
  )
}

function totalWeeksOf(units) {
  return (units ?? []).reduce((s, u) => s + Number(u.estimated_weeks || 0), 0)
}

export default function CurriculumMap() {
  const navigate = useNavigate()
  const { isTrial, isExpired } = useTrial()
  const gated = isTrial || isExpired // trial/expired: limited to a 4-week planning horizon
  const [plan, setPlan] = useState(null)
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)

  // Generation form
  const [showGenForm, setShowGenForm] = useState(false)
  const [genSubjects, setGenSubjects] = useState(['PE'])
  const [genGradeBand, setGenGradeBand] = useState(6)
  const [genState, setGenState] = useState('')
  const [planName, setPlanName] = useState('2026–2027 School Year')
  const [totalWeeks, setTotalWeeks] = useState(36)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)

  // Review-before-save
  const [pendingUnits, setPendingUnits] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Saved unit editing
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  // Add unit inline
  const [addingUnit, setAddingUnit] = useState(false)
  const [addForm, setAddForm] = useState(emptyUnitForm())
  const [addSaving, setAddSaving] = useState(false)

  useEffect(() => {
    loadPlan()
    getProfile()
      .then((p) => { if (p?.state) setGenState(p.state) })
      .catch(() => {})
  }, [])

  async function loadPlan() {
    setLoadStatus('loading')
    setLoadError(null)
    try {
      setPlan(await getActiveYearPlan())
    } catch (err) {
      setLoadError(err.message ?? 'Failed to load year plan.')
    } finally {
      setLoadStatus('ready')
    }
  }

  // ── Subject toggle ───────────────────────────────────────
  function toggleSubject(s) {
    setGenSubjects((prev) =>
      prev.includes(s)
        ? prev.length > 1 ? prev.filter((x) => x !== s) : prev
        : [...prev, s]
    )
  }

  // ── Generation ──────────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault()
    setGenerating(true)
    setGenError(null)
    try {
      const result = await generateYearPlan({
        subjects: genSubjects,
        gradeBand: genGradeBand,
        state: genState,
        totalWeeks: gated
          ? Math.min(Number(totalWeeks), TRIAL_HORIZON_WEEKS)
          : Number(totalWeeks),
      })
      setPendingUnits(result.units ?? [])
      setShowGenForm(false)
    } catch (err) {
      setGenError(err.message ?? 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Pending unit mutations (local, pre-save) ─────────────
  function updatePendingUnit(idx, changes) {
    setPendingUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, ...changes } : u)))
  }

  function deletePendingUnit(idx) {
    setPendingUnits((prev) => prev.filter((_, i) => i !== idx))
  }

  function movePendingUnit(idx, dir) {
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= pendingUnits.length) return
    setPendingUnits((prev) => {
      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  async function handleAcceptPlan() {
    setSaving(true)
    setSaveError(null)
    try {
      const newPlan = await createYearPlan(planName)
      await bulkAddUnits(newPlan.id, pendingUnits)
      await loadPlan()
      setPendingUnits(null)
    } catch (err) {
      setSaveError(err.message ?? 'Failed to save plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Saved unit mutations ────────────────────────────────
  function startEdit(unit) {
    setEditingId(unit.id)
    setEditForm({
      unit_name: unit.unit_name,
      subject: unit.subject,
      estimated_weeks: unit.estimated_weeks,
      start_month: unit.start_month ?? '',
      end_month: unit.end_month ?? '',
      notes: unit.notes ?? '',
    })
  }

  async function handleSaveEdit() {
    setEditSaving(true)
    try {
      const updated = await updateUnit(editingId, {
        unit_name: editForm.unit_name,
        subject: editForm.subject,
        estimated_weeks: Number(editForm.estimated_weeks),
        start_month: editForm.start_month ? Number(editForm.start_month) : null,
        end_month: editForm.end_month ? Number(editForm.end_month) : null,
        notes: editForm.notes || null,
      })
      setPlan((prev) => ({
        ...prev,
        units: prev.units.map((u) => (u.id === editingId ? updated : u)),
      }))
      setEditingId(null)
    } catch {
      // leave edit form open
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteUnit(unitId) {
    try {
      await deleteUnit(unitId)
      setPlan((prev) => ({ ...prev, units: prev.units.filter((u) => u.id !== unitId) }))
      if (editingId === unitId) setEditingId(null)
    } catch { /* ignore */ }
  }

  async function handleMoveUnit(unitId, dir) {
    const units = plan.units
    const idx = units.findIndex((u) => u.id === unitId)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= units.length) return
    const newUnits = [...units]
    ;[newUnits[idx], newUnits[swapIdx]] = [newUnits[swapIdx], newUnits[idx]]
    setPlan((prev) => ({ ...prev, units: newUnits }))
    try {
      await reorderUnits(plan.id, newUnits.map((u) => u.id))
    } catch {
      setPlan((prev) => ({ ...prev, units }))
    }
  }

  async function handleAddUnit(e) {
    e.preventDefault()
    if (!addForm.unit_name.trim()) return
    setAddSaving(true)
    try {
      const added = await addUnit(plan.id, {
        subject: addForm.subject,
        unit_name: addForm.unit_name.trim(),
        estimated_weeks: Number(addForm.estimated_weeks),
        start_month: addForm.start_month ? Number(addForm.start_month) : null,
        end_month: addForm.end_month ? Number(addForm.end_month) : null,
        notes: addForm.notes || null,
      })
      setPlan((prev) => ({ ...prev, units: [...prev.units, added] }))
      setAddForm(emptyUnitForm())
      setAddingUnit(false)
    } catch { /* leave form open */ }
    finally { setAddSaving(false) }
  }

  // ── Render ──────────────────────────────────────────────
  if (loadStatus === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-400 pt-8">
        <Loader2 size={16} className="animate-spin" />
        Loading…
      </div>
    )
  }

  if (loadError) {
    return <div className="card border-red-500/30 p-4 text-sm text-red-400">{loadError}</div>
  }

  // ── Review state (generated, not yet saved) ──────────────
  if (pendingUnits !== null) {
    const pendingTotal = totalWeeksOf(pendingUnits)
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <p className="label-eyebrow mb-2">Year Plan</p>
          <h1 className="text-2xl font-semibold mb-1">Review your suggested plan</h1>
          <p className="text-sm text-ink-400">
            Edit any unit before saving. Reorder with the arrows, add or remove units as
            needed. When you&rsquo;re happy, click <strong className="text-ink-200">Save plan</strong>.
          </p>
        </div>

        <WeekTally current={pendingTotal} target={Number(totalWeeks)} />

        <div className="space-y-2">
          {pendingUnits.map((u, idx) => (
            <PendingUnitRow
              key={idx}
              unit={u}
              isFirst={idx === 0}
              isLast={idx === pendingUnits.length - 1}
              onChange={(changes) => updatePendingUnit(idx, changes)}
              onMoveUp={() => movePendingUnit(idx, 'up')}
              onMoveDown={() => movePendingUnit(idx, 'down')}
              onDelete={() => deletePendingUnit(idx)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setPendingUnits((prev) => [
              ...prev,
              { subject: 'PE', unit_name: '', estimated_weeks: 2, notes: null },
            ])
          }
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-400 hover:text-accent-300"
        >
          <Plus size={14} />
          Add unit
        </button>

        {saveError && <p className="text-sm text-red-400">{saveError}</p>}

        <div className="flex flex-wrap gap-3 border-t border-ink-900 pt-6">
          <button
            type="button"
            onClick={handleAcceptPlan}
            disabled={saving || !pendingUnits.some((u) => u.unit_name?.trim())}
            className="btn-primary"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save plan
          </button>
          <button
            type="button"
            onClick={() => { setPendingUnits(null); setShowGenForm(true) }}
            disabled={saving}
            className="btn-secondary"
          >
            Discard &amp; regenerate
          </button>
        </div>
      </div>
    )
  }

  // ── Generation form ──────────────────────────────────────
  if (showGenForm) {
    return (
      <div className="max-w-xl space-y-6">
        <div>
          <p className="label-eyebrow mb-2">Year Plan</p>
          <h1 className="text-2xl font-semibold mb-1">Generate a year plan</h1>
          <p className="text-sm text-ink-400">
            We&rsquo;ll suggest a full-year sequence of units across your selected subjects.
            You can edit everything before saving.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          <FormField label="Plan name">
            <input
              className="input-field"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
            />
          </FormField>

          <FormField
            label="Subjects to include"
            hint="Health, Family Life, and Driver's Ed will be woven in as shorter units throughout the PE schedule."
          >
            <div className="flex flex-wrap gap-2">
              {SUBJECT_AREAS.filter((s) => s !== 'Library/Media' && s !== 'Art' && s !== 'Music' && s !== 'Adaptive PE' && s !== 'STEM' && s !== 'CTE').map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubject(s)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    genSubjects.includes(s)
                      ? 'bg-accent-500 text-white'
                      : 'bg-ink-700 text-ink-200 hover:bg-ink-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Grade band">
              <select
                className="input-field"
                value={genGradeBand}
                onChange={(e) => setGenGradeBand(Number(e.target.value))}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{gradeLabel(g)}</option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Total school weeks"
              hint={gated ? `Free trial is limited to ${TRIAL_HORIZON_WEEKS} weeks. Upgrade to plan a full year.` : undefined}
            >
              <input
                type="number"
                min={gated ? 1 : 10}
                max={gated ? TRIAL_HORIZON_WEEKS : 52}
                className="input-field"
                value={gated ? Math.min(Number(totalWeeks) || 0, TRIAL_HORIZON_WEEKS) : totalWeeks}
                onChange={(e) => setTotalWeeks(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="State" hint="Helps align units to state standards context.">
            <select
              className="input-field"
              value={genState}
              onChange={(e) => setGenState(e.target.value)}
            >
              <option value="">Select a state…</option>
              {US_STATES.map((s) => (
                <option key={s.abbr} value={s.abbr}>{s.name}</option>
              ))}
            </select>
          </FormField>

          {genError && <p className="text-sm text-red-400">{genError}</p>}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" className="btn-primary" disabled={generating}>
              {generating
                ? <><Loader2 size={15} className="animate-spin" />Generating…</>
                : <><Sparkles size={15} />Generate year plan</>
              }
            </button>
            <button
              type="button"
              onClick={() => setShowGenForm(false)}
              className="text-sm text-ink-400 hover:text-ink-200"
            >
              Cancel
            </button>
          </div>

          {generating && (
            <p className="text-sm text-ink-400">
              Building your year plan — this usually takes 20–30 seconds.
            </p>
          )}
        </form>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────
  if (!plan) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <p className="label-eyebrow mb-2">Year Plan</p>
          <h1 className="text-2xl font-semibold">Curriculum Map</h1>
        </div>
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-700 text-ink-400">
            <CalendarRange size={22} />
          </div>
          <div className="space-y-1.5">
            <p className="font-medium text-ink-100">No year plan yet</p>
            <p className="text-sm text-ink-400 max-w-sm">
              Generate a suggested full-year unit sequence across your subjects,
              then edit and save it as your curriculum map.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGenForm(true)}
            className="btn-primary mt-2"
          >
            <Sparkles size={15} />
            Generate a year plan
          </button>
        </div>
      </div>
    )
  }

  // ── Active plan view ─────────────────────────────────────
  const savedTotal = totalWeeksOf(plan.units)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow mb-2">Year Plan</p>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowGenForm(true)}
          className="btn-secondary shrink-0"
        >
          <Sparkles size={14} />
          Regenerate
        </button>
      </div>

      <WeekTally current={savedTotal} target={null} />

      <div className="space-y-2">
        {plan.units.map((unit, idx) =>
          editingId === unit.id ? (
            <UnitEditForm
              key={unit.id}
              form={editForm}
              onChange={(changes) => setEditForm((prev) => ({ ...prev, ...changes }))}
              onSave={handleSaveEdit}
              onCancel={() => setEditingId(null)}
              saving={editSaving}
            />
          ) : (
            <UnitRow
              key={unit.id}
              unit={unit}
              isFirst={idx === 0}
              isLast={idx === plan.units.length - 1}
              onMoveUp={() => handleMoveUnit(unit.id, 'up')}
              onMoveDown={() => handleMoveUnit(unit.id, 'down')}
              onEdit={() => startEdit(unit)}
              onDelete={() => handleDeleteUnit(unit.id)}
              onGenerate={() => navigate('/generate', { state: { subject: unit.subject, unit: unit.unit_name } })}
            />
          )
        )}
      </div>

      {addingUnit ? (
        <form onSubmit={handleAddUnit} className="card p-4 space-y-4">
          <p className="text-sm font-semibold text-ink-100">New unit</p>
          <UnitFormFields
            form={addForm}
            onChange={(changes) => setAddForm((prev) => ({ ...prev, ...changes }))}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn-primary"
              disabled={addSaving || !addForm.unit_name.trim()}
            >
              {addSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Add unit
            </button>
            <button
              type="button"
              onClick={() => { setAddingUnit(false); setAddForm(emptyUnitForm()) }}
              className="text-sm text-ink-400 hover:text-ink-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingUnit(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-400 hover:text-accent-300"
        >
          <Plus size={14} />
          Add unit
        </button>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────

function WeekTally({ current, target }) {
  const over = target !== null && current > target
  const under = target !== null && current < target
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`font-semibold ${over ? 'text-red-400' : under ? 'text-amber-400' : 'text-ink-200'}`}>
        {current} week{current !== 1 ? 's' : ''} planned
      </span>
      {target !== null && <span className="text-ink-500">of {target} total</span>}
      {over && <span className="text-xs text-red-400">({current - target} over)</span>}
      {under && <span className="text-xs text-amber-400">({target - current} remaining)</span>}
    </div>
  )
}

function UnitRow({ unit, isFirst, isLast, onMoveUp, onMoveDown, onEdit, onDelete, onGenerate }) {
  const sm = monthName(unit.start_month)
  const em = monthName(unit.end_month)
  const months = sm && em ? `${sm} – ${em}` : sm || em || null

  return (
    <div className="card flex items-start gap-3 px-4 py-3">
      <div className="flex flex-col shrink-0 mt-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-ink-600 hover:text-ink-300 disabled:opacity-20"
          aria-label="Move unit up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="text-ink-600 hover:text-ink-300 disabled:opacity-20"
          aria-label="Move unit down"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${subjectStyle(unit.subject)}`}>
            {unit.subject}
          </span>
          <span className="font-medium text-ink-100 text-sm">{unit.unit_name}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-500">
          <span>{unit.estimated_weeks} week{unit.estimated_weeks !== 1 ? 's' : ''}</span>
          {months && <span>{months}</span>}
          {unit.notes && <span className="italic">{unit.notes}</span>}
        </div>
        <StandardsChips codes={unit.standards_covered} />
        <button
          type="button"
          onClick={onGenerate}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300"
        >
          Generate lessons
          <ArrowRight size={11} />
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded text-ink-500 hover:text-ink-200 hover:bg-ink-800"
          aria-label="Edit unit"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded text-ink-500 hover:text-red-400 hover:bg-ink-800"
          aria-label="Delete unit"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function UnitEditForm({ form, onChange, onSave, onCancel, saving }) {
  return (
    <div className="card border-ink-700 p-4 space-y-4">
      <UnitFormFields form={form} onChange={onChange} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.unit_name.trim()}
          className="btn-primary"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-ink-400 hover:text-ink-200">
          Cancel
        </button>
      </div>
    </div>
  )
}

function PendingUnitRow({ unit, isFirst, isLast, onChange, onMoveUp, onMoveDown, onDelete }) {
  return (
    <div className="card flex items-start gap-3 px-4 py-3 border-ink-700">
      <div className="flex flex-col shrink-0 mt-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-ink-600 hover:text-ink-300 disabled:opacity-20"
          aria-label="Move up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="text-ink-600 hover:text-ink-300 disabled:opacity-20"
          aria-label="Move down"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="input-field w-auto text-xs py-1"
            value={unit.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
          >
            {SUBJECT_AREAS.filter((s) => s !== 'Library/Media' && s !== 'Art' && s !== 'Music' && s !== 'Adaptive PE' && s !== 'STEM' && s !== 'CTE').map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            className="input-field flex-1 min-w-[10rem] text-sm"
            placeholder="Unit name"
            value={unit.unit_name}
            onChange={(e) => onChange({ unit_name: e.target.value })}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              min={1}
              max={20}
              className="input-field w-14 text-sm text-center"
              value={unit.estimated_weeks}
              onChange={(e) => onChange({ estimated_weeks: Number(e.target.value) })}
            />
            <span className="text-xs text-ink-400">wks</span>
          </div>
        </div>
        {unit.notes && (
          <p className="text-xs text-ink-500 italic">{unit.notes}</p>
        )}
        <StandardsChips codes={unit.standards_covered} />
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-600 hover:text-red-400 hover:bg-ink-800"
        aria-label="Remove unit"
      >
        <X size={13} />
      </button>
    </div>
  )
}

function UnitFormFields({ form, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Unit name">
          <input
            className="input-field"
            placeholder="e.g. Invasion Games"
            value={form.unit_name}
            onChange={(e) => onChange({ unit_name: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Subject">
          <select
            className="input-field"
            value={form.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
          >
            {SUBJECT_AREAS.filter((s) => s !== 'Library/Media' && s !== 'Art' && s !== 'Music' && s !== 'Adaptive PE' && s !== 'STEM' && s !== 'CTE').map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Estimated weeks">
          <input
            type="number"
            min={1}
            max={20}
            className="input-field"
            value={form.estimated_weeks}
            onChange={(e) => onChange({ estimated_weeks: e.target.value })}
          />
        </FormField>
        <FormField label="Start month">
          <select
            className="input-field"
            value={form.start_month}
            onChange={(e) => onChange({ start_month: e.target.value })}
          >
            <option value="">—</option>
            {MONTH_NAMES.slice(1).map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </FormField>
        <FormField label="End month">
          <select
            className="input-field"
            value={form.end_month}
            onChange={(e) => onChange({ end_month: e.target.value })}
          >
            <option value="">—</option>
            {MONTH_NAMES.slice(1).map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Notes (optional)">
        <input
          className="input-field"
          placeholder="e.g. outdoor unit, weather-dependent"
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </FormField>
    </div>
  )
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-200">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}
