import { gradeBandsLabel } from '../../types/lessonObject'

// One fast, teacher-facing view for every module. Each generator saves a
// slightly different lesson shape, so these groups include common equivalents
// rather than assuming the PE-only field names.
const PHASE_GROUPS = [
  { label: 'Prepare', fields: ['teacher_prep', 'preparation', 'setup_instructions', 'room_setup'] },
  { label: 'Open & connect', fields: ['warm_up', 'opening', 'hook', 'anticipatory_set', 'circle_time', 'introduction'] },
  { label: 'Teach & model', fields: ['whole_group_instruction', 'direct_instruction', 'mini_lesson', 'explicit_instruction', 'modeling', 'teacher_modeling', 'lesson_content'] },
  { label: 'Practice & apply', fields: ['fitness_activities', 'guided_practice', 'independent_practice', 'main_activity', 'activity_sequence', 'session_activities', 'activities', 'learning_centers', 'centers', 'group_activity'] },
  { label: 'Close & reflect', fields: ['closure', 'cool_down', 'reflection', 'debrief', 'exit_prompt', 'wrap_up'] },
]

const TARGET_FIELDS = ['learning_target', 'learning_targets', 'objectives', 'learning_objectives', 'student_objectives', 'session_goals', 'goals']
const MATERIAL_FIELDS = ['equipment_needed', 'materials_needed', 'materials', 'supplies', 'resources_needed']
const SAFETY_FIELDS = ['safety_notes', 'safety', 'precautions', 'considerations']
const SETUP_FIELDS = ['location', 'setting', 'environment', 'room_setup']
const GENERIC_SKIP = /^(title|subject|grade|grade_bands|duration|duration_minutes|standards|standard|metadata|unit|mode|tier|visual_resources|quiz|rubric|parent_note)/i

function flattenText(value, depth = 0) {
  if (depth > 3 || value == null || value === false) return []
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).replace(/\s+/g, ' ').trim()
    return text ? [text] : []
  }
  if (Array.isArray(value)) return value.flatMap((item) => flattenText(item, depth + 1))
  if (typeof value === 'object') return Object.values(value).flatMap((item) => flattenText(item, depth + 1))
  return []
}

function firstContent(lo, fields) {
  for (const field of fields) {
    const lines = flattenText(lo?.[field])
    if (lines.length) return { field, value: lo[field], lines }
  }
  return null
}

function extractTiming(value) {
  const text = flattenText(value).join(' ')
  const match = text.match(/(\d+\s*[–-]\s*\d+|\d+)\s*(?:min\b|minutes)/i)
  return match ? match[0].replace(/minutes/i, 'min') : null
}

function keyCues(value) {
  const lines = flattenText(value)
  if (!lines.length) return []
  const parts = lines.length > 1
    ? lines
    : lines[0].split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean)
  return parts.slice(0, 4).map((cue) => cue.length > 165 ? `${cue.slice(0, 162).trimEnd()}…` : cue)
}

function labelForField(field) {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function resolvePhases(lo) {
  const used = new Set()
  const phases = PHASE_GROUPS.flatMap((group) => {
    const found = firstContent(lo, group.fields.filter((field) => !used.has(field)))
    if (!found) return []
    used.add(found.field)
    return [{ ...group, ...found }]
  })
  if (phases.length) return phases

  // Safe fallback for older/specialist records with uncommon field names.
  return Object.entries(lo ?? {})
    .filter(([field, value]) => !GENERIC_SKIP.test(field) && flattenText(value).join(' ').length > 35)
    .slice(0, 5)
    .map(([field, value]) => ({ label: labelForField(field), field, value }))
}

function shortList(lo, fields, max = 4) {
  return firstContent(lo, fields)?.lines.slice(0, max) ?? []
}

export default function TeachingView({ lesson: lo }) {
  if (!lo) return null
  const grades = gradeBandsLabel(lo.grade_bands)
  const targets = shortList(lo, TARGET_FIELDS, 4)
  const materials = shortList(lo, MATERIAL_FIELDS, 6)
  const safety = shortList(lo, SAFETY_FIELDS, 4)
  const setup = shortList(lo, SETUP_FIELDS, 2)
  const phases = resolvePhases(lo)
  const title = lo.title || lo.lesson_title || lo.session_title || lo.activity_title || 'Lesson'
  const gradeText = grades || lo.grade_label || lo.grade_band
  const duration = lo.duration_minutes || lo.duration
  const meta = [lo.subject, gradeText && `Grade ${gradeText}`, duration && (String(duration).match(/min/i) ? duration : `${duration} min`)].filter(Boolean).join(' · ')

  return (
    <div className="space-y-5">
      <header>
        <p className="label-eyebrow text-accent-500">Teacher at-a-glance</p>
        <h2 className="mt-1 text-2xl font-bold text-ink-50 print:text-black">{title}</h2>
        {meta && <p className="mt-0.5 text-sm text-ink-500">{meta}</p>}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {materials.length > 0 && <section className="rounded-xl border border-ink-800 bg-ink-900/40 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Gather</h3>
          <p className="mt-1 text-sm text-ink-300 print:text-gray-800">{materials.join(' · ')}</p>
        </section>}
        {setup.length > 0 && <section className="rounded-xl border border-ink-800 bg-ink-900/40 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Set up</h3>
          <p className="mt-1 text-sm text-ink-300 print:text-gray-800">{setup.join(' · ')}</p>
        </section>}
        {safety.length > 0 && <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-600">Safety first</h3>
          <p className="mt-1 text-sm text-ink-300 print:text-gray-800">{safety[0]}</p>
        </section>}
      </div>

      {targets.length > 0 && (
        <section className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-3 print:border-gray-300 print:bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Students will</h3>
          <ul className="mt-1 space-y-1">
            {targets.map((target, index) => <li key={index} className="flex gap-2 text-sm text-ink-200"><span className="text-accent-500">✓</span><span>{target}</span></li>)}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        {phases.map((phase, index) => {
          const timing = extractTiming(phase.value)
          return (
            <div key={phase.field} className="border-l-2 border-accent-500 pl-3 print:break-inside-avoid">
              <h3 className="flex flex-wrap items-baseline gap-x-2 text-lg font-semibold text-ink-50 print:text-black">
                <span className="text-accent-500">{index + 1}.</span> {phase.label}
                {timing && <span className="text-xs font-normal text-ink-500">{timing}</span>}
              </h3>
              <ul className="mt-1 space-y-1">
                {keyCues(phase.value).map((cue, cueIndex) => <li key={cueIndex} className="flex gap-2 text-sm text-ink-300 print:text-gray-800"><span className="text-accent-500">•</span><span>{cue}</span></li>)}
              </ul>
            </div>
          )
        })}
      </section>

      {safety.length > 1 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Additional safety</h3>
          <ul className="mt-1 space-y-1">
            {safety.slice(1).map((item, index) => <li key={index} className="text-sm text-ink-300">{item}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
