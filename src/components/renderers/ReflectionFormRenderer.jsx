/**
 * Reflection / Reset Form — a short, non-punitive form a student fills out during
 * a cool-down. Printable "paper" look; the teacher's accent color prints via the
 * .cm-print-root rules in index.css. Checkboxes + write-lines are for hand-filling.
 *
 * @param {{ form: object, teacherName?: string, gradeBand?: string, classContext?: string, accentHex: string }} props
 */
export default function ReflectionFormRenderer({ form, teacherName, gradeBand = '6-8', classContext, accentHex }) {
  if (!form) return null
  const {
    heading = 'Take a Reset',
    intro = '',
    what_happened = {},
    do_differently = {},
    need_now = {},
    closing = '',
  } = form

  return (
    <div
      className="cm-print-root mx-auto max-w-[840px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
      style={{ '--cm-accent': accentHex }}
    >
      <header className="cm-accent-bar px-7 py-5 text-white" style={{ backgroundColor: accentHex }}>
        <p className="text-lg font-bold leading-tight">{heading}</p>
        <p className="mt-0.5 text-sm font-medium opacity-90">
          {teacherName?.trim() || 'My Classroom'} · Grades {gradeBand}{classContext?.trim() ? ` · ${classContext.trim()}` : ''}
        </p>
      </header>

      <div className="space-y-5 p-7">
        {/* Name / date line */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
          <span className="flex-1">Name: <span className="inline-block min-w-[160px] border-b border-slate-300">&nbsp;</span></span>
          <span>Date: <span className="inline-block min-w-[110px] border-b border-slate-300">&nbsp;</span></span>
        </div>

        {intro && <p className="text-sm italic text-slate-600">{intro}</p>}

        <FormSection accentHex={accentHex} section={what_happened} fallbackPrompt="What happened?" />
        <FormSection accentHex={accentHex} section={do_differently} fallbackPrompt="What could I do differently next time?" />
        <FormSection accentHex={accentHex} section={need_now} fallbackPrompt="One thing I need right now:" />

        {closing && (
          <p className="cm-accent-text pt-1 text-sm font-medium" style={{ color: accentHex }}>{closing}</p>
        )}
      </div>
    </div>
  )
}

function FormSection({ section, accentHex, fallbackPrompt }) {
  const prompt = section?.prompt || fallbackPrompt
  const options = section?.options ?? []
  return (
    <section>
      <h3
        className="cm-accent-border cm-accent-text mb-2 border-b-2 pb-1 text-sm font-bold"
        style={{ color: accentHex, borderColor: accentHex }}
      >
        {prompt}
      </h3>
      {options.length > 0 && (
        <div className="mb-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {options.map((opt, i) => (
            <label key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-slate-400" />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
      {/* Blank write-lines for open response */}
      <div className="space-y-4 pt-1">
        <div className="border-b border-slate-300">&nbsp;</div>
        <div className="border-b border-slate-300">&nbsp;</div>
      </div>
    </section>
  )
}
