import { TEACHING_AREAS, CTE_PATHWAYS, CTE_KEY, OTHER_KEY } from '../constants/teachingAreas'

/**
 * Multi-select "What do you teach?" chips + a conditional CTE-pathway
 * sub-select and an "Other" free-text box. Controlled component.
 *
 * @param {{ areas: string[], ctePathways: string[], other: string }} value
 * @param {(next: { areas: string[], ctePathways: string[], other: string }) => void} onChange
 */
export default function TeachingAreasField({ value, onChange }) {
  const areas = value?.areas ?? []
  const ctePathways = value?.ctePathways ?? []
  const other = value?.other ?? ''

  const toggle = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key])

  function toggleArea(key) {
    const nextAreas = toggle(areas, key)
    const next = { areas: nextAreas, ctePathways, other }
    // Clear dependent state when its parent option is deselected.
    if (key === CTE_KEY && !nextAreas.includes(CTE_KEY)) next.ctePathways = []
    if (key === OTHER_KEY && !nextAreas.includes(OTHER_KEY)) next.other = ''
    onChange(next)
  }

  function togglePathway(key) {
    onChange({ areas, ctePathways: toggle(ctePathways, key), other })
  }

  const chipClass = (on) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      on
        ? 'border-accent-500/40 bg-accent-500/15 text-accent-300'
        : 'border-ink-700 bg-ink-900 text-ink-300 hover:border-ink-600 hover:text-ink-100'
    }`

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TEACHING_AREAS.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => toggleArea(key)} aria-pressed={areas.includes(key)} className={chipClass(areas.includes(key))}>
            {label}
          </button>
        ))}
      </div>

      {areas.includes(CTE_KEY) && (
        <div className="space-y-2 rounded-lg border border-ink-800 bg-ink-900/50 p-3">
          <p className="text-xs font-medium text-ink-400">Which CTE pathway(s)?</p>
          <div className="flex flex-wrap gap-2">
            {CTE_PATHWAYS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => togglePathway(key)} aria-pressed={ctePathways.includes(key)} className={chipClass(ctePathways.includes(key))}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {areas.includes(OTHER_KEY) && (
        <input
          type="text"
          value={other}
          onChange={(e) => onChange({ areas, ctePathways, other: e.target.value })}
          placeholder="Tell us what you teach"
          className="input-field"
          maxLength={120}
        />
      )}
    </div>
  )
}
