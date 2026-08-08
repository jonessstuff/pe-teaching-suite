// Shared "Tier 1 UDL / Executive-Function supports" toggle — an optional,
// cross-module lesson enhancer (universal, whole-class supports). Parent owns the
// boolean state and passes { includeUdlEf: value } into its generate() input.
// Distinct from the standalone Intervention Planning module (which handles Tier 2).
export default function UdlEfToggle({
  value,
  onChange,
  label = 'Add Tier 1 UDL & executive-function supports',
  hint = 'Weaves universal-design supports (multiple means of engagement, representation, and action & expression) and executive-function supports into the lesson for all students — only where they genuinely fit.',
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
