/* eslint-disable react-refresh/only-export-components -- renderer helpers are intentionally exported for shared lesson views */
// Central subject → renderer dispatch for a saved lesson's body.
//
// Every module's generator renders its result with a bespoke renderer, but the
// archive (LessonDetail) previously only special-cased Adaptive PE and CTE and
// fell everything else back to PlanBookRenderer — which expects the PE lesson
// shape (warm_up, fitness_activities, …). Specialist lessons (OT, JROTC, School
// Counselors, …) have entirely different shapes, so they rendered near-empty in
// "View in archive". This map makes the archive use the SAME renderer each
// generator uses, so a saved lesson looks identical in the archive and in its
// generator's result view.
//
// Every lesson renderer takes a uniform `{ lesson }` prop, so dispatch is a
// simple lookup. Unknown/base PE subjects fall back to PlanBookRenderer.
import { createElement, useMemo } from 'react'
import { stripHedges } from '../LessonPrintFix'
import PlanBookRenderer from '../renderers/PlanBookRenderer'
import CtePlanRenderer from '../renderers/CtePlanRenderer'
import ArtPlanRenderer from '../renderers/ArtPlanRenderer'
import MusicPlanRenderer from '../renderers/MusicPlanRenderer'
import StemPlanRenderer from '../renderers/StemPlanRenderer'
import LibraryPlanRenderer from '../renderers/LibraryPlanRenderer'
import TheaterRenderer from '../renderers/TheaterRenderer'
import DanceRenderer from '../renderers/DanceRenderer'
import ElementaryTechRenderer from '../renderers/ElementaryTechRenderer'
import WorldLanguagesRenderer from '../renderers/WorldLanguagesRenderer'
import AfterSchoolClubsRenderer from '../renderers/AfterSchoolClubsRenderer'
import JrotcRenderer from '../renderers/JrotcRenderer'
import GiftedTalentedRenderer from '../renderers/GiftedTalentedRenderer'
import ReadingSpecialistRenderer from '../renderers/ReadingSpecialistRenderer'
import MathSpecialistRenderer from '../renderers/MathSpecialistRenderer'
import TutoringSessionRenderer from '../renderers/TutoringSessionRenderer'
import TestPrepRenderer from '../renderers/TestPrepRenderer'
import MakerProjectRenderer from '../renderers/MakerProjectRenderer'
import SpecialEducationRenderer from '../renderers/SpecialEducationRenderer'
import EslSpecialistRenderer from '../renderers/EslSpecialistRenderer'
import SchoolCounselorRenderer from '../renderers/SchoolCounselorRenderer'
import SlpRenderer from '../renderers/SlpRenderer'
import OtRenderer from '../renderers/OtRenderer'
import PtRenderer from '../renderers/PtRenderer'
import TviRenderer from '../renderers/TviRenderer'
import DhhRenderer from '../renderers/DhhRenderer'
import SstActivityRenderer from '../renderers/SstActivityRenderer'
import EarlyChildhoodRenderer from '../renderers/EarlyChildhoodRenderer'
import EcseRenderer from '../renderers/EcseRenderer'
import InterventionRenderer from '../renderers/InterventionRenderer'
import StaffPdRenderer from '../renderers/StaffPdRenderer'
import InstructionalCoachingRenderer from '../renderers/InstructionalCoachingRenderer'

// NOTE: Adaptive PE is intentionally NOT here — LessonDetail special-cases it
// (it also suppresses the secondary-tools panel), so it never reaches this map.
const LESSON_RENDERERS = {
  // Full-lesson specials (their generators use these; the archive now matches)
  'CTE': CtePlanRenderer,
  'Art': ArtPlanRenderer,
  'Music': MusicPlanRenderer,
  'STEM': StemPlanRenderer,
  'Library/Media': LibraryPlanRenderer,
  'Theater': TheaterRenderer,
  'Dance': DanceRenderer,
  'Elementary Technology': ElementaryTechRenderer,
  'World Languages': WorldLanguagesRenderer,
  'After-School Clubs': AfterSchoolClubsRenderer,
  'JROTC': JrotcRenderer,
  'Makerspace': MakerProjectRenderer,
  // Intervention & support
  'Gifted & Talented': GiftedTalentedRenderer,
  'Reading Specialists': ReadingSpecialistRenderer,
  'Math Specialists': MathSpecialistRenderer,
  'Test Prep': TestPrepRenderer,
  'Special Education': SpecialEducationRenderer,
  'ESL/ELL Specialist': EslSpecialistRenderer,
  'Intervention Planning': InterventionRenderer,
  // Wellbeing & related services
  'School Counselors': SchoolCounselorRenderer,
  'Speech-Language Pathologists': SlpRenderer,
  'Occupational Therapists': OtRenderer,
  'Physical Therapists': PtRenderer,
  'Teacher of the Visually Impaired': TviRenderer,
  'Teacher of the Deaf & Hard of Hearing': DhhRenderer,
  'Student Support Team Activities': SstActivityRenderer,
  // Early childhood & leadership
  'Early Childhood': EarlyChildhoodRenderer,
  'Early Childhood Special Education': EcseRenderer,
  'Staff PD & Meeting Planning': StaffPdRenderer,
  'Instructional Coaching': InstructionalCoachingRenderer,
}

/**
 * Resolve the renderer for a saved lesson body.
 *
 * Math/Reading Specialists split across TWO renderers by mode: whole-class
 * lessons use their subject renderer (in LESSON_RENDERERS), but tutoring /
 * small-group sessions save with the same subject AND `mode: "tutoring"` and
 * use the shared TutoringSessionRenderer. Check mode first so those don't get
 * routed to the whole-class renderer (whose fields a tutoring object lacks).
 */
function resolveRenderer(subject, lesson) {
  if (lesson?.mode === 'tutoring') return TutoringSessionRenderer
  return LESSON_RENDERERS[subject] ?? PlanBookRenderer
}

// Generator disclaimer-note fields (state_verification_note, and any
// *_verification_note) are whole hedge notes, not parentheticals — drop them at
// display so already-saved lessons print clean. New lessons are fixed at the
// prompt level; the DB copy is untouched.
const DROP_KEY = /(^|_)state_verification_note$|_verification_note$/i

/**
 * Display-time hedge cleanup for ALREADY-SAVED lessons. Deep-clones the lesson,
 * runs stripHedges() on every string (removing trailing generator parentheticals
 * like "(verify against official standards)"), and drops verification-note fields
 * — for every module, in ONE place, never written back to the database. Standards
 * render per-renderer, so this is the single shared choke point they all share.
 * Exported so the Adaptive PE path (rendered outside LessonBody) can reuse it.
 */
export function cleanLessonForDisplay(value) {
  if (typeof value === 'string') return stripHedges(value)
  if (Array.isArray(value)) return value.map(cleanLessonForDisplay)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string' && DROP_KEY.test(k)) continue // drop disclaimer note
      out[k] = cleanLessonForDisplay(v)
    }
    return out
  }
  return value
}

/**
 * Renders a saved lesson's body with the renderer that matches its subject,
 * falling back to PlanBookRenderer for base PE subjects (or any unmapped one).
 */
export default function LessonBody({ subject, lesson }) {
  const cleaned = useMemo(() => cleanLessonForDisplay(lesson), [lesson])
  // createElement (not JSX <Renderer/>) because the component is chosen
  // dynamically from a stable module-level map — the react-hooks
  // static-components rule flags a capitalized component const used as JSX.
  return createElement(resolveRenderer(subject, cleaned), { lesson: cleaned })
}
