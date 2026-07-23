/**
 * Troubleshoot a Behavior — a text answer (not a visual poster). Shows 3–4
 * concrete "things to try" strategies with a why-it-works note, an optional
 * escalation nudge, and a fixed disclaimer footer. Handles the guardrail case
 * where the input isn't a plausible classroom behavior challenge (usable=false).
 *
 * @param {{ result: object, challenge?: string, teacherName?: string, gradeBand?: string, classContext?: string, accentHex: string }} props
 */
const DISCLAIMER =
  'These are general strategy ideas to try and adapt — not a formal behavior plan, FBA, or IEP-team decision. For ongoing or safety concerns, loop in your school counselor, administrator, or the student’s case manager.'

export default function TroubleshootRenderer({ result, challenge, teacherName, gradeBand = '6-8', classContext, accentHex }) {
  if (!result) return null
  const { usable = true, message = '', strategies = [], escalation_note = '' } = result

  return (
    <div
      className="cm-print-root mx-auto max-w-[840px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
      style={{ '--cm-accent': accentHex }}
    >
      <header className="cm-accent-bar px-7 py-4 text-white" style={{ backgroundColor: accentHex }}>
        <p className="text-base font-bold leading-tight">Behavior Troubleshooter</p>
        <p className="mt-0.5 text-sm font-medium opacity-90">
          {teacherName?.trim() || 'My Classroom'} · Grades {gradeBand}{classContext?.trim() ? ` · ${classContext.trim()}` : ''}
        </p>
      </header>

      <div className="space-y-5 p-7">
        {challenge?.trim() && (
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-600">Challenge:</span> &ldquo;{challenge.trim()}&rdquo;
          </p>
        )}

        {message && <p className="text-sm leading-relaxed text-slate-700">{message}</p>}

        {usable && strategies.length > 0 && (
          <div className="space-y-4">
            {strategies.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <p className="cm-accent-text text-sm font-bold" style={{ color: accentHex }}>
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-800">{s.what_to_try}</p>
                {s.why_it_works && (
                  <p className="mt-1.5 text-xs italic text-slate-500">Why it works: {s.why_it_works}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {escalation_note && (
          <div className="cm-accent-border rounded-lg border-l-4 bg-slate-50 p-3 text-sm text-slate-700" style={{ borderColor: accentHex }}>
            {escalation_note}
          </div>
        )}

        <p className="border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-400">{DISCLAIMER}</p>
      </div>
    </div>
  )
}
