/**
 * ABC Data Collection Sheet — a static, printable form a teacher fills by hand to
 * log behavior incidents (Antecedent / Behavior / Consequence). Not AI-generated.
 * Prints via the shared .cm-print-root rules (accent header prints in color).
 *
 * @param {{ config: object, teacherName?: string, gradeBand?: string, classContext?: string, accentHex: string }} props
 */
const ROWS = 6

export default function ABCSheetRenderer({ config, teacherName, classContext, accentHex }) {
  if (!config) return null
  const { studentName, dateRange } = config
  const meta = [
    studentName?.trim() || 'Student',
    teacherName?.trim() || 'Teacher',
    classContext?.trim(),
    dateRange?.trim(),
  ].filter(Boolean).join(' · ')

  return (
    <div
      className="cm-print-root mx-auto max-w-[900px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
      style={{ '--cm-accent': accentHex }}
    >
      <header className="cm-accent-bar px-7 py-4 text-white" style={{ backgroundColor: accentHex }}>
        <p className="text-base font-bold leading-tight">ABC Data Collection</p>
        <p className="mt-0.5 text-sm font-medium opacity-90">{meta}</p>
      </header>

      <div className="space-y-3 p-6">
        <p className="text-xs italic text-slate-500">
          A data-collection tool to help spot patterns before deciding on a formal intervention — not a disciplinary record.
        </p>

        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <Th accentHex={accentHex} width="13%">Date / Time</Th>
              <Th accentHex={accentHex} width="26%" hint="what happened right before">Antecedent</Th>
              <Th accentHex={accentHex} width="27%" hint="specific, observable">Behavior</Th>
              <Th accentHex={accentHex} width="24%" hint="what happened right after">Consequence</Th>
              <Th accentHex={accentHex} width="10%" hint="1–2–3, optional">Duration / Intensity</Th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }).map((_, i) => (
              <tr key={i}>
                <Td /><Td /><Td /><Td /><Td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, hint, width, accentHex }) {
  return (
    <th className="border border-slate-300 p-2 text-left align-top" style={{ width }}>
      <span className="cm-accent-text block text-xs font-bold uppercase tracking-wide" style={{ color: accentHex }}>
        {children}
      </span>
      {hint && <span className="mt-0.5 block text-[10px] font-normal normal-case text-slate-400">{hint}</span>}
    </th>
  )
}

function Td() {
  return <td className="h-16 border border-slate-300 align-top" />
}
