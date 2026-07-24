import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { getSharedLesson } from '../services/sharingService'
import { supabase } from '../lib/supabaseClient'
import { WATERMARK_TEXT } from '../services/trialService'
import PlanBookRenderer from '../components/renderers/PlanBookRenderer'
import CtePlanRenderer from '../components/renderers/CtePlanRenderer'
import AdaptivePERenderer from '../components/renderers/AdaptivePERenderer'
import SharedLessonPreview from '../components/SharedLessonPreview'

// Tiled, faint diagonal watermark (reuses WATERMARK_TEXT) laid over the gated
// preview on screen — so a screenshot still carries attribution.
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
  const [hasSession, setHasSession] = useState(false)

  // Is anyone logged in? Drives the gated CTA copy (upgrade vs. sign up free).
  // Read directly from supabase so this works in both the authenticated and
  // unauthenticated router trees (SharedLesson renders in both).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data?.session))
  }, [])

  useEffect(() => {
    if (!token) return
    getSharedLesson(token)
      .then(data => setLesson(data))
      .catch(e => setError(e.message ?? 'This lesson could not be found.'))
  }, [token])

  // The edge function decides: paid subscribers get the full lesson_object
  // (gated === false); everyone else gets a soft-gated preview payload.
  const fullView = lesson && lesson.gated === false

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 print:bg-white">
      {/* Topbar */}
      <div className="border-b border-ink-200 bg-white px-6 py-3 print:border-gray-200">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span className="font-display font-bold text-lg text-ink-950">PlansK12</span>
          {!fullView && (
            <Link
              to="/signup"
              className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors print:hidden"
            >
              Try free →
            </Link>
          )}
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

        {/* Full lesson — paid subscribers only. Clean, no watermark/print gate. */}
        {fullView && (
          <div className="space-y-8">
            <div>
              <p className="text-sm text-ink-500 mb-1">
                {lesson.subject}
                {(lesson.grade_bands ?? []).length > 0 && ` · Grade ${lesson.grade_bands.map(g => g === 0 ? 'K' : g).join('/')}`}
              </p>
              <h1 className="text-2xl font-bold text-ink-950">{lesson.title}</h1>
            </div>

            <div className="rounded-xl border border-ink-200 bg-white p-6 print:border-gray-300">
              {lesson.lesson_object?.subject === 'Adaptive PE' ? (
                <AdaptivePERenderer lesson={lesson.lesson_object} />
              ) : lesson.lesson_object?.subject === 'CTE' ? (
                <CtePlanRenderer lesson={lesson.lesson_object} />
              ) : (
                <PlanBookRenderer lesson={lesson.lesson_object} />
              )}
            </div>

            <p className="text-xs text-ink-400 text-center print:hidden">
              Shared view · {lesson.view_count} view{lesson.view_count !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Soft-gated preview — anonymous / trial / expired viewers. */}
        {lesson && lesson.gated && (
          <>
            {/* Faint watermark over the whole viewport on screen. */}
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-30 print:hidden"
              style={watermarkStyle}
            />

            {/* Print-only notice. The preview body is hidden on print (see
                index.css) so there's no clean, print-ready copy to save. */}
            <div className="shared-print-notice flex-col items-center justify-center gap-3 py-24 text-center">
              <p className="text-base font-semibold">{WATERMARK_TEXT}</p>
              <p className="max-w-md text-sm">
                Sign up free at plansk12.com to view, print, and export the full lesson plan.
              </p>
            </div>

            <div className="shared-lesson-body">
              <SharedLessonPreview data={lesson} hasSession={hasSession} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
