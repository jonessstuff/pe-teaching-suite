import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarRange, Trash2, Loader2, Plus } from 'lucide-react'
import { listGuides, getGuide, deleteGuide } from '../services/pacingGuideService'
import PacingGuideRenderer from '../components/renderers/PacingGuideRenderer'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'

export default function MyPacingGuides() {
  const { isTrial, isExpired, openPaywall } = useTrial()
  const gated = isTrial || isExpired
  const [guides, setGuides] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [selectedData, setSelectedData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    listGuides()
      .then(setGuides)
      .catch(e => setError(e.message))
  }, [])

  async function openGuide(guide) {
    setSelected(guide)
    setLoadingDetail(true)
    try {
      const full = await getGuide(guide.id)
      setSelectedData(full)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!window.confirm('Delete this pacing guide?')) return
    await deleteGuide(id)
    setGuides(prev => prev.filter(g => g.id !== id))
    if (selected?.id === id) { setSelected(null); setSelectedData(null) }
  }

  if (selected && selectedData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={() => { setSelected(null); setSelectedData(null) }}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
            <ArrowLeft size={14} /> My Pacing Guides
          </button>
          <span className="text-ink-700">·</span>
          <span className="text-sm font-medium text-ink-200">{selected.name}</span>
          <div className="ml-auto flex items-center gap-2 print:hidden">
            <button type="button" onClick={() => (gated ? openPaywall('gated-feature') : window.print())}
              className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-ink-400 hover:text-ink-200 transition-colors">
              Print
            </button>
            <button type="button" onClick={e => handleDelete(selected.id, e)} className="text-ink-600 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {loadingDetail ? (
          <div className="flex items-center gap-2 text-ink-400 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : (
          <>
            <PacingGuideRenderer
              guide={selectedData.guide_data}
              previewQuarters={gated ? 1 : null}
              previewBanner={<UpgradeBanner label="the full-year pacing guide" />}
            />
          </>
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
          <h1 className="text-2xl font-semibold text-ink-50">My Pacing Guides</h1>
        </div>
        <Link to="/pacing-guide" className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 transition-colors">
          <Plus size={16} /> New guide
        </Link>
      </div>

      {!guides && !error && <div className="flex items-center gap-2 text-ink-400 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {guides?.length === 0 && (
        <div className="card p-8 text-center">
          <CalendarRange size={32} className="mx-auto mb-3 text-ink-600" />
          <p className="font-medium text-ink-300">No pacing guides yet</p>
          <Link to="/pacing-guide" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 transition-colors">
            <Plus size={16} /> Create pacing guide
          </Link>
        </div>
      )}

      {guides && guides.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map(guide => (
            <div key={guide.id} onClick={() => openGuide(guide)}
              className="card group flex flex-col gap-3 p-5 cursor-pointer hover:border-teal-500/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15">
                  <CalendarRange size={20} className="text-teal-400" />
                </div>
                <button type="button" onClick={e => handleDelete(guide.id, e)}
                  className="text-ink-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="font-semibold text-ink-50">{guide.name}</p>
              <p className="text-sm text-ink-500">{new Date(guide.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
