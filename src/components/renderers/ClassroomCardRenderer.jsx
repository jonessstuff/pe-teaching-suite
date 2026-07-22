/**
 * Classroom Management quick-reference card — the print/laminate artifact.
 *
 * Renders as a light "paper" card (even in the app's dark theme) so the on-screen
 * preview matches the printed output. The teacher's chosen accent color is applied
 * via the --cm-accent CSS variable and prints in color (see .cm-print-root rules in
 * index.css, which override the global black-and-white print reset).
 *
 * @param {{ card: object, teacherName?: string, gradeBand?: string, accentHex: string }} props
 */
export default function ClassroomCardRenderer({ card, teacherName, gradeBand = '6-8', accentHex }) {
  if (!card) return null

  const {
    heading = 'Classroom Management — Quick Reference',
    attention_signals = [],
    entry_routine = [],
    exit_routine = [],
    equipment_distribution = [],
    large_group_strategies = [],
    behavior_expectations = [],
  } = card

  return (
    <div
      className="cm-print-root mx-auto max-w-[840px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
      style={{ '--cm-accent': accentHex }}
    >
      {/* Accent header bar */}
      <header className="cm-accent-bar px-7 py-5 text-white" style={{ backgroundColor: accentHex }}>
        <p className="text-lg font-bold leading-tight">{teacherName?.trim() || 'My Classroom'}</p>
        <p className="mt-0.5 text-sm font-medium opacity-90">
          Grades {gradeBand} · {heading}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-7 sm:grid-cols-2">
        {/* Attention Signals (full width — it's the anchor of the card) */}
        <Section title="Attention Signals" accentHex={accentHex} className="sm:col-span-2">
          <ul className="space-y-1.5">
            {attention_signals.map((s, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm leading-snug">
                <span className="cm-accent-text font-semibold" style={{ color: accentHex }}>
                  {s.signal}
                </span>
                <span className="text-slate-400">→</span>
                <span>{s.meaning}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Entry Routine" accentHex={accentHex}>
          <OrderedList items={entry_routine} accentHex={accentHex} />
        </Section>

        <Section title="Exit Routine" accentHex={accentHex}>
          <OrderedList items={exit_routine} accentHex={accentHex} />
        </Section>

        <Section title="Equipment Distribution" accentHex={accentHex}>
          <BulletList items={equipment_distribution} accentHex={accentHex} />
        </Section>

        <Section title="Large-Group Strategies" accentHex={accentHex}>
          <BulletList items={large_group_strategies} accentHex={accentHex} />
        </Section>

        <Section title="Behavior Expectations" accentHex={accentHex} className="sm:col-span-2">
          <BulletList items={behavior_expectations} accentHex={accentHex} />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, accentHex, className = '', children }) {
  return (
    <section className={className}>
      <h3
        className="cm-accent-border cm-accent-text mb-2 border-b-2 pb-1 text-xs font-bold uppercase tracking-wide"
        style={{ color: accentHex, borderColor: accentHex }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

function OrderedList({ items, accentHex }) {
  return (
    <ol className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-snug">
          <span
            className="cm-accent-text shrink-0 font-bold tabular-nums"
            style={{ color: accentHex }}
          >
            {i + 1}.
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function BulletList({ items, accentHex }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-snug">
          <span className="cm-accent-bg mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accentHex }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
