import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Printer, Trash2, ClipboardCheck, Plus } from 'lucide-react'
import { useTrial } from '../context/TrialContext'
import UpgradeBanner from '../components/UpgradeBanner'
import { listCards, getCard, deleteCard } from '../services/classroomManagementService'
import ClassroomCardRenderer from '../components/renderers/ClassroomCardRenderer'
import BehaviorChartRenderer from '../components/renderers/BehaviorChartRenderer'
import ReflectionFormRenderer from '../components/renderers/ReflectionFormRenderer'
import TroubleshootRenderer from '../components/renderers/TroubleshootRenderer'

export default function MyClassroomCards() {
  const { isTrial, isExpired } = useTrial()
  const gated = isTrial || isExpired

  const [cards, setCards] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch unconditionally on mount (matches the working MyPacingGuides pattern).
  // RLS already scopes rows to the current user; the `gated` check below only
  // controls whether the list vs. the upgrade banner renders. Gating the fetch
  // itself risked skipping it during the trial-state load sequence.
  useEffect(() => {
    listCards().then(setCards).catch((e) => setError(e.message))
  }, [])

  async function openCard(row) {
    setLoadingDetail(true)
    try {
      const full = await getCard(row.id)
      setSelected(full)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCard(id)
      setCards((prev) => (prev ?? []).filter((c) => c.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) {
      setError(e.message)
    }
  }

  const data = selected?.card_data ?? {}

  return (
    <div className="space-y-8">
      <Link to="/classroom-management" className="no-print inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-200 transition-colors">
        <ArrowLeft size={14} />
        Classroom Management
      </Link>

      <div className="no-print flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
          <ClipboardCheck size={22} className="text-indigo-400" />
        </div>
        <h1 className="text-2xl font-semibold text-ink-50">My Classroom Cards</h1>
      </div>

      {gated ? (
        <UpgradeBanner label="the Classroom Management module" />
      ) : selected ? (
        <div className="space-y-5">
          <div className="no-print flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
              <ArrowLeft size={14} /> Back to list
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
          </div>
          {data.outputType === 'behavior-chart' ? (
            <BehaviorChartRenderer chart={data.card} teacherName={data.teacherName} gradeBand={data.gradeBand ?? '6-8'} classContext={data.classContext} accentHex={data.theme?.hex ?? '#1e3a8a'} />
          ) : data.outputType === 'reflection-form' ? (
            <ReflectionFormRenderer form={data.card} teacherName={data.teacherName} gradeBand={data.gradeBand ?? '6-8'} classContext={data.classContext} accentHex={data.theme?.hex ?? '#1e3a8a'} />
          ) : data.outputType === 'troubleshoot' ? (
            <TroubleshootRenderer result={data.card} challenge={data.challenge} teacherName={data.teacherName} gradeBand={data.gradeBand ?? '6-8'} classContext={data.classContext} accentHex={data.theme?.hex ?? '#1e3a8a'} />
          ) : (
            <ClassroomCardRenderer card={data.card} teacherName={data.teacherName} gradeBand={data.gradeBand ?? '6-8'} accentHex={data.theme?.hex ?? '#1e3a8a'} />
          )}
        </div>
      ) : (
        <div className="no-print">
          {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

          {cards === null ? (
            <div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          ) : cards.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-ink-400">You haven't saved any cards yet.</p>
              <Link to="/classroom-management" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus size={15} /> Create a card
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((c) => (
                <div key={c.id} className="card flex items-center justify-between gap-3 p-4">
                  <button type="button" onClick={() => openCard(c)} className="flex-1 text-left" disabled={loadingDetail}>
                    <p className="text-sm font-medium text-ink-100">{c.name}</p>
                    <p className="text-xs text-ink-500">{new Date(c.created_at).toLocaleDateString()}</p>
                  </button>
                  <button type="button" onClick={() => handleDelete(c.id)} aria-label="Delete card" className="text-ink-600 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
