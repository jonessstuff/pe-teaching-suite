import LessonBody from '../lesson/lessonBodyRenderers'

// Renders a generated unit as a day-by-day stack. Each day is a full lesson in
// its own module's shape, so we dispatch on the LESSON's own subject (which
// matches LESSON_RENDERERS — e.g. a Library day saves as "Library/Media") and
// only fall back to the builder's module label if a lesson somehow lacks one.
export default function UnitRenderer({ subject, unitName, days }) {
  return (
    <div className="lesson-doc space-y-8">
      {unitName && (
        <div className="rounded-lg border border-ink-700 p-5 print:border-gray-400">
          <h1 className="lesson-title text-ink-50 print:text-black">{unitName}</h1>
          <p className="mt-0.5 text-sm text-ink-400 print:text-gray-600">
            {subject} · {days.length}-day unit
          </p>
        </div>
      )}

      {days.map((lesson, i) => (
        <div
          key={i}
          className={`print:break-inside-avoid ${i > 0 ? 'print:break-before-page' : ''}`}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-ink-500 print:text-gray-500">
            Day {i + 1} of {days.length}
          </p>
          <LessonBody subject={lesson?.subject ?? subject} lesson={lesson} />
        </div>
      ))}
    </div>
  )
}
