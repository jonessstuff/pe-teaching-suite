// Shared "Core Activity Only" quick-mode toggle — an optional, cross-module
// lesson mode. Parent owns the boolean state and passes { coreActivityOnly: value }
// into its generate() input. When on, the generator drops the warm-up and closure
// sections and returns just the core body at full depth (NOT a condensed lesson);
// standards citations and safety notes are always kept.
export default function CoreActivityToggle({
  value,
  onChange,
  label = 'Core Activity Only (skip warm-up & closure)',
  hint = 'Generates just the main instruction and core activity at full depth — no warm-up or closure. Standards and safety notes are always kept. Leave off for a complete lesson.',
}) {
  return (
    <div className="card p-6 space-y-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
        />
        <div>
          <span className="text-sm font-medium text-ink-200">{label}</span>
          <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
        </div>
      </label>
    </div>
  )
}
