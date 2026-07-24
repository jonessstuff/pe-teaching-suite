import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { getSharedLesson } from '../services/sharingService'
import { WATERMARK_TEXT } from '../services/trialService'
import PlanBookRenderer from '../components/renderers/PlanBookRenderer'
import CtePlanRenderer from '../components/renderers/CtePlanRenderer'
import AdaptivePERenderer from '../components/renderers/AdaptivePERenderer'

// Tiled, faint diagonal watermark (reuses WATERMARK_TEXT) laid over the shared
// lesson on screen — so a screenshot of the full plan still carries attribution.
const WATERMARK_SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='220'>` +
    `<text x='18' y='150' transform='rotate(-28 180 110)' ` +
    `fill='rgba(71,85,105,0.10)' font-family='Helvetica,Arial,sans-serif' ` +
    `font-size='15' font-weight='600'>${WATERMARK_TEXT}</text></svg>`
)
const watermarkStyle = {
  backgroundImage: `url("data:image/svg+xml,${WATERMARK_SVG}")`,
  backgroundRepeat: 'repeat',
}

export default function SharedLesson() {
  const { token } = useParams()
  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    getSharedLesson(token)
      .then(data => setLesson(data))
      .catch(e => setError(e.message ?? 'This lesson could not be found.'))
  }, [token])

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 print:bg-white">
      {/* Topbar */}
      <div className="border-b border-ink-200 bg-white px-6 py-3 print:border-gray-200">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span className="font-display font-bold text-lg text-ink-950">PlansK12</span>
          <Link
            to="/signup"
            className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors print:hidden"
          >
            Try free →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {!lesson && !error && (
          <div className="flex items-center gap-3 text-ink-500">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading lesson…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-400">Lesson not found</p>
              <p className="text-sm text-ink-400 mt-0.5">
                This link may have expired or been revoked by the teacher.
              </p>
            </div>
          </div>
        )}

        {lesson && (
          <>
            {/* Faint watermark over the whole viewport on screen. */}
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-30 print:hidden"
              style={watermarkStyle}
            />

            {/* Print-only notice. The lesson body is hidden on print (see
                index.css) so a non-subscriber can't save a clean PDF copy. */}
            <div className="shared-print-notice flex-col items-center justify-center gap-3 py-24 text-center">
              <p className="text-base font-semibold">{WATERMARK_TEXT}</p>
              <p className="max-w-md text-sm">
                Printing and PDF export are available to PlansK12 subscribers.
                Visit plansk12.com to create standards-aligned lesson plans of your own.
              </p>
            </div>

            <div className="shared-lesson-body space-y-8">
              <div>
                <p className="text-sm text-ink-500 mb-1">
                  {lesson.subject}
                  {(lesson.grade_bands ?? []).length > 0 && ` · Grade ${lesson.grade_bands.map(g => g === 0 ? 'K' : g).join('/')}`}
                </p>
                <h1 className="text-2xl font-bold text-ink-950">{lesson.title}</h1>
              </div>

              <div className="rounded-xl border border-ink-200 bg-white p-6">
                {lesson.lesson_object?.subject === 'Adaptive PE' ? (
                  <AdaptivePERenderer lesson={lesson.lesson_object} />
                ) : lesson.lesson_object?.subject === 'CTE' ? (
                  <CtePlanRenderer lesson={lesson.lesson_object} />
                ) : (
                  <PlanBookRenderer lesson={lesson.lesson_object} />
                )}
              </div>

              {/* CTA */}
              <div className="rounded-xl border border-accent-200 bg-accent-50 p-6 print:hidden">
                <p className="font-semibold text-accent-900">Built with PlansK12</p>
                <p className="mt-1 text-sm text-accent-700">
                  AI-powered lesson planning for PE, Art, Music, Library, and STEM specialists.
                  Full lesson plans, standards-aligned, in minutes.
                </p>
                <Link
                  to="/signup"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
                >
                  Try PlansK12 free →
                </Link>
              </div>

              <p className="text-xs text-ink-400 text-center print:hidden">
                Shared view · {lesson.view_count} view{lesson.view_count !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
