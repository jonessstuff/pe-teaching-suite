import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

function UnitRow({ unit }) {
  return (
    <tr className="border-b border-ink-800 print:border-gray-300">
      <td className="py-3 pr-4 font-medium text-ink-800 print:text-black">{unit.title}</td>
      <td className="py-3 pr-4 text-center text-ink-700 print:text-gray-800">{unit.sessions}</td>
      <td className="py-3 pr-4 text-ink-700 print:text-gray-800 whitespace-nowrap">{unit.week_range}</td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {(unit.standards ?? []).map((s, i) => (
            <span
              key={i}
              className="rounded bg-accent-500/10 px-1.5 py-0.5 text-[11px] font-mono text-ink-50 print:bg-gray-100 print:text-gray-600"
            >
              {s}
            </span>
          ))}
        </div>
      </td>
      <td className="py-3 text-sm text-ink-700 print:text-gray-700">{unit.key_assessment}</td>
    </tr>
  )
}

function QuarterSection({ quarter, index }) {
  const [open, setOpen] = useState(true)

  return (
    <div className={index > 0 ? 'print:break-before-page' : ''}>
      {/* Quarter header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="rounded-full bg-accent-500/15 px-3 py-1 text-xs font-semibold text-ink-50 print:border print:border-gray-400 print:bg-transparent print:text-black">
            {quarter.label}
          </span>
          {quarter.date_range && (
            <span className="ml-3 text-sm text-ink-500 print:text-gray-600">{quarter.date_range}</span>
          )}
          {quarter.total_sessions && (
            <span className="ml-2 text-sm text-ink-500 print:text-gray-600">· {quarter.total_sessions} sessions</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-200 print:hidden"
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Units table */}
      <div className={open ? '' : 'hidden print:block'}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-ink-700 print:border-gray-400">
              <th className="pb-2 pr-4 text-left font-semibold text-ink-500 print:text-gray-600">Unit</th>
              <th className="pb-2 pr-4 text-center font-semibold text-ink-500 print:text-gray-600">Sessions</th>
              <th className="pb-2 pr-4 text-left font-semibold text-ink-500 print:text-gray-600">Weeks</th>
              <th className="pb-2 pr-4 text-left font-semibold text-ink-500 print:text-gray-600">Standards</th>
              <th className="pb-2 text-left font-semibold text-ink-500 print:text-gray-600">Key Assessment</th>
            </tr>
          </thead>
          <tbody>
            {(quarter.units ?? []).map((unit, i) => (
              <UnitRow key={i} unit={unit} />
            ))}
          </tbody>
        </table>

        {/* Unit descriptions */}
        <div className="mt-4 space-y-2 print:mt-3">
          {(quarter.units ?? []).filter(u => u.description).map((unit, i) => (
            <p key={i} className="text-sm text-ink-600 print:text-gray-600">
              <span className="font-medium text-ink-700 print:text-gray-800">{unit.title}: </span>
              {unit.description}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PacingGuideRenderer({ guide, previewQuarters = null, previewBanner = null }) {
  if (!guide?.quarters?.length) return null
  const { quarters, meta } = guide
  const shownQuarters = previewQuarters != null ? quarters.slice(0, previewQuarters) : quarters

  return (
    <div className="space-y-10">
      {/* Guide header */}
      {meta && (
        <div className="rounded-lg border border-ink-700 p-5 print:border-gray-400">
          <h2 className="text-lg font-bold text-ink-50 print:text-black">
            {meta.subject} Pacing Guide
          </h2>
          <p className="mt-0.5 text-sm text-ink-400 print:text-gray-600">
            Grade {meta.grade === 0 ? 'K' : meta.grade}
            {meta.state ? ` · ${meta.state}` : ''}
            {meta.schoolYearStart ? ` · ${meta.schoolYearStart}–${meta.schoolYearEnd ?? ''}` : ''}
            {meta.daysPerWeek ? ` · ${meta.daysPerWeek} days/week` : ''}
          </p>
        </div>
      )}

      {shownQuarters.map((quarter, i) => (
        <QuarterSection key={i} quarter={quarter} index={i} />
      ))}

      {previewQuarters != null && quarters.length > previewQuarters && previewBanner}
    </div>
  )
}
