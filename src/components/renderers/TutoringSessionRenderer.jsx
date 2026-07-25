import { useState } from 'react'
import { Copy, Check, Info, Mail, Zap } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

// Accent per subject — literal class strings so Tailwind's JIT compiles them.
const ACCENTS = {
  'Reading Specialists': {
    text: 'text-sky-400', text3: 'text-ink-300', chip: 'bg-sky-500/15 text-sky-400',
    num: 'bg-sky-500/25 text-ink-300', box: 'border-sky-500/25 bg-sky-500/5', hover: 'hover:text-sky-400',
  },
  'Math Specialists': {
    text: 'text-lime-400', text3: 'text-ink-300', chip: 'bg-lime-500/15 text-lime-400',
    num: 'bg-lime-500/25 text-ink-300', box: 'border-lime-500/25 bg-lime-500/5', hover: 'hover:text-lime-400',
  },
}

export default function TutoringSessionRenderer({ lesson }) {
  if (!lesson) return null
  const a = ACCENTS[lesson.subject] ?? ACCENTS['Reading Specialists']
  return lesson.tutoring_type === 'in_class'
    ? <InClassSession lesson={lesson} a={a} />
    : <PrivateSession lesson={lesson} a={a} />
}

// ─── Private / after-school ──────────────────────────────────────────────────
function PrivateSession({ lesson, a }) {
  const bands = lesson.grade_bands ?? []
  const ps = lesson.parent_summary ?? {}
  const parentText = [
    ps.covered_today ? `What we covered today:\n${ps.covered_today}` : '',
    ps.practice_before_next ? `To practice before next session:\n${ps.practice_before_next}` : '',
    ps.note_to_family ? `\n${ps.note_to_family}` : '',
  ].filter(Boolean).join('\n\n')

  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <span className={`label-eyebrow rounded px-2 py-0.5 ${a.chip}`}>
          Tutoring · Private / After-School
          {lesson.session_label ? ` · ${lesson.session_label}` : ''}
          {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
        </span>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.topic_area, lesson.focus].filter(Boolean).join(' · ')}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
          {lesson.group_size_label ? ` · ${lesson.group_size_label}` : ''}
        </p>
      </header>

      {lesson.session_objective && (
        <Section title="Session Objective" copyText={lesson.session_objective} a={a}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.session_objective}</p>
        </Section>
      )}

      <Section
        title="Session Plan"
        a={a}
        copyText={['Warm-up', lesson.warm_up, '\nTeaching focus', lesson.teaching_focus, '\nGuided practice', lesson.guided_practice, '\nIndependent application', lesson.independent_application, '\nWrap-up', lesson.wrap_up].filter(Boolean).join('\n')}
      >
        <div className="space-y-3">
          <Block label="Warm-up" text={lesson.warm_up} />
          <Block label="Teaching focus" text={lesson.teaching_focus} />
          <Block label="Guided practice" text={lesson.guided_practice} />
          <Block label="Independent application" text={lesson.independent_application} />
          <Block label="Wrap-up" text={lesson.wrap_up} />
        </div>
      </Section>

      <BulletSection title="Materials" items={lesson.materials} a={a} />

      {/* Parent-facing summary — professional, copyable/emailable */}
      {(ps.covered_today || ps.practice_before_next) && (
        <Section title="Parent Summary" copyText={parentText} a={a}>
          <div className={`rounded-lg border px-4 py-3 ${a.box}`}>
            <div className="mb-2 flex items-center gap-2">
              <Mail size={15} className={a.text} />
              <span className="text-sm font-semibold text-ink-100">Hand off or email to the family</span>
            </div>
            {ps.covered_today && (
              <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">What we covered today: </span>{ps.covered_today}</p>
            )}
            {ps.practice_before_next && (
              <p className="mt-1.5 text-sm text-ink-300"><span className="font-medium text-ink-200">To practice before next session: </span>{ps.practice_before_next}</p>
            )}
            {ps.note_to_family && (
              <p className="mt-1.5 text-sm italic text-ink-400">{ps.note_to_family}</p>
            )}
          </div>
        </Section>
      )}

      {lesson.next_session_preview && (
        <Section title="Next Session Preview" copyText={lesson.next_session_preview} a={a}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.next_session_preview}</p>
        </Section>
      )}

      <StandardsBlock items={lesson.standards_alignment} a={a} />
      <NoteLine text={lesson.instructional_note} />
    </div>
  )
}

// ─── In-class pull-aside ─────────────────────────────────────────────────────
function InClassSession({ lesson, a }) {
  const bands = lesson.grade_bands ?? []
  const steps = lesson.steps ?? []
  return (
    <div className="card max-w-3xl mx-auto p-8 space-y-6">
      <header className="space-y-2 border-b border-ink-900 pb-4">
        <span className={`label-eyebrow rounded px-2 py-0.5 ${a.chip}`}>
          Tutoring · In-Class Pull-Aside
          {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
        </span>
        <h2 className="text-2xl font-display font-semibold text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {[lesson.topic_area, lesson.focus].filter(Boolean).join(' · ')}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ''}
          {lesson.group_size_label ? ` · ${lesson.group_size_label}` : ''}
        </p>
      </header>

      {lesson.class_just_covered && (
        <div className="rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3">
          <p className="text-xs font-semibold text-ink-400 mb-0.5">Reinforcing what the class just covered</p>
          <p className="text-sm text-ink-300">{lesson.class_just_covered}</p>
        </div>
      )}

      {lesson.quick_reteach && (
        <Section title="Quick Re-Teach" copyText={lesson.quick_reteach} a={a}>
          <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 ${a.box}`}>
            <Zap size={15} className={`mt-0.5 shrink-0 ${a.text}`} />
            <p className="text-sm text-ink-200">{lesson.quick_reteach}</p>
          </div>
        </Section>
      )}

      {steps.length > 0 && (
        <Section title="Steps" a={a} copyText={steps.map((s, i) => `${i + 1}. ${s.step}: ${s.what_you_do}`).join('\n')}>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${a.num}`}>{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{s.step}</p>
                </div>
                <p className="text-sm text-ink-300">{s.what_you_do}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <BulletSection title="Checks for Understanding" items={lesson.checks_for_understanding} a={a} />

      {lesson.common_error_and_fix && (
        <Section title="Common Error & Fix" copyText={lesson.common_error_and_fix} a={a}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.common_error_and_fix}</p>
        </Section>
      )}

      <BulletSection title="Materials (grab-and-go)" items={lesson.materials} a={a} />

      {(lesson.if_they_get_it || lesson.if_still_stuck) && (
        <Section
          title="Quick Next Move"
          a={a}
          copyText={[lesson.if_they_get_it ? `If they get it: ${lesson.if_they_get_it}` : '', lesson.if_still_stuck ? `If still stuck: ${lesson.if_still_stuck}` : ''].filter(Boolean).join('\n')}
        >
          <div className="space-y-2">
            {lesson.if_they_get_it && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">If they get it: </span>{lesson.if_they_get_it}</p>}
            {lesson.if_still_stuck && <p className="text-sm text-ink-300"><span className="font-medium text-ink-200">If still stuck: </span>{lesson.if_still_stuck}</p>}
          </div>
        </Section>
      )}

      <StandardsBlock items={lesson.standards_alignment} a={a} />
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function Block({ label, text }) {
  if (!text) return null
  return (
    <div>
      <p className="text-sm font-semibold text-ink-200">{label}</p>
      <p className="mt-0.5 text-sm text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}

function BulletSection({ title, items, a }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section title={title} copyText={list.map((i) => `- ${i}`).join('\n')} a={a}>
      <ul className="list-disc list-inside space-y-1 text-ink-300">
        {list.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </Section>
  )
}

function StandardsBlock({ items, a }) {
  const list = items ?? []
  if (list.length === 0) return null
  return (
    <Section title="Standards Alignment" copyText={list.map((s) => `[${s.framework}] ${s.text}`).join('\n')} a={a}>
      <ul className="space-y-1.5 text-ink-300">
        {list.map((s, i) => (
          <li key={i} className="text-sm">
            <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${a.chip}`}>{s.framework}</span>
            <span className="ml-1">— {s.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function NoteLine({ text }) {
  if (!text) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3 print:border-ink-300">
      <Info size={15} className="mt-0.5 shrink-0 text-ink-500" />
      <p className="text-xs text-ink-400">{text}</p>
    </div>
  )
}

function Section({ title, copyText, children, a }) {
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
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b border-ink-900 pb-1">
        <h3 className="label-eyebrow text-ink-400">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 text-xs text-ink-400 ${a.hover} transition-colors print:hidden`}
            title="Copy this section to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div className="text-sm text-ink-200 leading-relaxed">{children}</div>
    </section>
  )
}
