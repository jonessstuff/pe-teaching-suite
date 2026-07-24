import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { leadView } from '../services/leadMagnetService'
import FreeLessonRenderer from '../components/FreeLessonRenderer'

const CHECKOUT_URL = 'https://buy.stripe.com/5kQ5kveUR2xWh0tcoi0kE05'

export default function FreeLessonView() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    leadView(token)
      .then(setData)
      .catch((e) => setError(e.message ?? 'This lesson could not be found.'))
  }, [token])

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 print:bg-white">
      {/* Topbar */}
      <div className="border-b border-ink-200 bg-white px-6 py-3 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="font-display font-bold text-lg text-ink-950">PlansK12</Link>
          <a href={CHECKOUT_URL} className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors">
            Start free trial →
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {!data && !error && (
          <div className="flex items-center gap-3 text-ink-500">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading your lesson…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-600">Lesson not found</p>
              <p className="mt-0.5 text-sm text-ink-500">
                This free-lesson link may be invalid. You can{' '}
                <Link to="/try" className="underline">generate a new one</Link>.
              </p>
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="rounded-xl border border-ink-200 bg-white p-6 print:border-0 print:p-0">
              <FreeLessonRenderer lesson={data.lesson_object} />
            </div>

            <div className="mt-8 rounded-xl border border-accent-200 bg-accent-50 p-6 text-center print:hidden">
              <p className="font-semibold text-accent-900">This is one lesson. PlansK12 does the whole building.</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-accent-700">
                PE, Art, Music, Library, STEM, intervention, special education, counseling, early childhood, and more —
                plus sub plans, pacing guides, quizzes, and parent newsletters.
              </p>
              <a href={CHECKOUT_URL} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-700">
                <Sparkles size={15} /> Start your 7-day free trial
              </a>
            </div>
          </>
        )}
      </div>

      {/* Print-only watermark. */}
      <div className="trial-watermark">Free lesson from PlansK12 · Start your free trial at plansk12.com</div>
    </div>
  )
}
