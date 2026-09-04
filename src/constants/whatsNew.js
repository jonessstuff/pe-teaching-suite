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
  version: 2,
  eyebrow: 'A major PlansK12 update',
  title: 'New tools that help you run the program—not just write the plan',
  description: 'Your specialty workspace now includes practical tools you can use during class, across a season, and for schoolwide events.',
  items: [
    {
      title: 'Track the work as it happens',
      description: 'PE participation, run progress, SMART Goals, editable tryout scoring, teams, practices, plays, and schedules.',
      to: '/pe-health',
      cta: 'Explore PE tools',
      accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    },
    {
      title: 'Launch challenges students love',
      description: 'Create class, grade-level, or schoolwide programs with rosters, private progress, printables, and celebrations.',
      to: '/programs?module=PE%20%26%20Health',
      cta: 'See Challenges & Programs',
      accent: 'border-teal-500/25 bg-teal-500/10 text-teal-400',
    },
    {
      title: 'Plan the big moments',
      description: 'Field Day, STEM Night, art shows, concerts, productions, recitals, family nights, showcases, trips, and Open House.',
      to: '/open-house?module=PE%20%26%20Health',
      cta: 'Open an event planner',
      accent: 'border-violet-500/25 bg-violet-500/10 text-violet-400',
    },
    {
      title: 'Use your complete specialty workspace',
      description: 'Every module now keeps its lessons, SMART Goals, classes, planning tools, and specialty features together—including on phones.',
      to: '/',
      cta: 'Choose my specialty',
      accent: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    },
  ],
}
