import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ClipboardCheck, CopyPlus, FileSliders, Import, Loader2, Plus, Save, ShieldCheck, Star, Trash2, X } from 'lucide-react'
import {
  createLessonPlanFormat,
  deleteLessonPlanFormat,
  listLessonPlanFormats,
  normalizeMtssGoalNumber,
  parseMtssGoalBank,
  setDefaultLessonPlanFormat,
  starterFormat,
  updateLessonPlanFormat,
} from '../services/lessonPlanFormatService'
import { trackToolUsage } from '../services/productUsageService'

const clone = (value) => structuredClone(value)

function Preview({ format }) {
  const enabled = format.sections.filter((section) => section.enabled)
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-black/10">
    <header className="border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50 p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-teal-700">{format.name || 'My school format'}</p><h3 className="mt-1 text-xl font-black">Sample lesson plan</h3><p className="mt-1 text-xs text-slate-500">Your specialty · Grade level · Class time</p></header>
    <div className="divide-y divide-slate-200">{enabled.map((section) => <div key={section.key} className="grid gap-1 p-3 sm:grid-cols-[120px_1fr]"><p className="text-xs font-black">{section.label}{section.required && <span className="ml-1 text-teal-700">*</span>}</p><div><div className="h-2 w-full rounded bg-slate-100" /><div className="mt-1.5 h-2 w-3/4 rounded bg-slate-100" /></div></div>)}</div>
  </article>
}

export default function LessonPlanFormat() {
  const [formats, setFormats] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(starterFormat())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [goalDraft, setGoalDraft] = useState({ tier: 'tier_1', number: '', label: '' })
  const [goalError, setGoalError] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [importReport, setImportReport] = useState(null)

  useEffect(() => {
    listLessonPlanFormats().then((rows) => {
      setFormats(rows)
      if (rows[0]) { setSelectedId(rows[0].id); setDraft(clone(rows[0])) }
    }).catch((err) => setError(err.message || 'Your formats could not be loaded.')).finally(() => setLoading(false))
    void trackToolUsage('lesson-plan-format', 'opened', { moduleLabel: 'All specialties' })
  }, [])

  const selected = useMemo(() => formats.find((format) => format.id === selectedId), [formats, selectedId])

  function selectFormat(format) { setSelectedId(format.id); setDraft(clone(format)); setNotice(''); setError(''); setGoalError('') }
  function newFormat(kind = 'brief-review') { setSelectedId(null); setDraft(starterFormat(kind)); setNotice(''); setError(''); setGoalError('') }
  function updateSection(index, updates) { setDraft((current) => ({ ...current, sections: current.sections.map((section, i) => i === index ? { ...section, ...updates } : section) })) }
  function moveSection(index, direction) {
    const target = index + direction
    if (target < 0 || target >= draft.sections.length) return
    const sections = [...draft.sections]
    ;[sections[index], sections[target]] = [sections[target], sections[index]]
    setDraft({ ...draft, sections })
  }
  function addGoal() {
    const number = normalizeMtssGoalNumber(goalDraft.number)
    const label = goalDraft.label.trim()
    if (!number || !label) {
      setGoalError('Enter both the goal number and exact wording, or use “Import complete MTSS bank” above to add the whole list at once.')
      return
    }
    if ((draft.mtss_goal_bank ?? []).some((goal) => goal.number.toLowerCase() === number.toLowerCase())) {
      setGoalError(`${number} is already in your MTSS bank.`)
      return
    }
    setDraft((current) => ({ ...current, mtss_goal_bank: [...(current.mtss_goal_bank ?? []), { tier: goalDraft.tier, number, label }] }))
    setGoalDraft({ tier: goalDraft.tier, number: '', label: '' })
    setGoalError('')
  }
  function removeGoal(index) { setDraft({ ...draft, mtss_goal_bank: (draft.mtss_goal_bank ?? []).filter((_, i) => i !== index) }) }
  function importGoals() {
    const parsed = parseMtssGoalBank(bulkText)
    const existing = new Set((draft.mtss_goal_bank ?? []).map((goal) => normalizeMtssGoalNumber(goal.number)))
    const additions = parsed.goals.filter((goal) => !existing.has(normalizeMtssGoalNumber(goal.number)))
    setDraft({ ...draft, mtss_goal_bank: [...(draft.mtss_goal_bank ?? []), ...additions] })
    setImportReport({ added: additions.length, duplicates: parsed.duplicates.length + (parsed.goals.length - additions.length), incomplete: parsed.incomplete })
    setGoalError('')
    if (additions.length) setBulkText('')
  }

  async function save() {
    if (!draft.name.trim()) { setError('Give this format a name.'); return }
    setSaving(true); setError(''); setNotice('')
    try {
      const saved = selectedId ? await updateLessonPlanFormat(selectedId, draft) : await createLessonPlanFormat(draft)
      const next = selectedId ? formats.map((format) => format.id === selectedId ? saved : (saved.is_default ? { ...format, is_default: false } : format)) : [saved, ...formats.map((format) => saved.is_default ? { ...format, is_default: false } : format)]
      setFormats(next); setSelectedId(saved.id); setDraft(clone(saved)); setNotice('Format saved. New and existing lessons can use it immediately.')
      void trackToolUsage('lesson-plan-format', selectedId ? 'updated' : 'created', { moduleLabel: 'All specialties' })
    } catch (err) { setError(err.message || 'This format could not be saved.') } finally { setSaving(false) }
  }

  async function makeDefault() {
    if (!selectedId) { setDraft({ ...draft, is_default: true }); return }
    try {
      const saved = await setDefaultLessonPlanFormat(selectedId)
      setFormats(formats.map((format) => ({ ...format, is_default: format.id === selectedId })))
      setDraft({ ...draft, ...saved, is_default: true }); setNotice('This is now your default lesson format.')
    } catch (err) { setError(err.message || 'The default could not be changed.') }
  }

  async function remove() {
    if (!selectedId || !window.confirm(`Delete "${draft.name}"? Your lessons will not be deleted.`)) return
    try { await deleteLessonPlanFormat(selectedId); const next = formats.filter((format) => format.id !== selectedId); setFormats(next); if (next[0]) selectFormat(next[0]); else newFormat(); } catch (err) { setError(err.message || 'The format could not be deleted.') }
  }

  if (loading) return <div className="card p-8 text-center text-ink-400"><Loader2 size={20} className="mx-auto mb-2 animate-spin" />Loading your lesson formats…</div>

  return <div className="space-y-7">
    <section className="overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-teal-500/18 via-ink-900 to-blue-500/10 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="label-eyebrow text-teal-400">Personal to your account</p><h1 className="mt-2 text-3xl font-black text-ink-50 sm:text-4xl">My Lesson Plan Format</h1><p className="mt-3 max-w-3xl text-base leading-7 text-ink-300">Match the brief format your school expects without changing the PlansK12 plan system. Save required sections once, choose numbered MTSS goals from your own bank, and check every lesson before submitting it.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-300"><ShieldCheck size={16} />Private to you</span></div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => newFormat('brief-review')} className="btn-primary"><CopyPlus size={16} />New brief format</button><button type="button" onClick={() => newFormat('complete')} className="btn-secondary"><Plus size={16} />New detailed format</button></div>
    </section>

    {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
    {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"><Check size={16} />{notice}</div>}

    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1.25fr)_minmax(300px,.75fr)]">
      <aside className="card h-fit p-3"><p className="px-2 py-2 text-xs font-black uppercase tracking-wider text-ink-500">Saved formats</p><div className="space-y-1">{formats.map((format) => <button key={format.id} type="button" onClick={() => selectFormat(format)} className={`w-full rounded-xl p-3 text-left transition ${selectedId === format.id ? 'bg-teal-500/12 text-teal-300' : 'text-ink-300 hover:bg-ink-900'}`}><span className="flex items-center gap-2 text-sm font-bold"><FileSliders size={16} />{format.name}</span><span className="mt-1 flex items-center gap-1 pl-6 text-[11px] text-ink-500">{format.is_default && <><Star size={11} className="fill-amber-400 text-amber-400" />Default · </>}{format.detail_level}</span></button>)}{formats.length === 0 && <p className="p-3 text-sm text-ink-500">Your first format is ready to customize.</p>}</div></aside>

      <main className="card space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-eyebrow">Format editor</p><h2 className="mt-1 text-xl font-black text-ink-50">What should be visible?</h2></div>{draft.is_default && <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">Your default</span>}</div>
        <label><span className="mb-1.5 block text-xs font-bold text-ink-300">Format name</span><input className="input w-full" maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Example: GMS brief lesson plan" /></label>
        <fieldset><legend className="mb-2 text-xs font-bold text-ink-300">Level of detail</legend><div className="grid gap-2 sm:grid-cols-3">{[['brief', 'Brief', 'One concise submission-ready view'], ['standard', 'Standard', 'A little more instructional detail'], ['detailed', 'Detailed', 'All available content']].map(([value, label, help]) => <button key={value} type="button" onClick={() => setDraft({ ...draft, detail_level: value })} className={`rounded-xl border p-3 text-left ${draft.detail_level === value ? 'border-teal-500 bg-teal-500/10' : 'border-ink-800 bg-ink-950/30'}`}><span className="block text-sm font-black text-ink-100">{label}</span><span className="mt-1 block text-xs text-ink-500">{help}</span></button>)}</div></fieldset>

        <section><div className="mb-3"><h3 className="text-sm font-black text-ink-100">Sections and order</h3><p className="mt-1 text-xs text-ink-500">Show controls visibility. Required adds the section to the instant review check.</p></div><div className="divide-y divide-ink-800 rounded-xl border border-ink-800">{draft.sections.map((section, index) => <div key={section.key} className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-bold text-ink-200">{section.label}</p><p className="text-xs text-ink-500">{section.description}</p></div><div className="flex gap-3 text-xs"><label className="flex items-center gap-1.5"><input type="checkbox" checked={section.enabled} onChange={(event) => updateSection(index, { enabled: event.target.checked, required: event.target.checked ? section.required : false })} />Show</label><label className="flex items-center gap-1.5"><input type="checkbox" disabled={!section.enabled} checked={section.required} onChange={(event) => updateSection(index, { required: event.target.checked })} />Required</label></div><div className="flex gap-1"><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="rounded p-1.5 text-ink-500 hover:bg-ink-800 disabled:opacity-25" aria-label={`Move ${section.label} up`}><ArrowUp size={14} /></button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === draft.sections.length - 1} className="rounded p-1.5 text-ink-500 hover:bg-ink-800 disabled:opacity-25" aria-label={`Move ${section.label} down`}><ArrowDown size={14} /></button></div></div>)}</div></section>

        <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><ClipboardCheck size={20} className="mt-0.5 text-blue-400" /><div><h3 className="text-sm font-black text-ink-100">Your numbered MTSS goal bank</h3><p className="mt-1 text-xs leading-5 text-ink-500">Add your complete school bank at once, then select the applicable numbered goal(s) inside each lesson.</p></div></div><button type="button" onClick={() => { setShowBulkImport((value) => !value); setImportReport(null); setGoalError('') }} className="btn-primary" aria-expanded={showBulkImport}><Import size={15} />{showBulkImport ? 'Close bank importer' : 'Import complete MTSS bank'}</button></div>
          {showBulkImport && <div className="mt-4 rounded-xl border border-blue-500/20 bg-ink-950/35 p-3"><label><span className="mb-1.5 block text-xs font-bold text-ink-300">Paste the complete Planbook list</span><textarea className="input min-h-40 w-full font-mono text-xs" value={bulkText} onChange={(event) => { setBulkText(event.target.value); setImportReport(null) }} placeholder={'T1-001\nVisual and Multimodal Supports: Presents content...\nT2-001\nTargeted Support Matched to Student Need: Selects...'} /></label><div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={importGoals} disabled={!bulkText.trim()} className="btn-primary"><Import size={15} />Import unique goals</button><button type="button" onClick={() => { setShowBulkImport(false); setBulkText(''); setImportReport(null) }} className="btn-ghost">Cancel</button></div>{importReport && <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/8 p-3 text-xs text-ink-300"><p><strong className="text-emerald-400">{importReport.added} unique goals added.</strong> {importReport.duplicates} duplicate {importReport.duplicates === 1 ? 'entry was' : 'entries were'} omitted automatically.</p>{importReport.incomplete.length > 0 && <p className="mt-1 text-amber-400">Review possibly incomplete wording for: {importReport.incomplete.join(', ')}.</p>}</div>}</div>}
          <div className="mt-4 space-y-2">{(draft.mtss_goal_bank ?? []).map((goal, index) => <div key={`${goal.number}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-ink-800 bg-ink-950/35 p-3"><p className="text-sm text-ink-300"><span className="mr-2 rounded bg-blue-500/12 px-1.5 py-0.5 text-[10px] font-black uppercase text-blue-400">{goal.tier === 'tier_2' ? 'Tier 2' : 'Tier 1'}</span><strong className="mr-2 text-blue-400">{goal.number}</strong>{goal.label}</p><button type="button" onClick={() => removeGoal(index)} className="text-ink-500 hover:text-red-400" aria-label={`Remove ${goal.number}`}><X size={15} /></button></div>)}</div>
          <div className="mt-4 border-t border-blue-500/15 pt-4"><p className="mb-2 text-xs font-bold text-ink-300">Or add one MTSS goal manually</p><div className="grid gap-2 sm:grid-cols-[100px_100px_1fr_auto]"><select aria-label="MTSS tier" className="input" value={goalDraft.tier} onChange={(event) => { setGoalDraft({ ...goalDraft, tier: event.target.value }); setGoalError('') }}><option value="tier_1">Tier 1</option><option value="tier_2">Tier 2</option></select><input aria-label="MTSS goal number" className="input" value={goalDraft.number} onChange={(event) => { setGoalDraft({ ...goalDraft, number: event.target.value }); setGoalError('') }} placeholder="Goal #" /><input aria-label="Exact MTSS goal wording" className="input" value={goalDraft.label} onChange={(event) => { setGoalDraft({ ...goalDraft, label: event.target.value }); setGoalError('') }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addGoal() } }} placeholder="Exact goal wording" /><button type="button" onClick={addGoal} className="btn-secondary"><Plus size={15} />Add one goal</button></div>{goalError && <p role="alert" className="mt-2 text-xs font-semibold text-amber-400">{goalError}</p>}</div>
        </section>

        {(draft.instructional_practice_bank ?? []).length > 0 && <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex items-start gap-3"><ClipboardCheck size={20} className="mt-0.5 text-violet-400" /><div><h3 className="text-sm font-black text-ink-100">Your instructional practices bank</h3><p className="mt-1 text-xs leading-5 text-ink-500">Separate from MTSS. PlansK12 recommends only the best few choices for each lesson, and you can change them before saving or printing.</p></div></div>
          <div className="mt-4 space-y-2">{(draft.instructional_practice_bank ?? []).map((practice) => <div key={practice.id} className="rounded-lg border border-ink-800 bg-ink-950/35 p-3"><p className="text-[11px] font-black uppercase tracking-wide text-violet-400">{practice.category}</p><p className="mt-1 text-sm text-ink-300">{practice.label}</p></div>)}</div>
        </section>}

        <label><span className="mb-1.5 block text-xs font-bold text-ink-300">Other school reminders (optional)</span><textarea className="input min-h-24 w-full" value={draft.requirement_notes ?? ''} onChange={(event) => setDraft({ ...draft, requirement_notes: event.target.value })} placeholder="Example: Keep the plan brief. Mark Tier 2 N/A when it is not needed." /></label>
        <div className="flex flex-wrap gap-2 border-t border-ink-800 pt-5"><button type="button" onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? 'Saving…' : 'Save format'}</button><button type="button" onClick={makeDefault} disabled={draft.is_default} className="btn-secondary"><Star size={16} />Make default</button>{selected && <button type="button" onClick={remove} className="btn-danger"><Trash2 size={16} />Delete</button>}</div>
      </main>

      <aside className="space-y-4"><div><p className="label-eyebrow">Live preview</p><p className="mt-1 text-xs text-ink-500">The actual lesson fills these sections automatically.</p></div><Preview format={draft} /><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><h3 className="text-sm font-black text-emerald-400">What stays unchanged</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-ink-400"><li>• The complete PlansK12 plan remains available.</li><li>• Other teachers cannot see or change your format.</li><li>• One format works across every specialty module.</li><li>• You can save more than one school format.</li></ul></div></aside>
    </div>
  </div>
}
