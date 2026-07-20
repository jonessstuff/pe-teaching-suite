export default function RubricRenderer({ rubric }) {
  if (!rubric) return null
  const { title, level_labels, criteria } = rubric

  return (
    <div className="print:font-sans">
      {/* Header */}
      <div className="mb-4 print:mb-3">
        <h2 className="text-lg font-bold text-ink-50 print:text-black">{title}</h2>
        <div className="mt-1 flex gap-4 text-sm text-ink-400 print:text-gray-600">
          <span>Name: ___________________________</span>
          <span>Date: _______________</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm print:text-xs">
          <thead>
            <tr>
              <th className="w-36 border border-ink-700 bg-ink-200 p-2 text-left font-semibold text-ink-900 print:border-gray-400 print:bg-gray-100 print:text-black">
                Criterion
              </th>
              {(level_labels ?? ['4 - Exceeds', '3 - Meets', '2 - Approaching', '1 - Beginning']).map((label, i) => (
                <th
                  key={i}
                  className="border border-ink-700 bg-ink-200 p-2 text-center font-semibold text-ink-900 print:border-gray-400 print:bg-gray-100 print:text-black"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(criteria ?? []).map((criterion, ci) => (
              <tr key={ci} className={ci % 2 === 0 ? '' : 'bg-ink-100/40 print:bg-gray-50'}>
                <td className="border border-ink-700 p-2 font-medium text-ink-400 align-top print:border-gray-400 print:text-gray-900">
                  {criterion.name}
                </td>
                {(criterion.descriptors ?? []).map((desc, di) => (
                  <td
                    key={di}
                    className="border border-ink-700 p-2 text-ink-400 align-top leading-snug print:border-gray-400 print:text-gray-800"
                  >
                    {desc}
                  </td>
                ))}
              </tr>
            ))}
            {/* Score row */}
            <tr>
              <td className="border border-ink-700 p-2 font-semibold text-ink-400 print:border-gray-400 print:text-black">
                Score
              </td>
              {(level_labels ?? [null, null, null, null]).map((_, i) => (
                <td key={i} className="border border-ink-700 p-2 print:border-gray-400" />
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="mt-3 text-right text-sm text-ink-400 print:text-gray-600">
        Total: _______ / {(criteria ?? []).length * 4}
      </div>
    </div>
  )
}
