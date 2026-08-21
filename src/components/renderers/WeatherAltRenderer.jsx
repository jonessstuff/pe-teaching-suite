/**
 * Weather Alternative renderer.
 *
 * Displays the indoor-alternative version of a lesson. All learning
 * targets, standards, and success criteria are unchanged from the
 * original — only the lesson flow, location, and equipment are shown
 * here as adapted for an indoor setting.
 *
 * @param {{ lesson: import("../../types/lessonObject").LessonObject }} props
 */

import { useState } from 'react'
import { CloudRain, Copy, Check } from 'lucide-react'

export default function WeatherAltRenderer({ lesson }) {
  if (!lesson) return null

  const isAlreadyIndoor = !lesson.weather_alt_warm_up && lesson.weather_alt_notes

  return (
    <div className="card lesson-doc p-8 space-y-6">
      {/* Header */}
      <header className="lesson-header-band space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/25">
            <CloudRain size={18} className="text-sky-300" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-300">Indoor Alternative</p>
            <p className="text-xs text-brand-200 mt-0.5">Use this version if outdoor space isn't available.</p>
          </div>
        </div>
        <h2 className="lesson-title text-ink-50">{lesson.title}</h2>
        {lesson.unit && <p className="text-sm text-ink-400">{lesson.unit}</p>}
      </header>

      {/* Already-indoor notice */}
      {isAlreadyIndoor ? (
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-5">
          <p className="text-sm text-ink-300">{lesson.weather_alt_notes}</p>
        </div>
      ) : (
        <>
          {/* Indoor location + equipment */}
          <Section
            title="Indoor Location & Equipment"
            copyText={[
              `Location: ${lesson.weather_alt_location ?? ''}`,
              `Equipment:\n${(lesson.weather_alt_equipment_needed ?? []).map((i) => `- ${i}`).join('\n')}`,
              lesson.weather_alt_setup_diagram ? `Setup:\n${lesson.weather_alt_setup_diagram}` : '',
            ].filter(Boolean).join('\n\n')}
          >
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-ink-200 mb-1">Location</p>
                <p className="text-ink-300">{lesson.weather_alt_location ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-200 mb-1">Equipment</p>
                <ul className="list-disc list-inside space-y-1 text-ink-300">
                  {(lesson.weather_alt_equipment_needed ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              {lesson.weather_alt_setup_diagram && (
                <div>
                  <p className="text-sm font-semibold text-ink-200 mb-1">Setup diagram</p>
                  <pre className="text-xs text-ink-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {lesson.weather_alt_setup_diagram}
                  </pre>
                </div>
              )}
            </div>
          </Section>

          {/* Indoor lesson flow */}
          <Section
            title="Indoor Lesson Flow"
            copyText={[
              `Warm Up\n${lesson.weather_alt_warm_up ?? ''}`,
              `Fitness Activities\n${lesson.weather_alt_fitness_activities ?? ''}`,
              `Whole Group Lesson Instruction\n${lesson.weather_alt_whole_group_instruction ?? ''}`,
              `Independent Practice\n${lesson.weather_alt_independent_practice ?? ''}`,
              `Closure (Cool Down)\n${lesson.weather_alt_closure ?? ''}`,
            ].join('\n\n')}
          >
            <AltBlock label="Warm Up" text={lesson.weather_alt_warm_up} />
            <AltBlock label="Fitness Activities" text={lesson.weather_alt_fitness_activities} />
            <AltBlock label="Whole Group Lesson Instruction" text={lesson.weather_alt_whole_group_instruction} />
            <AltBlock label="Independent Practice" text={lesson.weather_alt_independent_practice} />
            <AltBlock label="Closure (Cool Down)" text={lesson.weather_alt_closure} />
          </Section>

          {/* Teacher notes */}
          {lesson.weather_alt_notes && (
            <Section title="Teacher Notes" copyText={lesson.weather_alt_notes}>
              <p className="text-ink-300 whitespace-pre-line">{lesson.weather_alt_notes}</p>
            </Section>
          )}
        </>
      )}

      {/* Reminder: unchanged elements */}
      <div className="rounded-lg border border-ink-900 bg-ink-950/50 px-5 py-4">
        <p className="text-xs font-semibold text-ink-400 mb-1">Unchanged from original lesson</p>
        <p className="text-xs text-ink-600">
          Learning targets · Standards · Success criteria · Skill focus · Modifications · Vocabulary · Routines
        </p>
      </div>
    </div>
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
      <div className="lesson-section-rule flex items-center justify-between pb-1">
        <h3 className="lesson-section-title text-ink-200">{title}</h3>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-ink-400 hover:text-accent-400 transition-colors print:hidden"
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

function AltBlock({ label, text }) {
  if (!text) return null
  return (
    <div className="mb-3">
      <p className="lesson-block-title text-ink-200">{label}</p>
      <p className="mt-1 text-ink-300 whitespace-pre-line">{text}</p>
    </div>
  )
}
