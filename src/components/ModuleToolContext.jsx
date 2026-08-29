import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ModuleToolContext({ context, expanded = false, onToggle, mode = 'change' }) {
  if (!context.active) return null
  const actionLabel = mode === 'view'
    ? (expanded ? `Show only ${context.moduleTitle}` : 'View all specialties')
    : (expanded ? `Keep ${context.moduleTitle}` : 'Change specialty')

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-accent-500/25 bg-accent-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 size={18} className="shrink-0 text-accent-600" />
        <div>
          <p className="text-sm font-semibold text-ink-100">Using {context.moduleTitle}</p>
          <Link to={context.homePath} className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-200">
            <ArrowLeft size={12} /> Return to {context.moduleTitle}
          </Link>
        </div>
      </div>
      {onToggle && (
        <button type="button" onClick={onToggle} className="text-left text-xs font-semibold text-accent-700 sm:text-right">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
