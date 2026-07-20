import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookMarked, Pencil, Trash2, Loader2, Plus, Check } from 'lucide-react'
import { listBinders, getBinder, updateBinder, deleteBinder } from '../services/subBinderService'
import SubBinderRenderer from '../components/renderers/SubBinderRenderer'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'

export default function MyBinders() {
  const { isTrial, isExpired, openPaywall } = useTrial()
  const gated = isTrial || isExpired
  const [binders, setBinders] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [selectedData, setSelectedData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listBinders()
      .then(setBinders)
      .catch(e => setError(e.message))
  }, [])

  async function openBinder(binder) {
    setSelected(binder)
    setLoadingDetail(true)
    try {
      const full = await getBinder(binder.id)
      setSelectedData(full)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!window.confirm('Delete this binder? This cannot be undone.')) return
    await deleteBinder(id)
    setBinders(prev => prev.filter(b => b.id !== id))
    if (selected?.id === id) { setSelected(null); setSelectedData(null) }
  }

  async function handleRename(id) {
    if (!renameValue.trim()) return
    setSaving(true)
    await updateBinder(id, { name: renameValue.trim() })
    setBinders(prev => prev.map(b => b.id === id ? { ...b, name: renameValue.trim() } : b))
    if (selected?.id === id) setSelected(prev => ({ ...prev, name: renameValue.trim() }))
    setRenamingId(null)
    setSaving(false)
  }

  async function handleUpdateDay(weekIndex, dayIndex, updatedLesson) {
    if (!selectedData) return
    const newBinder = selectedData.binder_data.binder.map((week, wi) =>
      wi === weekIndex ? week.map((day, di) => di === dayIndex ? { ...day, ...updatedLesson } : day) : week
    )
    const newData = { ...selectedData.binder_data, binder: newBinder }
    setSelectedData(prev => ({ ...prev, binder_data: newData }))
    await updateBinder(selectedData.id, { binderData: newData })
  }

  if (selected && selectedData) {
    const meta = selectedData.binder_data?.meta ?? {}
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => { setSelected(null); setSelectedData(null) }}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors"
          >
            <ArrowLeft size={14} /> My Binders
          </button>
          <span className="text-ink-700">·</span>
          <span className="text-sm font-medium text-ink-200">{selected.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => (gated ? openPaywall('gated-feature') : window.print())}
              className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:border-ink-500 hover:text-ink-200 transition-colors print:hidden"
            >
              Print
            </button>
          </div>
        </div>

        {loadingDetail ? (
          <div className="flex items-center gap-2 text-ink-400 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading binder…
          </div>
        ) : (
          <SubBinderRenderer
            binder={selectedData.binder_data?.binder ?? []}
            subject={meta.subject}
            weekCount={meta.weekCount}
            classSize={meta.classSize}
            duration={meta.duration}
            state={meta.state}
            routines={meta.routines}
            emergencyNotes={meta.emergencyNotes}
            onUpdateDay={gated ? undefined : handleUpdateDay}
            previewWeeks={gated ? 2 : null}
            previewBanner={<UpgradeBanner label="the full substitute binder" />}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors mb-3">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-ink-50">My Sub Binders</h1>
        </div>
        <Link
          to="/sub-binder"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} /> New binder
        </Link>
      </div>

      {!binders && !error && (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {binders?.length === 0 && (
        <div className="card p-8 text-center">
          <BookMarked size={32} className="mx-auto mb-3 text-ink-600" />
          <p className="font-medium text-ink-300">No binders yet</p>
          <p className="mt-1 text-sm text-ink-600">Generate your first long-term sub binder to get started.</p>
          <Link to="/sub-binder" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400 transition-colors">
            <Plus size={16} /> Create binder
          </Link>
        </div>
      )}

      {binders && binders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {binders.map(binder => (
            <div
              key={binder.id}
              onClick={() => openBinder(binder)}
              className="card group flex flex-col gap-3 p-5 cursor-pointer hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                  <BookMarked size={20} className="text-amber-400" />
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleDelete(binder.id, e) }}
                  className="text-ink-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {renamingId === binder.id ? (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(binder.id); if (e.key === 'Escape') setRenamingId(null) }}
                    className="flex-1 rounded border border-ink-600 bg-white dark:bg-ink-800 px-2 py-1 text-sm text-ink-50 outline-none focus:border-amber-400"
                  />
                  <button type="button" onClick={() => handleRename(binder.id)} disabled={saving} className="text-amber-400 hover:text-amber-300">
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink-50 leading-snug">{binder.name}</p>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setRenamingId(binder.id); setRenameValue(binder.name) }}
                    className="text-ink-600 hover:text-ink-300 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}

              <p className="text-sm text-ink-500">
                {binder.subject} · {new Date(binder.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
