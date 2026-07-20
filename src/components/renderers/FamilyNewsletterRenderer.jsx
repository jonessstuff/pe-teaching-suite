export default function FamilyNewsletterRenderer({ newsletter }) {
  if (!newsletter) return null
  const { week_of, subject_line, what_we_learned, why_it_matters, try_at_home, coming_up_next, closing } = newsletter

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-100/30 p-6 space-y-5 print:border-gray-300 print:bg-white print:p-0">
      {/* Header */}
      <div className="border-b border-ink-700 pb-4 print:border-gray-300">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500 print:text-gray-500">
          Family Newsletter {week_of ? `· ${week_of}` : ''}
        </p>
        <p className="mt-1 text-xl font-bold text-ink-50 print:text-black">{subject_line}</p>
      </div>

      {/* What we learned */}
      <section>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-400 print:text-gray-600">
          What We Learned
        </p>
        <p className="text-sm text-ink-800 leading-relaxed print:text-gray-800">{what_we_learned}</p>
      </section>

      {/* Why it matters */}
      <section>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-400 print:text-gray-600">
          Why It Matters
        </p>
        <p className="text-sm text-ink-800 leading-relaxed print:text-gray-800">{why_it_matters}</p>
      </section>

      {/* Try at home */}
      {Array.isArray(try_at_home) && try_at_home.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-400 print:text-gray-600">
            Try It at Home
          </p>
          <ul className="space-y-1.5">
            {try_at_home.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-800 leading-snug print:text-gray-800">
                <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-accent-500/20 text-[10px] font-bold text-accent-400 flex items-center justify-center print:bg-gray-200 print:text-gray-600">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Coming up */}
      {coming_up_next && (
        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-400 print:text-gray-600">
            Coming Up Next
          </p>
          <p className="text-sm text-ink-800 leading-relaxed print:text-gray-800">{coming_up_next}</p>
        </section>
      )}

      {/* Closing */}
      {closing && (
        <p className="border-t border-ink-700 pt-4 text-sm italic text-ink-700 print:border-gray-300 print:text-gray-600">
          {closing}
        </p>
      )}
    </div>
  )
}
