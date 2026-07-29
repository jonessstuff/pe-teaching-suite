import { useEffect, useRef } from 'react'
import { useTrial } from '../context/TrialContext'

/**
 * First-run + profile defaults, read from the already-loaded TrialContext
 * profile (no extra fetch). Used by generators to pre-fill grade/state and to
 * decide whether to show the one-time first-run capture.
 *
 * `gradeBands` is the numeric view of the stored grade_levels, for the K-12
 * generators that use an int[] grade selector; non-numeric entries drop out.
 */
export function useProfileDefaults() {
  const { profile, loaded, refresh } = useTrial()
  const gradeLevels = profile?.grade_levels ?? []
  const gradeBands = gradeLevels.map(Number).filter((n) => Number.isFinite(n))
  return {
    ready: loaded && !!profile,
    onboarded: !!profile?.onboarded_at,
    fullName: profile?.full_name ?? '',
    state: profile?.state ?? '',
    gradeLevels,
    gradeBands,
    teachingAreas: profile?.teaching_areas ?? [],
    ctePathways: profile?.cte_pathways ?? [],
    refresh,
  }
}

/**
 * Applies the stored grade/state defaults to a generator's fields ONCE, when the
 * profile first loads — without clobbering any edit the teacher has already made.
 * Pass `null` for a setter a given module doesn't have (e.g. CTE has no gradeBands).
 */
export function useGradeStateDefaults(setGradeBands, setState) {
  const d = useProfileDefaults()
  const applied = useRef(false)
  useEffect(() => {
    if (!d.ready || applied.current) return
    applied.current = true
    if (setGradeBands && d.gradeBands.length) setGradeBands(d.gradeBands)
    if (setState && d.state) setState(d.state)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.ready])
}
