/**
 * Visual Teaching Resources renderer.
 *
 * Renders the second-pass, ready-to-use materials a lesson called for —
 * checklists, vocab cards, scenario cards, cue cards, graphic organizers —
 * as print-clean, hand-out-ready blocks. Each resource notes which part of
 * the lesson it supports. Diagram/illustration resources are out of scope
 * (a future image-generation capability) and never appear here.
 *
 * Typography/hierarchy match the main lesson output: the shared type scale
 * (lesson-section-title / lesson-block-title / lesson-body) and the structure-
 * color accent language (emerald title rule, tinted organizer headers). The
 * `visual-resource` wrapper drives crisp black-on-white print overrides in
 * index.css (accents that would otherwise wash to the universal print reset).
 *
 * @param {{ resources: Array<Object> }} props
 */
export default function VisualResourceRenderer({ resources }) {
  const list = Array.isArray(resources) ? resources : []
  if (list.length === 0) return null
  return (
    <div className="space-y-6">
      {list.map((r, i) => (
        <section
          key={i}
          className="visual-resource card lesson-doc max-w-none p-6 print:break-inside-avoid print:border print:border-gray-300"
        >
          {/* Header: title + emerald accent rule + "Supports" eyebrow */}
          <header className="vr-rule mb-4 border-b-2 border-accent-500/70 pb-2">
            {r.supports && (
              <p className="label-eyebrow text-accent-400 print:text-gray-600">Supports · {r.supports}</p>
            )}
            <h3 className="lesson-section-title mt-0.5 text-ink-50 print:text-black">{r.title}</h3>
            {r.instructions && (
              <p className="lesson-body mt-1 text-ink-400 print:text-gray-700">{r.instructions}</p>
            )}
          </header>
          <ResourceBody resource={r} />
        </section>
      ))}
    </div>
  )
}

function ResourceBody({ resource: r }) {
  switch (r.type) {
    case 'checklist':
      return (
        <ul className="space-y-2.5">
          {(r.items ?? []).map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-[3px] border-2 border-accent-500/60 print:border-gray-600" aria-hidden />
              <span className="lesson-body text-ink-200 print:text-black">{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'vocab_cards':
      return (
        <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
          {(r.cards ?? []).map((c, i) => (
            <div key={i} className="rounded-lg border border-ink-800 border-l-4 border-l-accent-500/70 p-3.5 print:border-gray-400 print:border-l-gray-500 print:break-inside-avoid">
              <p className="lesson-block-title text-ink-50 print:text-black">{c.term}</p>
              <p className="lesson-body mt-1 text-ink-300 print:text-gray-900">{c.definition}</p>
              {c.example && (
                <p className="mt-1.5 text-xs italic leading-relaxed text-ink-500 print:text-gray-600">e.g. {c.example}</p>
              )}
            </div>
          ))}
        </div>
      )

    case 'scenario_cards':
      return (
        <div className="space-y-3">
          {(r.cards ?? []).map((c, i) => (
            <div key={i} className="rounded-lg border border-ink-800 border-l-4 border-l-accent-500/70 p-3.5 print:border-gray-400 print:border-l-gray-500 print:break-inside-avoid">
              <p className="lesson-block-title text-ink-100 print:text-black">{c.label || `Scenario ${i + 1}`}</p>
              <p className="lesson-body mt-1 text-ink-200 print:text-gray-900">{c.scenario}</p>
              {(c.prompts ?? []).length > 0 && (
                <ol className="mt-2.5 list-decimal space-y-1 pl-5 lesson-body text-ink-400 print:text-gray-700">
                  {c.prompts.map((p, j) => <li key={j}>{p}</li>)}
                </ol>
              )}
            </div>
          ))}
        </div>
      )

    case 'cue_cards':
      return (
        <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
          {(r.cards ?? []).map((c, i) => (
            <div key={i} className="rounded-lg border border-ink-800 border-l-4 border-l-accent-500/70 p-3.5 print:border-gray-400 print:border-l-gray-500 print:break-inside-avoid">
              <p className="lesson-block-title text-ink-50 print:text-black">{c.front}</p>
              {c.back && <p className="lesson-body mt-1 text-ink-300 print:text-gray-800">{c.back}</p>}
            </div>
          ))}
        </div>
      )

    case 'organizer':
      return (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min((r.columns ?? []).length || 1, 3)}, minmax(0, 1fr))` }}
        >
          {(r.columns ?? []).map((col, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-ink-800 print:border-gray-400 print:break-inside-avoid">
              <p className="vr-colhead border-b border-ink-800 bg-ink-900/50 px-3 py-2 lesson-block-title text-ink-100 print:border-gray-400 print:text-black">
                {col.heading}
              </p>
              <ul className="space-y-2.5 p-3">
                {(col.rows ?? []).map((row, j) => (
                  <li key={j} className="border-b border-dashed border-ink-800/70 pb-2.5 lesson-body text-ink-300 last:border-0 print:border-gray-300 print:text-gray-800">
                    {row}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}
