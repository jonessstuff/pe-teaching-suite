import { Accessibility, Brain } from 'lucide-react'

// Shared render block for the optional Tier 1 UDL / executive-function supports
// (lesson.tier1_udl_ef), produced when the UDL/EF toggle is on. Dropped into each
// content-module renderer (PE / Art / Music / STEM / Library / CTE). Renders
// nothing unless real content is present, so it's safe to mount unconditionally.
export default function Tier1SupportsBlock({ supports }) {
  if (!supports) return null
  const udl = supports.udl ?? {}
  const ef = supports.executive_function ?? []
  const hasUdl = !!(udl.engagement || udl.representation || udl.action_expression)
  if (!hasUdl && ef.length === 0) return null

  return (
    <section className="space-y-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 print:border-emerald-700">
      <h3 className="lesson-section-title flex items-center gap-1.5 text-emerald-400">
        <Accessibility size={13} /> Tier 1 UDL &amp; Executive-Function Supports
      </h3>

      {hasUdl && (
        <div>
          <p className="lesson-block-title mb-1 text-ink-300">Universal Design for Learning (CAST)</p>
          <dl className="space-y-1.5">
            {udl.engagement && <Row label="Engagement (the why)" value={udl.engagement} />}
            {udl.representation && <Row label="Representation (the what)" value={udl.representation} />}
            {udl.action_expression && <Row label="Action & Expression (the how)" value={udl.action_expression} />}
          </dl>
        </div>
      )}

      {ef.length > 0 && (
        <div>
          <p className="lesson-block-title mb-1 flex items-center gap-1.5 text-ink-300">
            <Brain size={12} /> Executive-function supports
          </p>
          <ul className="lesson-body space-y-1 text-ink-300">
            {ef.map((e, i) => (
              <li key={i}><span className="font-semibold text-ink-100">{e.skill}: </span>{e.support}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-400">{label}</dt>
      <dd className="lesson-body text-ink-300">{value}</dd>
    </div>
  )
}
