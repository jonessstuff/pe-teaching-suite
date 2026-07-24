import PlanBookRenderer from './renderers/PlanBookRenderer'
import ArtPlanRenderer from './renderers/ArtPlanRenderer'
import MusicPlanRenderer from './renderers/MusicPlanRenderer'
import StemPlanRenderer from './renderers/StemPlanRenderer'
import LibraryPlanRenderer from './renderers/LibraryPlanRenderer'

// Picks the right renderer for a lead-magnet lesson by its subject.
export default function FreeLessonRenderer({ lesson }) {
  const s = lesson?.subject
  if (s === 'Art') return <ArtPlanRenderer lesson={lesson} />
  if (s === 'Music') return <MusicPlanRenderer lesson={lesson} />
  if (s === 'STEM') return <StemPlanRenderer lesson={lesson} />
  if (s === 'Library/Media') return <LibraryPlanRenderer lesson={lesson} />
  return <PlanBookRenderer lesson={lesson} /> // PE, Health, and any lesson-plan shape
}
