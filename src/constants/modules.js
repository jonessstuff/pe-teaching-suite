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
  Theater: 'bg-maroon-500/20 text-ink-50',
  Dance: 'bg-olive-500/20 text-ink-50',
  STEM: 'bg-cyan-500/20 text-ink-50',
  'Elementary Technology': 'bg-saffron-500/20 text-ink-50',
  'World Languages': 'bg-jade-500/20 text-ink-50',
  'After-School Clubs': 'bg-coral-500/20 text-ink-50',
  JROTC: 'bg-denim-500/20 text-ink-50',
  CTE: 'bg-pink-500/20 text-ink-50',
  'Classroom Management': 'bg-indigo-500/20 text-ink-50',
  'Gifted & Talented': 'bg-amber-500/20 text-ink-50',
  'Reading Specialists': 'bg-sky-500/20 text-ink-50',
  'Math Specialists': 'bg-lime-500/20 text-ink-50',
  'Test Prep': 'bg-steel-500/20 text-ink-50',
  Makerspace: 'bg-slate-500/20 text-ink-50',
  'Special Education': 'bg-violet-500/20 text-ink-50',
  'ESL/ELL Specialist': 'bg-fuchsia-500/20 text-ink-50',
  'School Counselors': 'bg-crimson-500/20 text-ink-50',
  'Speech-Language Pathologists': 'bg-bronze-500/20 text-ink-50',
  'Occupational Therapists': 'bg-periwinkle-500/20 text-ink-50',
  'Physical Therapists': 'bg-zinc-500/20 text-ink-50',
  'Teacher of the Visually Impaired': 'bg-cobalt-500/20 text-ink-50',
  'Teacher of the Deaf & Hard of Hearing': 'bg-magenta-500/20 text-ink-50',
  'Student Support Team Activities': 'bg-plum-500/20 text-ink-50',
  'Early Childhood': 'bg-grass-500/20 text-ink-50',
  'Early Childhood Special Education': 'bg-sage-500/20 text-ink-50',
  'Intervention Planning': 'bg-stone-500/20 text-ink-50',
  'Staff PD & Meeting Planning': 'bg-gold-500/20 text-ink-50',
  'Instructional Coaching': 'bg-mocha-500/20 text-ink-50',
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
  { label: 'Theater / Drama', subjects: ['Theater'] },
  { label: 'Dance', subjects: ['Dance'] },
  { label: 'STEM', subjects: ['STEM'] },
  { label: 'Elementary Technology / Computer Lab', subjects: ['Elementary Technology'] },
  { label: 'World Languages', subjects: ['World Languages'] },
  { label: 'After-School Clubs', subjects: ['After-School Clubs'] },
  { label: 'JROTC', subjects: ['JROTC'] },
  { label: 'Adaptive PE', subjects: ['Adaptive PE'] },
  { label: 'CTE', subjects: ['CTE'] },
  { label: 'Classroom Management', subjects: ['Classroom Management'] },
  { label: 'Gifted & Talented', subjects: ['Gifted & Talented'] },
  { label: 'Reading Specialists', subjects: ['Reading Specialists'] },
  { label: 'Math Specialists', subjects: ['Math Specialists'] },
  { label: 'Test Prep', subjects: ['Test Prep'] },
  { label: 'Makerspace', subjects: ['Makerspace'] },
  { label: 'Special Education', subjects: ['Special Education'] },
  { label: 'ESL/ELL Specialist', subjects: ['ESL/ELL Specialist'] },
  { label: 'School Counselors', subjects: ['School Counselors'] },
  { label: 'Speech-Language Pathologists', subjects: ['Speech-Language Pathologists'] },
  { label: 'Occupational Therapists', subjects: ['Occupational Therapists'] },
  { label: 'Physical Therapists', subjects: ['Physical Therapists'] },
  { label: 'Teacher of the Visually Impaired', subjects: ['Teacher of the Visually Impaired'] },
  { label: 'Teacher of the Deaf & Hard of Hearing', subjects: ['Teacher of the Deaf & Hard of Hearing'] },
  { label: 'Student Support Team Activities', subjects: ['Student Support Team Activities'] },
  { label: 'Early Childhood / Pre-K', subjects: ['Early Childhood'] },
  { label: 'Early Childhood Special Education', subjects: ['Early Childhood Special Education'] },
  { label: 'Intervention Planning', subjects: ['Intervention Planning'] },
  { label: 'Staff PD & Meeting Planning', subjects: ['Staff PD & Meeting Planning'] },
  { label: 'Instructional Coaching', subjects: ['Instructional Coaching'] },
]

/** True when `subject` belongs to the module identified by `moduleLabel`. */
export function subjectInModule(subject, moduleLabel) {
  const mod = MODULES.find((m) => m.label === moduleLabel)
  return mod ? mod.subjects.includes(subject) : false
}

/** Returns the subject values owned by a module (empty array if unknown). */
export function subjectsForModule(moduleLabel) {
  return MODULES.find((m) => m.label === moduleLabel)?.subjects ?? []
}

/**
 * True when a saved lesson/assessment `subject` should appear under a subject
 * FILTER value. The filter dropdowns (Assessment Bank, Standards Tracker) use the
 * shared toolSubjects lists, which are MODULE labels — some of which own several
 * differently-named saved subjects (e.g. 'PE & Health' owns 'PE'/'Health'/…,
 * 'Library & Media' owns 'Library/Media'). Exact-matching the label against the
 * saved `subject` string therefore silently hid those lessons. This resolves the
 * label to its owned subjects, while still matching (a) modules whose label equals
 * their subject (Art, Music, CTE, …) and (b) any legacy row saved under the label.
 */
export function subjectMatchesFilter(subject, filterLabel) {
  return subject === filterLabel || subjectInModule(subject, filterLabel)
}

// The subjects the PE & Health module owns. CANONICAL allow-list used by both
// the PE dashboard scope and the PE lesson generator's Subject chips.
// (Previously each hand-maintained a deny-list off the full SUBJECT_AREAS
// array, which silently swept in every new specialist subject — Intervention
// Planning, Staff PD, etc. — as the app grew. Deriving from the registry keeps
// them in lockstep.)
export const PE_HEALTH_SUBJECTS = subjectsForModule('PE & Health')

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
//   stone (Intervention Planning) · gold (Staff PD & Meeting Planning) ·
//   periwinkle (Occupational Therapists) · coral (After-School Clubs) ·
//   steel (Test Prep) · zinc (Physical Therapists) · jade (World Languages) ·
//   cobalt (Teacher of the Visually Impaired) · magenta (Teacher of the Deaf & Hard of Hearing) ·
//   saffron (Elementary Technology / Computer Lab) · maroon (Theater / Drama) ·
//   mocha (Instructional Coaching) · olive (Dance) · denim (JROTC) ·
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
// When you consume one, move it out of this list (into the in-use comment above),
// add it to MODULE_STYLES in Landing.jsx, and write its SUBJECT_TAB_STYLES entry
// as `bg-{c}-500/20 text-ink-50` (the readable badge pattern). The 2026-07 pass-2
// hues (gold/coral/periwinkle/steel/mocha) are custom scales in tailwind.config.js.
export const AVAILABLE_MODULE_ACCENTS = [
  // ── 2026-07 palette expansion pass 3 — ALL CONSUMED ──
  // (jade→World Languages, cobalt→TVI, magenta→D-HH, saffron→Elementary Technology,
  //  maroon→Theater, mocha→Instructional Coaching, olive→Dance)
  //
  // ── 2026-07 palette expansion pass 4 (custom scales in tailwind.config.js) ──
  // Four muted/desaturated hues in the least-crowded remaining pockets; each needs a
  // distinct module icon to disambiguate a near-hue. (denim consumed → JROTC;
  // sage consumed → Early Childhood Special Education.)
  {
    key: 'clay', label: 'Clay (terracotta / earthenware)',
    tab: 'bg-clay-500/20 text-ink-50', iconTint: 'bg-clay-500/15',
    accentText: 'text-clay-400', hoverBorder: 'hover:border-clay-400/40',
    cardBorder: 'border-clay-400', callout: 'border-clay-500/30 bg-clay-500/10',
  },
  {
    key: 'sand', label: 'Sand (pale warm khaki neutral)',
    tab: 'bg-sand-500/20 text-ink-50', iconTint: 'bg-sand-500/15',
    accentText: 'text-sand-400', hoverBorder: 'hover:border-sand-400/40',
    cardBorder: 'border-sand-400', callout: 'border-sand-500/30 bg-sand-500/10',
  },
]
