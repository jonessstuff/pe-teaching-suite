import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { toggleFavorite } from '../../services/lessonsService'
import { subjectTabStyle } from '../../constants/modules'
import { smartTitleCase } from '../../utils/titleCase'

function timeAgo(dateString) {
  if (!dateString) return null
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function formatGrade(g) {
  return g === 0 ? "K" : String(g)
}

export default function LessonCard({ lesson, onFavoriteToggle }) {
  const [isFavorite, setIsFavorite] = useState(lesson.is_favorite ?? false)
  const gradeBands = lesson.grade_bands ?? lesson.lesson_object?.grade_bands ?? []
  const subject = lesson.subject ?? lesson.lesson_object?.subject ?? 'PE'
  const unit = lesson.lesson_object?.unit
  const dayNumber = lesson.lesson_object?.unit_day_number
  const totalDays = lesson.lesson_object?.unit_total_days
  const edited = timeAgo(lesson.updated_at ?? lesson.created_at)
  const tags = lesson.tags ?? []

  async function handleFavorite(e) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const updated = await toggleFavorite(lesson.id, isFavorite)
      setIsFavorite(updated.is_favorite)
      onFavoriteToggle?.(updated)
    } catch {
      // non-critical
    }
  }

  return (
    <Link to={`/lessons/${lesson.id}`} className="card flex flex-col gap-3 p-4 transition-colors hover:border-accent-500/40">
      <div className="flex items-center justify-between">
        <span
          className={`label-eyebrow rounded px-2 py-0.5 ${subjectTabStyle(subject)}`}
        >
          {subject}
        </span>
        <div className="flex items-center gap-2">
          {gradeBands.length > 0 && (
            <span className="label-eyebrow text-ink-400">
              Grades {gradeBands.map(formatGrade).join('/')}
            </span>
          )}
          <button type="button" onClick={handleFavorite} aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}>
            <Star
              size={14}
              className={isFavorite ? 'fill-amber-400 text-amber-400' : 'text-ink-700 hover:text-amber-400 transition-colors'}
            />
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-ink-50 leading-snug">{smartTitleCase(lesson.title)}</h3>
        {unit && <p className="text-sm text-ink-400 mt-0.5">{unit}{dayNumber ? ` · Day ${dayNumber} of ${totalDays}` : ''}</p>}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="rounded-full bg-ink-900/50 px-2 py-0.5 text-xs text-ink-500">{tag}</span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-900 pt-2">
        <p className="text-xs text-ink-500 truncate">
          {lesson.scheduled_date
            ? `${lesson.scheduled_date}${lesson.period_label ? ` · ${lesson.period_label}` : ''}`
            : ''}
        </p>
        {edited && <p className="text-xs text-ink-600 shrink-0">{edited}</p>}
      </div>
    </Link>
  )
}
