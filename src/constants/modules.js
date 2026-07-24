/**
 * Central module registry.
 *
 * Single source of truth for:
 *   - Which subjects belong to which module (Lesson Library filters).
 *   - Each subject's tab accent color (LessonCard subject badge).
 *
 * Tab styles are written as full, static Tailwind class strings (never
 * interpolated) so the JIT compiler picks them up from this file. Every
 * subject an existing module can produce is mapped here, so real lessons
 * never fall back to the neutral grey style.
 */

// Subject → tab badge classes. Each module's accent is the badge BACKGROUND
// (a tint pill); the label text is high-contrast ink (readable on light and
// dark surfaces alike) rather than the accent color itself.
export const SUBJECT_TAB_STYLES = {
  // PE & Health family
  PE: 'bg-subject-pe/20 text-ink-50',
  Health: 'bg-subject-health/20 text-ink-50',
  'Family Life': 'bg-subject-family/20 text-ink-50',
  "Driver's Ed": 'bg-subject-drivers/20 text-ink-50',
  'Strength & Conditioning': 'bg-accent-500/20 text-ink-50',
  'Adaptive PE': 'bg-teal-500/20 text-ink-50',
  // Other specialist modules — match their module-card accent colors
  'Library/Media': 'bg-blue-500/20 text-ink-50',
  Art: 'bg-orange-500/20 text-ink-50',
  Music: 'bg-purple-500/20 text-ink-50',
  STEM: 'bg-cyan-500/20 text-ink-50',
  CTE: 'bg-pink-500/20 text-ink-50',
  'Classroom Management': 'bg-indigo-500/20 text-ink-50',
  'Gifted & Talented': 'bg-amber-500/20 text-ink-50',
  'Reading Specialists': 'bg-sky-500/20 text-ink-50',
  'Math Specialists': 'bg-lime-500/20 text-ink-50',
  Makerspace: 'bg-slate-500/20 text-ink-50',
  'Special Education': 'bg-violet-500/20 text-ink-50',
  'ESL/ELL Specialist': 'bg-fuchsia-500/20 text-ink-50',
  'School Counselors': 'bg-crimson-500/20 text-ink-50',
  'Speech-Language Pathologists': 'bg-bronze-500/20 text-ink-50',
  'Student Support Team Activities': 'bg-plum-500/20 text-ink-50',
  'Early Childhood': 'bg-grass-500/20 text-ink-50',
}

// Neutral last-resort style for a genuinely unknown subject only.
const FALLBACK_TAB_STYLE = 'bg-ink-700 text-ink-300'

/**
 * Returns the tab badge classes for a lesson subject. Every subject a
 * shipping module produces is mapped, so the grey fallback is reached
 * only for unrecognized/legacy values.
 */
export function subjectTabStyle(subject) {
  return SUBJECT_TAB_STYLES[subject] ?? FALLBACK_TAB_STYLE
}

/**
 * Modules shown as Lesson Library filter options. Each module maps to the
 * set of lesson `subject` values it owns, so filtering works regardless of
 * how many subjects a module spans (PE & Health owns five).
 */
export const MODULES = [
  { label: 'PE & Health', subjects: ['PE', 'Health', 'Family Life', "Driver's Ed", 'Strength & Conditioning'] },
  { label: 'Library & Media', subjects: ['Library/Media'] },
  { label: 'Art', subjects: ['Art'] },
  { label: 'Music', subjects: ['Music'] },
  { label: 'STEM', subjects: ['STEM'] },
  { label: 'Adaptive PE', subjects: ['Adaptive PE'] },
  { label: 'CTE', subjects: ['CTE'] },
  { label: 'Classroom Management', subjects: ['Classroom Management'] },
  { label: 'Gifted & Talented', subjects: ['Gifted & Talented'] },
  { label: 'Reading Specialists', subjects: ['Reading Specialists'] },
  { label: 'Math Specialists', subjects: ['Math Specialists'] },
  { label: 'Makerspace', subjects: ['Makerspace'] },
  { label: 'Special Education', subjects: ['Special Education'] },
  { label: 'ESL/ELL Specialist', subjects: ['ESL/ELL Specialist'] },
  { label: 'School Counselors', subjects: ['School Counselors'] },
  { label: 'Speech-Language Pathologists', subjects: ['Speech-Language Pathologists'] },
  { label: 'Student Support Team Activities', subjects: ['Student Support Team Activities'] },
  { label: 'Early Childhood / Pre-K', subjects: ['Early Childhood'] },
]

/** True when `subject` belongs to the module identified by `moduleLabel`. */
export function subjectInModule(subject, moduleLabel) {
  const mod = MODULES.find((m) => m.label === moduleLabel)
  return mod ? mod.subjects.includes(subject) : false
}

// ─────────────────────────────────────────────────────────────────────────────
// Module accent palette
// ─────────────────────────────────────────────────────────────────────────────
//
// Every module has one accent color, applied with a consistent shade pattern:
//   • tint background:  bg-{c}-500/15   (icon wells, subject tabs, status pills)
//   • accent text/icon: text-{c}-400
//   • borders:          border-{c}-400  and  hover:border-{c}-400/40
//   • callout box:      border-{c}-500/30 bg-{c}-500/10
//
// The -400 text shade is chosen because the app's default surface is dark
// (ink-950), where -400 clears WCAG AA comfortably (~6–10:1). This is the same
// pattern the 11 shipped modules already use — the palette below just extends
// the set of hues, it does NOT change how accents are applied. (In light mode,
// like every existing accent, a bright -400 sits on a white card at lower
// contrast; that's an existing property of the design, not something these
// additions introduce.)
//
// ACCENTS ALREADY IN USE (do not reuse for a new module):
//   emerald (PE & Health) · blue (Library & Media) · orange (Art) ·
//   purple (Music) · cyan (STEM) · rose (Adaptive PE) · pink (CTE) ·
//   indigo (Classroom Management) · amber (Gifted & Talented) ·
//   sky (Reading Specialists) · lime (Math Specialists) ·
//   slate (Makerspace — shared STEM + Library category) ·
//   violet (Special Education) · fuchsia (ESL/ELL Specialist) ·
//   crimson (School Counselors) · bronze (Speech-Language Pathologists) ·
//   plum (Student Support Team Activities) · grass (Early Childhood / Pre-K) ·
//   teal (Adaptive PE lesson tabs)
//
// AVAILABLE for future modules (School Counselors is next, then more). Each
// entry's strings are full/literal so Tailwind's JIT compiles them and a new
// module can copy them verbatim. Pattern is always bg-{c}-500/15 + text-{c}-400
// + border-{c}-400, same as every accent above.
//
// The standard Tailwind hues are now all in use, so crimson/grass/bronze/plum
// are CUSTOM scales defined in tailwind.config.js (zinc is built in). Each was
// chosen to fill a real gap on the wheel and read AA on the dark UI at -400:
// crimson = true red (vs pink-ish rose), grass = leaf green (vs mint emerald /
// yellow lime), bronze = copper/brown (no brown existed), plum = muted wine (vs
// bright fuchsia/pink), zinc = cool neutral gray (vs blue-ish slate / warm stone).
// The saturated wheel is essentially full — future additions will trend toward
// muted/neutral tones or need a distinct icon to disambiguate a near-hue.
export const AVAILABLE_MODULE_ACCENTS = [
  {
    key: 'stone', label: 'Stone / taupe (warm neutral)',
    tab: 'bg-stone-500/15 text-stone-400', iconTint: 'bg-stone-500/15',
    accentText: 'text-stone-400', hoverBorder: 'hover:border-stone-400/40',
    cardBorder: 'border-stone-400', callout: 'border-stone-500/30 bg-stone-500/10',
  },
  {
    key: 'zinc', label: 'Zinc (cool neutral gray)',
    tab: 'bg-zinc-500/15 text-zinc-400', iconTint: 'bg-zinc-500/15',
    accentText: 'text-zinc-400', hoverBorder: 'hover:border-zinc-400/40',
    cardBorder: 'border-zinc-400', callout: 'border-zinc-500/30 bg-zinc-500/10',
  },
]
