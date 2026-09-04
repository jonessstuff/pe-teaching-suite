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
  version: 3,
  eyebrow: 'New in PlansK12',
  title: 'Your plans now fit the way your school works',
  description: 'Create the lesson once, then turn your saved work into the format and level of detail your school needs.',
  items: [
    {
      title: 'Submit My Plans',
      description: 'Choose saved lessons and create a brief weekly plan, a complete school-format plan, or a year-at-a-glance—ready to copy, download, or print.',
      to: '/submit-plans',
      cta: 'Prepare my plans',
      accent: 'border-violet-500/25 bg-violet-500/10 text-violet-400',
    },
    {
      title: 'Use your own planning requirements',
      description: 'Save the sections and detail level your school expects. PlansK12 can also choose the most relevant MTSS goals and instructional practices for each lesson.',
      to: '/settings',
      cta: 'Review plan settings',
      accent: 'border-teal-500/25 bg-teal-500/10 text-teal-400',
    },
    {
      title: 'More precise CTE lessons',
      description: 'CTE teachers can now choose the pathway, specific course, lesson type, and classroom needs before generating.',
      to: '/cte/generate',
      cta: 'Create a CTE lesson',
      accent: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    },
    {
      title: 'Teacher Health & Wellness',
      description: 'Build a personal walk/run plan, use the interval timer, and find quick stress resets, stretches, lunches, and desk-snack ideas.',
      to: '/teacher-wellness',
      cta: 'Open Teacher Wellness',
      accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    },
  ],
}
