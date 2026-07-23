/**
 * "What's New" release notes.
 *
 * Bump `version` (an integer) whenever there's something worth surfacing to
 * returning users, and update `items`. The banner (WhatsNewBanner) shows once
 * per user per version: it appears while the user's stored
 * profiles.whats_new_version is below this number, and dismissing writes this
 * number back. See migration 0023_whats_new_version.sql.
 */
export const WHATS_NEW = {
  version: 1,
  title: "What's new in PlansK12",
  items: [
    'New Classroom Management module — printable quick-reference cards, ABC data sheets, CICO trackers, and parent communication notes for large-group specials classes.',
    'The Lesson Library now filters by every module — PE & Health, Library & Media, Art, Music, STEM, Adaptive PE, CTE, and Classroom Management.',
  ],
}
