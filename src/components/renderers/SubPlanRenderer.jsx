import './PlanBookRenderer.css'

function formatGrade(g) {
  return g === 0 ? "K" : String(g)
}

/**
 * Sub Plan renderer — Renderer #2.
 *
 * Pure template over the sub_* fields of a LessonObject (already
 * populated by a prior generation call). No AI calls here.
 *
 * Designed to be handed to a substitute with zero PE jargon: a
 * step-by-step script, a setup diagram, and a behavior management
 * script.
 *
 * @param {{ lesson: import("../../types/lessonObject").LessonObject }} props
 */
export default function SubPlanRenderer({ lesson }) {
  if (!lesson) return null

  return (
    <div className="card lesson-doc p-8 space-y-6">
      <header className="lesson-header-band space-y-2">
        <div className="flex items-center justify-between text-sm text-ink-400">
          <span>For your substitute</span>
          <span>
            {lesson.grade_bands?.length ? `Grades ${lesson.grade_bands.map(formatGrade).join('/')}` : ''}
          </span>
        </div>
        <h2 className="lesson-title text-ink-50">
          {lesson.title} — Sub Plan
        </h2>
      </header>

      <Section title="Quick Start">
        <p className="text-ink-300">{lesson.sub_friendly_instructions}</p>
      </Section>

      <Section title="Step-by-Step Script">
        <p className="text-ink-300 whitespace-pre-line">{lesson.sub_script}</p>
      </Section>

      <Section title="Managing the Class">
        <p className="text-ink-300 whitespace-pre-line">{lesson.sub_management_script}</p>
      </Section>

      <Section title="Equipment & Location">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-ink-200 mb-1">Equipment</p>
            <ul className="list-disc list-inside space-y-1 text-ink-300">
              {(lesson.equipment_needed ?? []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-200 mb-1">Location</p>
            <p className="text-ink-300">{lesson.location}</p>
          </div>
        </div>
      </Section>

      {lesson.safety_notes?.length > 0 && (
        <Section title="Safety Notes">
          <ul className="list-disc list-inside space-y-1 text-ink-300">
            {lesson.safety_notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="label-eyebrow text-ink-400 lesson-section-rule">
        {title}
      </h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  )
}
