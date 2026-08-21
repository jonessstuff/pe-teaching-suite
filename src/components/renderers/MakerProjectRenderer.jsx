import { useState } from 'react'
import { Copy, Check, Info, ShieldAlert } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function MakerProjectRenderer({ lesson }) {
  if (!lesson) return null
  const gradeBands = lesson.grade_bands ?? []
  const safety = lesson.tool_safety ?? {}
  const design = lesson.design_process ?? []
  const cc = lesson.cross_curricular_connection ?? {}
  const sm = lesson.station_management ?? {}

  const designText = design.map((d, i) => `${i + 1}. ${d.phase}\n${d.what_students_do}`).join('\n\n')
  const safetyText = [
    (safety.procedures ?? []).map((p) => `- ${p}`).join('\n'),
    safety.supervision_note ? `Supervision: ${safety.supervision_note}` : '',
  ].filter(Boolean).join('\n\n')
  const smText = [
    sm.setup ? `Setup: ${sm.setup}` : '',
    sm.rotation ? `Rotation: ${sm.rotation}` : '',
    sm.shared_equipment_safety ? `Shared-equipment safety: ${sm.shared_equipment_safety}` : '',
    (sm.large_group_tips ?? []).length ? `Large-group tips:\n${(sm.large_group_tips ?? []).map((t) => `- ${t}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n')

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <span className="label-eyebrow rounded px-2 py-0.5 bg-slate-500/15 text-ink-50">
          Makerspace{lesson.project_type ? ` · ${lesson.project_type}` : ''}
          {gradeBands.length > 0
            ? ` · Grade${gradeBands.length > 1 ? 's' : ''} ${gradeBands.map(formatGrade).join('/')}`
            : ''}
        </span>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.tool, lesson.sessions].filter(Boolean).join(' · ')}
        </p>
      </header>

      {lesson.driving_question && (
        <Section title="Driving Question" copyText={lesson.driving_question}>
          <p className="text-ink-300 whitespace-pre-line italic">{lesson.driving_question}</p>
        </Section>
      )}

      {lesson.project_overview && (
        <Section title="Project Overview" copyText={lesson.project_overview}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.project_overview}</p>
        </Section>
      )}

      <BulletSection title="Materials & Equipment" items={lesson.materials_equipment} />

      {/* Tool safety */}
      {((safety.procedures ?? []).length > 0 || safety.supervision_note) && (
        <Section title="Tool Safety" copyText={safetyText}>
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <ShieldAlert size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-ink-300">Safety procedures</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-ink-300">
              {(safety.procedures ?? []).map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            {safety.supervision_note && (
              <p className="mt-2 text-sm text-ink-400"><span className="font-medium text-ink-300">Supervision: </span>{safety.supervision_note}</p>
            )}
          </div>
        </Section>
      )}

      {/* Design process */}
      {design.length > 0 && (
        <Section title="Engineering Design Process" copyText={designText}>
          <ol className="space-y-2">
            {design.map((d, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{d.phase}</p>
                </div>
                <p className="text-sm text-ink-300">{d.what_students_do}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Cross-curricular */}
      {(cc.subject || cc.connection) && (
        <Section
          title="Cross-Curricular Connection"
          copyText={[cc.subject ? `Subject: ${cc.subject}` : '', cc.connection, cc.example ? `Example: ${cc.example}` : ''].filter(Boolean).join('\n\n')}
        >
          <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 px-4 py-3">
            {cc.subject && <p className="text-xs font-semibold text-ink-300 mb-1">{cc.subject}</p>}
            {cc.connection && <p className="text-sm text-ink-300">{cc.connection}</p>}
            {cc.example && <p className="mt-1.5 text-sm text-ink-400"><span className="font-medium text-ink-300">Example: </span>{cc.example}</p>}
          </div>
        </Section>
      )}

      {/* Station management */}
      {(sm.setup || sm.rotation || (sm.large_group_tips ?? []).length > 0) && (
        <Section title="Station & Large-Group Management" copyText={smText}>
          <div className="space-y-2 text-sm text-ink-300">
            {sm.setup && <p><span className="font-medium text-ink-200">Setup: </span>{sm.setup}</p>}
            {sm.rotation && <p><span className="font-medium text-ink-200">Rotation: </span>{sm.rotation}</p>}
            {sm.shared_equipment_safety && <p><span className="font-medium text-ink-200">Shared-equipment safety: </span>{sm.shared_equipment_safety}</p>}
            {(sm.large_group_tips ?? []).length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {(sm.large_group_tips ?? []).map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
          </div>
        </Section>
      )}

      {lesson.differentiation && (
        <Section title="Differentiation" copyText={lesson.differentiation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.differentiation}</p>
        </Section>
      )}

      {lesson.low_tech_variant && (
        <Section title="Low-Tech Variant" copyText={lesson.low_tech_variant}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.low_tech_variant}</p>
        </Section>
      )}

      {lesson.assessment_reflection && (
        <Section title="Assessment & Reflection" copyText={lesson.assessment_reflection}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.assessment_reflection}</p>
        </Section>
      )}

      {/* Standards */}
      {(lesson.standards_alignment ?? []).length > 0 && (
        <Section
          title="Standards Alignment"
          copyText={(lesson.standards_alignment ?? []).map((s) => `[${s.framework}] ${s.text}`).join('\n')}
        >
          <ul className="space-y-1.5 text-ink-300">
            {(lesson.standards_alignment ?? []).map((s, i) => (
              <li key={i} className="text-sm">
                <span className="rounded bg-slate-500/20 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.framework}</span>
                <span className="ml-1">— {s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {lesson.framework_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 print:border-ink-300">
          <Info size={15} className="mt-0.5 shrink-0 text-ink-500" />
          <p className="text-xs text-ink-400">{lesson.framework_note}</p>
        </div>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function BulletSection({ title, items }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section title={title} copyText={list.map((i) => `- ${i}`).join('\n')}>
      <ul className="list-disc list-inside space-y-1 text-ink-300">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </Section>
  )
}

function Section({ title, copyText, children }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable; fail silently
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between lesson-section-rule">
        <h3 className="lesson-section-title text-ink-200">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-300 transition-colors print:hidden"
            title="Copy this section to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="lesson-body text-ink-200">{children}</div>
    </section>
  )
}
