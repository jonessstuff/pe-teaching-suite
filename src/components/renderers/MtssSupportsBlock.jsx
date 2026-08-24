import { Layers, Target } from 'lucide-react'

// Optional MTSS (Multi-Tiered System of Supports) block (lesson.mtss_supports),
// produced when the MTSS toggle is on. Tier 1 = universal supports + whole-class
// look-fors (monitoring); Tier 2 = targeted supports + progress monitoring.
// Renders nothing unless real content is present, so it's safe to mount
// unconditionally. Distinct accent (sky) from the emerald Tier-1 UDL/EF block.
export default function MtssSupportsBlock({ supports }) {
  if (!supports) return null
  const tier1 = Array.isArray(supports.tier_1) ? supports.tier_1.filter((t) => t && (t.support || t.look_for)) : []
  const tier2 = Array.isArray(supports.tier_2) ? supports.tier_2.filter((t) => t && (t.support || t.focus)) : []
  if (tier1.length === 0 && tier2.length === 0) return null

  return (
    <section className="space-y-3 rounded-lg border border-sky-500/25 bg-sky-500/5 p-4 print:border-sky-700">
      <h3 className="lesson-section-title flex items-center gap-1.5 text-sky-400 print:text-black">
        <Layers size={13} /> MTSS Supports (Tier 1 &amp; Tier 2)
      </h3>

      {tier1.length > 0 && (
        <div>
          <p className="lesson-block-title mb-1 text-ink-300 print:text-black">Tier 1 — Universal (all students)</p>
          <ul className="space-y-2">
            {tier1.map((t, i) => (
              <li key={i} className="lesson-body text-ink-300 print:text-gray-800">
                {t.support && <span>{t.support}</span>}
                {t.look_for && (
                  <span className="mt-0.5 block text-xs text-ink-500 print:text-gray-600">
                    <span className="font-semibold">Look for:</span> {t.look_for}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tier2.length > 0 && (
        <div>
          <p className="lesson-block-title mb-1 flex items-center gap-1.5 text-ink-300 print:text-black">
            <Target size={12} /> Tier 2 — Targeted (some students)
          </p>
          <ul className="space-y-2">
            {tier2.map((t, i) => (
              <li key={i} className="lesson-body text-ink-300 print:text-gray-800">
                {t.focus && <span className="font-semibold text-ink-100 print:text-black">{t.focus}: </span>}
                {t.support && <span>{t.support}</span>}
                {t.monitoring && (
                  <span className="mt-0.5 block text-xs text-ink-500 print:text-gray-600">
                    <span className="font-semibold">Progress monitoring:</span> {t.monitoring}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
