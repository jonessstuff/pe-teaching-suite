/**
 * Behavior Chart (traffic-light) — a student-facing, postable print artifact.
 *
 * Renders green/yellow/red tiers plus a non-punitive "reset path". Like the other
 * Classroom Management renderers it prints as a light "paper" card; the teacher's
 * accent color and the tier colors both print via the .cm-print-root rules in
 * index.css (which override the global black/white print reset).
 *
 * @param {{ chart: object, teacherName?: string, gradeBand?: string, classContext?: string, accentHex: string }} props
 */
const TIER_HEX = { green: '#16a34a', yellow: '#d97706', red: '#dc2626' }

const TIER_ORDER = ['green', 'yellow', 'red']

export default function BehaviorChartRenderer({ chart, teacherName, gradeBand = '6-8', classContext, accentHex }) {
  if (!chart) return null
  const { heading = 'Behavior Chart', move_up_steps = [] } = chart
  // Normalize to exactly one green/yellow/red tier in order — the model can
  // occasionally duplicate or misorder tiers (structured outputs can't enforce
  // array length).
  const rawTiers = chart.tiers ?? []
  const tiers = TIER_ORDER.map((c) => rawTiers.find((t) => t?.color === c)).filter(Boolean)

  return (
    <div
      className="cm-print-root mx-auto max-w-[840px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
      style={{ '--cm-accent': accentHex }}
    >
      <header className="cm-accent-bar px-7 py-5 text-white" style={{ backgroundColor: accentHex }}>
        <p className="text-lg font-bold leading-tight">{teacherName?.trim() || 'My Classroom'}</p>
        <p className="mt-0.5 text-sm font-medium opacity-90">
          Grades {gradeBand}{classContext?.trim() ? ` · ${classContext.trim()}` : ''} · {heading}
        </p>
      </header>

      <div className="space-y-3 p-7">
        {tiers.map((tier, i) => {
          const hex = TIER_HEX[tier.color] ?? '#334155'
          return (
            <div
              key={i}
              className="cm-tier-border overflow-hidden rounded-xl border-2"
              style={{ '--tier-color': hex, borderColor: hex }}
            >
              <div className="cm-tier-bar flex items-center gap-2 px-4 py-2 text-white" style={{ backgroundColor: hex }}>
                <span className="h-3 w-3 rounded-full bg-white/90" />
                <span className="text-sm font-bold uppercase tracking-wide">{tier.label}</span>
              </div>
              <ul className="space-y-1 px-4 py-3">
                {(tier.descriptors ?? []).map((d, j) => (
                  <li key={j} className="flex gap-2 text-sm leading-snug">
                    <span className="cm-tier-text mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

        {move_up_steps.length > 0 && (
          <div className="cm-accent-border mt-1 rounded-xl border-2 border-dashed p-4" style={{ borderColor: accentHex }}>
            <h3 className="cm-accent-text mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: accentHex }}>
              Getting Back to Green
            </h3>
            <ol className="space-y-1.5">
              {move_up_steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm leading-snug">
                  <span className="cm-accent-text shrink-0 font-bold tabular-nums" style={{ color: accentHex }}>{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
