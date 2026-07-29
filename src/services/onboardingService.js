import { supabase } from '../lib/supabaseClient'
import { addFavorite } from './favoritesService'
import { AREA_TO_MODULE_KEY } from '../constants/teachingAreas'

/**
 * Persist the first-run answers captured at first generation:
 *  - write teaching_areas / cte_pathways / grade_levels / state to the profile
 *  - set onboarded_at so the capture is never shown again
 *  - star (favorite) the modules mapped from the chosen teaching areas
 *
 * grade_levels/state are only written when present, so a module without a K-12
 * grade (CTE) simply omits gradeLevels. Favoriting is best-effort and idempotent.
 */
export async function persistFirstRun({
  teachingAreas = [],
  ctePathways = [],
  teachingOther = '',
  gradeLevels,
  state,
} = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const patch = { onboarded_at: new Date().toISOString() }
  if (teachingAreas.length) patch.teaching_areas = teachingAreas
  if (ctePathways.length) patch.cte_pathways = ctePathways
  if (teachingOther) patch.teaching_other = teachingOther
  if (Array.isArray(gradeLevels) && gradeLevels.length) patch.grade_levels = gradeLevels
  if (state) patch.state = state

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
  if (error) throw error

  // Pin the chosen areas' modules to the top of the picker (module_favorites).
  const slugs = [...new Set(teachingAreas.map((a) => AREA_TO_MODULE_KEY[a]).filter(Boolean))]
  await Promise.allSettled(slugs.map((s) => addFavorite(s)))
  return { favorited: slugs }
}
