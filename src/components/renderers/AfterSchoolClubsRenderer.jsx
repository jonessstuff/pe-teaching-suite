import { useState } from 'react'
import { Copy, Check, ShieldAlert, Sparkles, Clock } from 'lucide-react'

function formatGrade(g) {
  return g === 0 ? 'K' : String(g)
}

export default function AfterSchoolClubsRenderer({ lesson }) {
  if (!lesson) return null
  const bands = lesson.grade_bands ?? []
  const structure = lesson.session_structure ?? []

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-eyebrow rounded px-2 py-0.5 bg-coral-500/15 text-ink-50">
            {lesson.club_category || 'Club'}
            {bands.length > 0 ? ` · Grade${bands.length > 1 ? 's' : ''} ${bands.map(formatGrade).join('/')}` : ''}
          </span>
          {lesson.band_label && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-coral-500/20 text-ink-50">{lesson.band_label}</span>
          )}
          {lesson.club_type && (
            <span className="rounded px-2 py-0.5 text-xs font-semibold bg-ink-800 text-ink-200">{lesson.club_type}</span>
          )}
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        <p className="text-sm text-ink-400">
          {lesson.group_summary}
          {lesson.meeting_length_minutes ? ` · ${lesson.meeting_length_minutes} min meeting` : ''}
        </p>
      </header>

      {lesson.session_overview && (
        <Section title="Session Overview" copyText={lesson.session_overview}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.session_overview}</p>
        </Section>
      )}

      {/* Session structure — the ready-to-run spine */}
      {structure.length > 0 && (
        <Section
          title="Session Structure"
          copyText={structure.map((s) => `${s.segment}${s.minutes ? ` (${s.minutes} min)` : ''}\n${s.what_to_do}`).join('\n\n')}
        >
          <div className="space-y-3">
            {structure.map((s, i) => (
              <div key={i} className="rounded-lg bg-ink-900 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral-500/25 text-xs font-semibold text-ink-50">{i + 1}</span>
                  <p className="text-sm font-semibold text-ink-100">{s.segment}</p>
                  {s.minutes ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-400">
                      <Clock size={12} /> {s.minutes} min
                    </span>
                  ) : null}
                </div>
                {s.what_to_do && <p className="text-sm text-ink-300 whitespace-pre-line">{s.what_to_do}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* First vs ongoing meeting variants */}
      {(lesson.first_meeting || lesson.ongoing_meeting) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {lesson.first_meeting && (
            <div className="rounded-lg border border-coral-500/25 bg-coral-500/5 px-4 py-3">
              <p className="text-xs font-semibold text-coral-400 mb-1">First meeting</p>
              <p className="text-sm text-ink-300 whitespace-pre-line">{lesson.first_meeting}</p>
            </div>
          )}
          {lesson.ongoing_meeting && (
            <div className="rounded-lg border border-ink-800 bg-ink-900/50 px-4 py-3">
              <p className="text-xs font-semibold text-ink-300 mb-1">Ongoing meeting</p>
              <p className="text-sm text-ink-300 whitespace-pre-line">{lesson.ongoing_meeting}</p>
            </div>
          )}
        </div>
      )}

      <BulletSection title="Materials" items={lesson.materials} />
      <BulletSection title="Student Voice & Choice" items={lesson.student_voice_and_choice} />

      {lesson.leadership_opportunities && (
        <Section title="Leadership Opportunities" copyText={lesson.leadership_opportunities}>
          <p className="text-ink-300 whitespace-pre-line">{lesson.leadership_opportunities}</p>
        </Section>
      )}

      <BulletSection title="Facilitation Tips" items={lesson.facilitation_tips} />
      <BulletSection title="Variations & Extensions" items={lesson.variations_and_extensions} />

      {/* Safety note — prominent when present */}
      {lesson.safety_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Safety: </span>{lesson.safety_note}</p>
        </div>
      )}

      {/* Sponsor note — reassuring "you can run this" */}
      {lesson.sponsor_note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-coral-500/25 bg-coral-500/5 px-4 py-3">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-coral-400" />
          <p className="text-xs text-ink-300"><span className="font-medium text-ink-300">Sponsor note: </span>{lesson.sponsor_note}</p>
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
        {list.map((item, i) => <li key={i}>{item}</li>)}
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
      // Clipboard unavailable; ignore.
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
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-coral-400 transition-colors print:hidden"
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
