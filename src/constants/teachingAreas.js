/**
 * "What do you teach?" options for signup and Settings.
 *
 * Stored on the profile as stable KEYS (teaching_areas / cte_pathways text[]
 * columns, see migration 0024) so labels can be reworded without breaking
 * analytics.
 *
 * Labels + ordering MIRROR the canonical module registry (MODULES in
 * constants/modules.js) so every teacher-facing subject list reads the same
 * across the app. When a module is added there, add its teaching-area key
 * here (keys never change once shipped; only labels track the registry).
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
  { key: 'reading_specialist', label: 'Reading Specialists' },
  { key: 'math_specialist', label: 'Math Specialists' },
  { key: 'makerspace', label: 'Makerspace' },
  { key: 'special_education', label: 'Special Education' },
  { key: 'esl_ell', label: 'ESL/ELL Specialist' },
  { key: 'school_counselors', label: 'School Counselors' },
  { key: 'speech_language', label: 'Speech-Language Pathologists' },
  { key: 'student_support', label: 'Student Support Team Activities' },
  { key: 'early_childhood', label: 'Early Childhood / Pre-K' },
  { key: 'intervention_planning', label: 'Intervention Planning' },
  { key: 'staff_pd', label: 'Staff PD & Meeting Planning' },
  { key: OTHER_KEY, label: 'Other' },
]

export const CTE_PATHWAYS = [
  { key: 'hospitality', label: 'Hospitality & Tourism' },
  { key: 'finance', label: 'Finance' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'human_services', label: 'Human Services / FCS' },
  { key: 'health_science', label: 'Health Science' },
  { key: 'education_training', label: 'Education & Training' },
  { key: 'career_readiness', label: 'Career Readiness' },
  { key: 'information_technology', label: 'Information Technology' },
  { key: 'transportation', label: 'Transportation, Distribution & Logistics' },
  { key: 'manufacturing', label: 'Manufacturing' },
  { key: 'engineering_tech', label: 'STEM / Engineering & Technology' },
  { key: 'business_mgmt', label: 'Business Management & Administration' },
  { key: 'agriculture', label: 'Agriculture, Food & Natural Resources' },
  { key: 'construction', label: 'Architecture & Construction' },
]
