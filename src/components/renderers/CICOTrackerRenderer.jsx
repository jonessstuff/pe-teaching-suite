/**
 * Check-In / Check-Out (CICO) daily point tracker for ONE student — a static,
 * printable, encouraging point sheet. Teacher-customized goals × time blocks,
 * each cell holding a rating scale (0-1-2 for older grades, faces for K-2) the
 * teacher circles. Not AI-generated. Prints via the shared .cm-print-root rules.
 *
 * @param {{ config: object, teacherName?: string, gradeBand?: string, classContext?: string, accentHex: string }} props
 */
export default function CICOTrackerRenderer({ config, teacherName, classContext, accentHex }) {
  if (!config) return null
  const { studentName, date, goals = [], intervals = [], scale = 'points' } = config
  const scaleOptions = scale === 'faces' ? ['🙁', '😐', '🙂'] : ['0', '1', '2']
  const legend =
    scale === 'faces'
      ? '🙂 = great · 😐 = okay · 🙁 = keep trying'
      : '2 = great · 1 = okay · 0 = keep trying'

  const meta = [studentName?.trim() || 'Student', teacherName?.trim() || 'Teacher', classContext?.trim(), date?.trim()]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="cm-print-root mx-auto max-w-[900px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
      style={{ '--cm-accent': accentHex }}
    >
      <header className="cm-accent-bar px-7 py-4 text-white" style={{ backgroundColor: accentHex }}>
        <p className="text-base font-bold leading-tight">How did I do today?</p>
        <p className="mt-0.5 text-sm font-medium opacity-90">{meta}</p>
      </header>

      <div className="space-y-3 p-6">
        <p className="text-xs text-slate-500">Circle a rating for each goal at each check-in. {legend}</p>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="cm-accent-text border border-slate-300 p-2 text-left text-xs font-bold uppercase tracking-wide" style={{ color: accentHex, width: '28%' }}>
                My Goals
              </th>
              {intervals.map((iv, i) => (
                <th key={i} className="cm-accent-text border border-slate-300 p-2 text-center text-xs font-bold" style={{ color: accentHex }}>
                  {iv}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {goals.map((g, gi) => (
              <tr key={gi}>
                <td className="border border-slate-300 p-2 align-middle text-sm font-medium">{g}</td>
                {intervals.map((_, ii) => (
                  <td key={ii} className="border border-slate-300 p-1.5 text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      {scaleOptions.map((o, oi) => (
                        <span key={oi} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs">
                          {o}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-3 pt-2 text-sm">
          <p className="flex items-baseline gap-2">
            <span className="cm-accent-text font-semibold" style={{ color: accentHex }}>Teacher comments:</span>
            <span className="min-w-[280px] flex-1 border-b border-slate-300">&nbsp;</span>
          </p>
          <p className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span>
              <span className="cm-accent-text font-semibold" style={{ color: accentHex }}>Total points:</span>{' '}
              <span className="inline-block min-w-[80px] border-b border-slate-300">&nbsp;</span>
            </span>
            <span>
              <span className="cm-accent-text font-semibold" style={{ color: accentHex }}>Goal met?</span>{' '}
              <span className="text-slate-600">◻ Yes&nbsp;&nbsp;◻ Almost&nbsp;&nbsp;◻ Not yet — try again tomorrow!</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
