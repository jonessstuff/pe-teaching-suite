/**
 * "What do you teach?" options for signup and Settings.
 *
 * Stored on the profile as stable KEYS (teaching_areas / cte_pathways text[]
 * columns, see migration 0024) so labels can be reworded without breaking
 * analytics. Keys map to current modules; keep in sync when modules change.
 */

export const CTE_KEY = 'cte'
export const OTHER_KEY = 'other'

export const TEACHING_AREAS = [
  { key: 'pe_health', label: 'PE & Health' },
  { key: 'library_media', label: 'Library & Media' },
  { key: 'art', label: 'Art' },
  { key: 'music', label: 'Music' },
  { key: 'stem', label: 'STEM' },
  { key: 'adaptive_pe', label: 'Adaptive PE' },
  { key: CTE_KEY, label: 'CTE' },
  { key: 'classroom_management', label: 'Classroom Management' },
  { key: 'gifted_talented', label: 'Gifted & Talented' },
  { key: 'reading_specialist', label: 'Reading Specialist' },
  { key: 'math_specialist', label: 'Math Specialist' },
  { key: 'special_education', label: 'Special Education' },
  { key: 'makerspace', label: 'Makerspace' },
  { key: OTHER_KEY, label: 'Other' },
]

export const CTE_PATHWAYS = [
  { key: 'hospitality', label: 'Hospitality & Tourism' },
  { key: 'finance', label: 'Finance' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'human_services', label: 'Human Services / FCS' },
  { key: 'health_science', label: 'Health Science' },
  { key: 'education_training', label: 'Education & Training' },
]
