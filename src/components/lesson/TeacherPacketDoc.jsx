import { gradeBandsLabel } from '../../types/lessonObject'
import PlanBookRenderer from '../renderers/PlanBookRenderer'

// A page-break marker; domToBlocks turns <div data-pagebreak> into a docx PageBreak.
const PageBreak = () => <div data-pagebreak="true" aria-hidden="true" />

// The full Teacher Packet composition, rendered (hidden) purely so domToBlocks can
// serialize it into ONE .docx. Order: cover → teaching view → full plan → materials
// → differentiation → skipped note. Uses semantic HTML that domToBlocks understands
// (h1/h2/h3, p, ul/li) and reuses the real PlanBookRenderer for the full plan.

function MaterialBlock({ r }) {
  if (!r) return null
  return (
    <section>
      <h3>{r.title || r.type}</h3>
      {r.supports && <p><em>Supports: {r.supports}</em></p>}
      {r.instructions && <p>{r.instructions}</p>}
      {Array.isArray(r.items) && r.items.length > 0 && (
        <ul>{r.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
      )}
      {Array.isArray(r.cards) && r.cards.length > 0 && (
        <ul>
          {r.cards.map((c, i) => (
            <li key={i}>
              {c.term ? `${c.term}: ${c.definition ?? ''}${c.example ? ` — ${c.example}` : ''}` : (c.label ? `${c.label}: ` : '') + (c.scenario || c.text || '')}
              {Array.isArray(c.prompts) && c.prompts.length > 0 ? ` — ${c.prompts.join('; ')}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function VariantBlock({ label, v }) {
  if (!v) return null
  const rows = [
    ['Warm-up', v.warm_up],
    ['Main activity', v.main_activity],
    ['Materials', v.materials],
    ['Assessment', v.assessment],
    ['Notes', v.notes],
  ].filter(([, val]) => val)
  return (
    <section>
      <h3>{label}{v.label ? ` (${v.label})` : ''}</h3>
      {rows.map(([k, val]) => <p key={k}><strong>{k}:</strong> {val}</p>)}
    </section>
  )
}

export default function TeacherPacketDoc({ innerRef, lesson: lo, materials = [], variants = {}, skipped = [] }) {
  if (!lo) return null
  const meta = [lo.subject, lo.grade_bands?.length && `Grade ${gradeBandsLabel(lo.grade_bands)}`, lo.duration_minutes && `${lo.duration_minutes} min`].filter(Boolean).join(' · ')
  const hasVariants = variants.advanced || variants.below_grade

  return (
    <div ref={innerRef}>
      <h1>{lo.title || 'Lesson'} — Teacher Packet</h1>
      {meta && <p>{meta}</p>}

      {/* The Teaching View lives as an on-screen tab only — the full plan below
          already covers the same content, so it's not repeated in the packet. */}
      <h2>Full Lesson Plan</h2>
      <PlanBookRenderer lesson={lo} />

      {materials.length > 0 && (
        <>
          <PageBreak />
          <h2>Teaching Materials</h2>
          {materials.map((r, i) => <MaterialBlock key={i} r={r} />)}
        </>
      )}

      {hasVariants && (
        <>
          <PageBreak />
          <h2>Differentiation</h2>
          <VariantBlock label="Extension / Advanced" v={variants.advanced} />
          <VariantBlock label="Modified / Below Grade" v={variants.below_grade} />
        </>
      )}

      {skipped.length > 0 && (
        <>
          <h2>Not included</h2>
          <p>These pieces were skipped or unavailable for this lesson: {skipped.join(', ')}.</p>
        </>
      )}
    </div>
  )
}
