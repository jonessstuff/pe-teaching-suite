import { useState } from 'react'
import { Copy, Check, Info, Sparkles, Users, Sun, Repeat, Eye, Home, Blocks } from 'lucide-react'

/**
 * Early Childhood / Pre-K renderer.
 *
 * Deliberately NOT the lesson-with-objectives layout. Presents a DAP,
 * play-based plan: an invitation, whole-child developmental focus, LEARNING
 * CENTERS, a short playful circle time, guided small-group play, outdoor play,
 * routines, observation look-fors, family connection, and the standards stack.
 */
export default function EarlyChildhoodRenderer({ lesson }) {
  if (!lesson) return null

  const centers = lesson.learning_centers ?? []
  const focus = lesson.developmental_focus ?? []
  const circle = lesson.circle_time ?? {}
  const smallGroup = lesson.small_group_play ?? {}
  const standards = lesson.standards_alignment ?? {}
  const naeycStandards = standards.naeyc_standards ?? []
  const elof = standards.head_start_elof ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-grass-500/15 text-ink-50">
            Early Childhood · Play-Based (DAP)
          </span>
          {lesson.age_group && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-grass-500/20 text-ink-50">
              {lesson.age_group}
            </span>
          )}
          {lesson.program_type && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-300">
              {lesson.program_type}
            </span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        {lesson.study_theme && (
          <p className="text-sm text-ink-400">Study: {lesson.study_theme}</p>
        )}
      </header>

      {lesson.big_idea && (
        <div className="rounded-lg border border-grass-500/25 bg-grass-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-300 mb-0.5">Big idea &amp; wondering</p>
          <p className="text-sm italic text-ink-200">{lesson.big_idea}</p>
        </div>
      )}

      {lesson.invitation && (
        <Section title="The Invitation" icon={Sparkles} copyText={lesson.invitation}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.invitation}</p>
        </Section>
      )}

      {/* Whole-child developmental focus */}
      {focus.length > 0 && (
        <Section
          title="Whole-Child Developmental Focus"
          copyText={focus.map((f) => `${f.domain}: ${f.description}`).join('\n')}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {focus.map((f, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-3 py-2">
                <p className="text-xs font-semibold text-ink-300">{f.domain}</p>
                <p className="mt-0.5 text-sm text-ink-300">{f.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Learning centers — the core of the DAP shape */}
      {centers.length > 0 && (
        <Section
          title="Learning Centers"
          icon={Blocks}
          copyText={centers
            .map((c) => `${c.name}\nInvitation: ${c.invitation}\nMaterials: ${(c.materials ?? []).join(', ')}\nTeacher moves: ${c.teacher_moves}`)
            .join('\n\n')}
        >
          <div className="space-y-3">
            {centers.map((c, i) => (
              <div key={i} className="rounded-lg border border-ink-800 bg-ink-900/60 p-4">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-grass-500/25 text-xs font-semibold text-ink-50">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-ink-100">{c.name}</p>
                  {(c.domains ?? []).map((d, di) => (
                    <span key={di} className="rounded bg-grass-500/10 px-1.5 py-0.5 text-[10px] font-medium text-ink-50">
                      {d}
                    </span>
                  ))}
                </div>
                {c.invitation && <p className="text-sm text-ink-300">{c.invitation}</p>}
                {(c.materials ?? []).length > 0 && (
                  <p className="mt-2 text-xs text-ink-400">
                    <span className="font-semibold text-ink-300">Materials: </span>
                    {(c.materials ?? []).join(', ')}
                  </p>
                )}
                {c.teacher_moves && (
                  <p className="mt-1.5 text-xs text-ink-400">
                    <span className="font-semibold text-grass-400">Teacher moves: </span>
                    {c.teacher_moves}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Circle time */}
      {(circle.opening || circle.read_aloud || circle.music_movement || circle.shared_wondering) && (
        <Section
          title="Circle Time (large group)"
          icon={Users}
          copyText={[
            circle.opening && `Opening: ${circle.opening}`,
            circle.read_aloud && `Read-aloud: ${circle.read_aloud}`,
            circle.music_movement && `Music & movement: ${circle.music_movement}`,
            circle.shared_wondering && `Shared wondering: ${circle.shared_wondering}`,
          ].filter(Boolean).join('\n')}
        >
          <dl className="space-y-2">
            <Field label="Opening" value={circle.opening} />
            <Field label="Read-aloud" value={circle.read_aloud} />
            <Field label="Music & movement" value={circle.music_movement} />
            <Field label="Shared wondering" value={circle.shared_wondering} />
          </dl>
        </Section>
      )}

      {/* Guided small-group play */}
      {(smallGroup.focus || smallGroup.activity || smallGroup.teacher_scaffolds) && (
        <Section
          title="Guided Small-Group Play"
          copyText={[
            smallGroup.focus && `Focus: ${smallGroup.focus}`,
            smallGroup.activity && `Activity: ${smallGroup.activity}`,
            smallGroup.teacher_scaffolds && `Scaffolds: ${smallGroup.teacher_scaffolds}`,
          ].filter(Boolean).join('\n')}
        >
          <dl className="space-y-2">
            <Field label="Focus" value={smallGroup.focus} />
            <Field label="Activity" value={smallGroup.activity} />
            <Field label="Teacher scaffolds" value={smallGroup.teacher_scaffolds} />
          </dl>
        </Section>
      )}

      {lesson.outdoor_gross_motor && (
        <Section title="Outdoor & Gross-Motor Play" icon={Sun} copyText={lesson.outdoor_gross_motor}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.outdoor_gross_motor}</p>
        </Section>
      )}

      {lesson.routines_transitions && (
        <Section title="Routines & Playful Transitions" icon={Repeat} copyText={lesson.routines_transitions}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.routines_transitions}</p>
        </Section>
      )}

      {/* Observation-based, authentic assessment */}
      {(lesson.observation_look_fors ?? []).length > 0 && (
        <Section
          title="Observation Look-Fors"
          icon={Eye}
          copyText={(lesson.observation_look_fors ?? []).map((i) => `- ${i}`).join('\n')}
        >
          <p className="mb-2 text-xs text-ink-500">
            Authentic, play-based observation (NAEYC Standard 3) — notice &amp; document, never test.
          </p>
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {(lesson.observation_look_fors ?? []).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </Section>
      )}

      {lesson.family_connection && (
        <Section title="Family Connection" icon={Home} copyText={lesson.family_connection}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.family_connection}</p>
        </Section>
      )}

      {/* Standards stack */}
      {(standards.naeyc_dap || naeycStandards.length > 0 || elof.length > 0) && (
        <Section
          title="Standards Alignment"
          copyText={[
            standards.naeyc_dap && `NAEYC DAP: ${standards.naeyc_dap}`,
            ...naeycStandards.map((s) => `[NAEYC] ${s.code} — ${s.text}`),
            ...elof.map((e) => `[Head Start ELOF] ${e.domain} — ${e.text}`),
          ].filter(Boolean).join('\n')}
        >
          {standards.naeyc_dap && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-ink-300">NAEYC — Developmentally Appropriate Practice</p>
              <p className="mt-0.5 text-sm text-ink-300">{standards.naeyc_dap}</p>
            </div>
          )}

          {naeycStandards.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold text-ink-300">NAEYC Professional Standards &amp; Competencies</p>
              <ul className="space-y-1.5 text-ink-300">
                {naeycStandards.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className="rounded bg-grass-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{s.code}</span>
                    <span className="ml-1">{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {elof.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-ink-300">Head Start Early Learning Outcomes Framework (ELOF)</p>
              <ul className="space-y-1.5 text-ink-300">
                {elof.map((e, i) => (
                  <li key={i} className="text-sm">
                    <span className="rounded bg-grass-500/15 px-1.5 py-0.5 text-xs font-semibold text-ink-50">{e.domain}</span>
                    <span className="ml-1">{e.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {standards.state_verification_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 print:border-ink-300">
          <Info size={15} className="mt-0.5 shrink-0 text-ink-500" />
          <p className="text-xs text-ink-400">{standards.state_verification_note}</p>
        </div>
      )}

      {lesson.teacher_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-grass-500/25 bg-grass-500/5 px-4 py-3">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-grass-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Note: </span>{lesson.teacher_note}</p>
        </div>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-400">{label}</dt>
      <dd className="text-sm text-ink-300 whitespace-pre-line">{value}</dd>
    </div>
  )
}

function Section({ title, icon: Icon, copyText, children }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable; ignore.
    }
  }
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between lesson-section-rule">
        <h3 className="label-eyebrow text-ink-400 flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-grass-400" />}
          <span>{title}</span>
        </h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-grass-400 transition-colors print:hidden"
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
