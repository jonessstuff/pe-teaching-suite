const PROFILE_COLORS = {
  advanced:     { label: 'Advanced',         bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  below_grade:  { label: 'Below Grade Level', bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400'  },
  sensory:      { label: 'Sensory',           bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-400'   },
  ell:          { label: 'ELL',               bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400'   },
  physical:     { label: 'Physical Mods',     bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400'  },
}

function DiffSection({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 print:text-gray-500">
        {label}
      </p>
      <p className="text-sm text-ink-400 leading-snug print:text-gray-800">{value}</p>
    </div>
  )
}

export default function DifferentiatedLessonRenderer({ differentiation }) {
  if (!differentiation) return null

  return (
    <div className="space-y-4">
      {Object.entries(differentiation).map(([type, profile]) => {
        const color = PROFILE_COLORS[type] ?? { label: type, bg: 'bg-ink-200/30', border: 'border-ink-700', text: 'text-ink-500' }
        return (
          <div
            key={type}
            className={`rounded-lg border p-4 ${color.bg} ${color.border} print:border-gray-400 print:bg-gray-50 print:break-inside-avoid`}
          >
            <p className={`mb-3 text-xs font-bold uppercase tracking-widest ${color.text} print:text-gray-600`}>
              {profile.label ?? color.label}
            </p>
            <div className="space-y-2.5">
              <DiffSection label="Warm-up"      value={profile.warm_up} />
              <DiffSection label="Main activity" value={profile.main_activity} />
              <DiffSection label="Materials"     value={profile.materials} />
              <DiffSection label="Assessment"    value={profile.assessment} />
              {profile.notes && (
                <p className="text-xs italic text-ink-500 print:text-gray-500">{profile.notes}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
