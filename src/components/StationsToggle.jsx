// Shared "rotating stations" toggle — lifts PE's stations option into other
// modules. Renders a checkbox and, when checked, a 2–6 station-count selector.
// Parent owns the state (useStations / numStations) and passes
// { stationsMode: useStations, stationCount: useStations ? Number(numStations) : undefined }
// into its generate() input.
export default function StationsToggle({
  useStations,
  setUseStations,
  numStations,
  setNumStations,
  label = 'Use rotating stations',
  hint = 'Structure the main activity as multiple stations students rotate through.',
}) {
  return (
    <div className="card p-6 space-y-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={useStations}
          onChange={(e) => setUseStations(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
        />
        <div>
          <span className="text-sm font-medium text-ink-200">{label}</span>
          <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
        </div>
      </label>

      {useStations && (
        <div className="flex items-center gap-2 pl-7">
          <label className="text-sm text-ink-300" htmlFor="station-count">Number of stations</label>
          <select
            id="station-count"
            value={numStations}
            onChange={(e) => setNumStations(Number(e.target.value))}
            className="input-field w-20"
          >
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}
