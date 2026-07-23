/**
 * Parent Communication Note (Classroom Management module) — a printable note
 * home, either an INCIDENT note (collaborative, non-alarming) or a POSITIVE
 * "caught being good" note. AI-generated: the teacher supplies the specifics,
 * Claude drafts the note. Renders as a letter: accent title bar, greeting, body
 * paragraphs, sign-off, teacher name. Handles the guardrail case (usable=false).
 *
 * Distinct from the lesson-planning ParentNoteRenderer (different module/shape).
 *
 * @param {{ note: object, signatureName?: string, teacherName?: string, classContext?: string, accentHex: string }} props
 */
export default function ParentCommunicationRenderer({ note, signatureName, teacherName, classContext, accentHex }) {
  if (!note) return null
  const { usable = true, message = '', title = '', greeting = '', paragraphs = [], closing = '' } = note

  // Guardrail: the teacher's input wasn't a usable incident/positive description.
  if (!usable) {
    return (
      <div className="cm-print-root mx-auto max-w-[760px] rounded-2xl border border-slate-200 bg-white p-7 text-slate-700 shadow-sm" style={{ '--cm-accent': accentHex }}>
        <p className="text-sm leading-relaxed">{message || 'Add a few specifics about what happened and I’ll draft the note.'}</p>
      </div>
    )
  }

  // Sign-off is the teacher's actual name; the class/subject appears as a small
  // secondary line beneath it (a real signature block, not "name · subject").
  const signature = signatureName?.trim() || teacherName?.trim() || 'Your child’s teacher'
  const subjectLine = classContext?.trim()

  return (
    <div
      className="cm-print-root mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
      style={{ '--cm-accent': accentHex }}
    >
      {title && (
        <header className="cm-accent-bar px-8 py-4 text-white" style={{ backgroundColor: accentHex }}>
          <p className="text-base font-bold leading-tight">{title}</p>
        </header>
      )}

      <div className="space-y-4 px-8 py-7 text-[15px] leading-relaxed">
        {greeting && <p>{greeting}</p>}

        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}

        <div className="pt-2">
          {closing && <p>{closing}</p>}
          <p className="cm-accent-text font-semibold" style={{ color: accentHex }}>{signature}</p>
          {subjectLine && <p className="text-sm text-slate-500">{subjectLine}</p>}
        </div>
      </div>
    </div>
  )
}
