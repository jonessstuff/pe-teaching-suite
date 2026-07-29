import { useEffect } from 'react'
import TeachingAreasField from './TeachingAreasField'
import { track } from '../lib/analytics'

/**
 * One-time first-run capture, shown above a generation form until the teacher's
 * profile is onboarded. It only asks "What do you teach?" — grade and state are
 * the generator's own fields and get persisted alongside on first generate, so
 * there's nothing redundant here. Fires `onboarding_shown` once on mount.
 */
export default function FirstRunFields({ value, onChange }) {
  useEffect(() => {
    track('onboarding_shown')
  }, [])

  return (
    <div className="card space-y-3 border-accent-500/30 bg-accent-500/[0.04] p-5">
      <div>
        <p className="text-sm font-semibold text-ink-50">Quick one-time setup</p>
        <p className="mt-0.5 text-sm text-ink-400">
          Anything else you teach? We&apos;ll pin these and remember your grade &amp; state so you
          never retype them.
        </p>
      </div>
      <TeachingAreasField value={value} onChange={onChange} />
    </div>
  )
}
