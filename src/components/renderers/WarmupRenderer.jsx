// Renders a set of warm-up / bell-ringer options as cards. Shared by the
// standalone Warm-up tool and the Assessment Bank (saved warm-ups). Print-clean
// (no interactive controls) so it drops straight into printArtifact.
export default function WarmupRenderer({ warmups, heading }) {
  const list = warmups ?? []
  if (!list.length) return null
  return (
    <div className="space-y-4">
      {heading && <h2 className="text-lg font-semibold text-ink-50">{heading}</h2>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((w, i) => (
          <div key={i} className="card flex flex-col gap-2 p-5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink-50 leading-snug">{w.title}</p>
              <span className="shrink-0 text-xs text-ink-500">{w.duration_mins} min</span>
            </div>
            <p className="text-sm text-ink-700 leading-relaxed">{w.description}</p>
            {w.equipment_needed?.length > 0 && (
              <p className="text-xs text-ink-600 border-t border-ink-800 pt-2">Equipment: {w.equipment_needed.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
