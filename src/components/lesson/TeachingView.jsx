import { gradeBandsLabel } from '../../types/lessonObject'

// Condensed, at-a-glance TEACHING VIEW — a pure client-side reformatter of the
// existing lesson object (NO new AI call). Big phase headers + a parsed timing +
// a short "key cue" per phase, plus targets, equipment, and safety. Semantic
// HTML (h2/h3/p/ul) so it also serializes cleanly into the Teacher Packet.
const PHASES = [
  { field: 'warm_up', label: 'Warm-Up' },
  { field: 'fitness_activities', label: 'Fitness' },
  { field: 'whole_group_instruction', label: 'Instruction & Skill' },
  { field: 'independent_practice', label: 'Activity & Practice' },
  { field: 'closure', label: 'Closure' },
]

// Pull an "X–Y minutes" / "X min" timing out of the phase prose, if present.
function extractTiming(text) {
  const m = String(text || '').match(/(\d+\s*[–-]\s*\d+|\d+)\s*(?:min\b|minutes)/i)
  return m ? m[0].replace(/minutes/i, 'min') : null
}

// Turn long generated prose into a few glanceable cues without changing the
// stored lesson. Newlines win; older lessons that are paragraph-only fall back
// to sentences. This keeps Teach View useful while the full plan stays intact.
function keyCues(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const raw = String(text || '').split(/\n+/).map((line) => line.replace(/^[-•\d.)\s]+/, '').trim()).filter(Boolean)
  const parts = raw.length > 1 ? raw : clean.split(/(?<=[.!?])\s+/)
  return parts.slice(0, 4).map((cue) => cue.length > 170 ? cue.slice(0, 167).trimEnd() + '…' : cue)
}

export default function TeachingView({ lesson: lo }) {
  if (!lo) return null
  const grades = gradeBandsLabel(lo.grade_bands)
  const targets = Object.values(lo.learning_targets ?? {}).filter(Boolean)
  const phases = PHASES.filter((p) => String(lo[p.field] || '').trim())
  const meta = [lo.subject, grades && `Grade ${grades}`, lo.duration_minutes && `${lo.duration_minutes} min`].filter(Boolean).join(' · ')

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-ink-50 print:text-black">{lo.title || 'Lesson'}</h2>
        {meta && <p className="mt-0.5 text-sm text-ink-500">{meta}</p>}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {(lo.equipment_needed ?? []).length > 0 && <section className="rounded-xl border border-ink-800 bg-ink-900/40 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Equipment</h3>
          <p className="mt-1 text-sm text-ink-300 print:text-gray-800">{(lo.equipment_needed ?? []).join(' · ')}</p>
        </section>}
        {lo.location && <section className="rounded-xl border border-ink-800 bg-ink-900/40 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Setup</h3>
          <p className="mt-1 text-sm text-ink-300 print:text-gray-800">{lo.location}</p>
        </section>}
        {(lo.safety_notes ?? []).length > 0 && <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-600">Safety first</h3>
          <p className="mt-1 text-sm text-ink-300 print:text-gray-800">{lo.safety_notes[0]}</p>
        </section>}
      </div>

      {targets.length > 0 && (
        <section className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Today students will</h3>
          <ul className="mt-1 space-y-0.5">
            {targets.map((t, i) => <li key={i} className="text-sm text-ink-200">{t}</li>)}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        {phases.map((p, i) => {
          const timing = extractTiming(lo[p.field])
          return (
            <div key={p.field} className="border-l-2 border-accent-500 pl-3 print:break-inside-avoid">
              <h3 className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold text-ink-50 print:text-black">
                <span className="text-accent-500">{i + 1}.</span> {p.label}
                {timing && <span className="text-xs font-normal text-ink-500">{timing}</span>}
              </h3>
              <ul className="mt-1 space-y-1">
                {keyCues(lo[p.field]).map((cue, cueIndex) => <li key={cueIndex} className="flex gap-2 text-sm text-ink-300 print:text-gray-800"><span className="text-accent-500">•</span><span>{cue}</span></li>)}
              </ul>
            </div>
          )
        })}
      </section>

      {(lo.safety_notes ?? []).length > 1 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Additional safety</h3>
          <ul className="mt-1 space-y-0.5">
            {(lo.safety_notes ?? []).slice(1).map((s, i) => <li key={i} className="text-sm text-ink-300">{s}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
