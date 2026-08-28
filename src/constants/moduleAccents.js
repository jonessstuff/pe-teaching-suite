// ─── Module accent tokens ────────────────────────────────────────────────────
// Single source of truth for per-specialty card treatments, so the card / button
// / color styling stays identical everywhere it's used (the ModulePicker today,
// and any future surface). Keyed by accent color name; each catalog entry just
// carries `accent: '<name>'`.
//
// ALL class strings are LITERAL — Tailwind's JIT can't compile interpolated names
// like `border-t-${c}`, so every variant is spelled out here once.
//
// Fields:
//   wrap        icon-well + button tint background      (bg-{c}-500/15)
//   icon        icon glyph color                        (text-{c}-400)
//   topBorder   2px colored top edge on the card        (border-t-{c}-400)
//   buttonBg    the "Open …" button surface + hover     (bg-{c}-500/15 group-hover:bg-{c}-500/25)
//   buttonText  the "Open …" label + arrow color
//
// buttonText is the ONLY per-hue-tuned field: a light-mode shade verified ≥4.5:1
// (AA) on white, plus `dark:text-{c}-400` (the established dark-UI-safe shade).
// Eight bright custom hues can't reach AA as a color on white (they max at -500),
// so their light-mode label falls back to near-black ink — the tinted button,
// colored top border, and icon well still carry the specialty identity.

const A = (wrap, icon, topBorder, buttonBg, buttonText) => ({ wrap, icon, topBorder, buttonBg, buttonText })

export const MODULE_ACCENTS = {
  // AA-safe as a specialty color (light-mode shade / dark:-400)
  accent:     A('bg-accent-500/15',     'text-accent-400',     'border-t-accent-400',     'bg-accent-500/15 group-hover:bg-accent-500/25',         'text-accent-700 dark:text-accent-400'),
  orange:     A('bg-orange-500/15',     'text-orange-400',     'border-t-orange-400',     'bg-orange-500/15 group-hover:bg-orange-500/25',         'text-orange-700 dark:text-orange-400'),
  blue:       A('bg-blue-500/15',       'text-blue-400',       'border-t-blue-400',       'bg-blue-500/15 group-hover:bg-blue-500/25',             'text-blue-600 dark:text-blue-400'),
  purple:     A('bg-purple-500/15',     'text-purple-400',     'border-t-purple-400',     'bg-purple-500/15 group-hover:bg-purple-500/25',         'text-purple-600 dark:text-purple-400'),
  cyan:       A('bg-cyan-500/15',       'text-cyan-400',       'border-t-cyan-400',       'bg-cyan-500/15 group-hover:bg-cyan-500/25',             'text-cyan-700 dark:text-cyan-400'),
  pink:       A('bg-pink-500/15',       'text-pink-400',       'border-t-pink-400',       'bg-pink-500/15 group-hover:bg-pink-500/25',             'text-pink-600 dark:text-pink-400'),
  fuchsia:    A('bg-fuchsia-500/15',    'text-fuchsia-400',    'border-t-fuchsia-400',    'bg-fuchsia-500/15 group-hover:bg-fuchsia-500/25',       'text-fuchsia-600 dark:text-fuchsia-400'),
  amber:      A('bg-amber-500/15',      'text-amber-400',      'border-t-amber-400',      'bg-amber-500/15 group-hover:bg-amber-500/25',           'text-amber-700 dark:text-amber-400'),
  stone:      A('bg-stone-500/15',      'text-stone-400',      'border-t-stone-400',      'bg-stone-500/15 group-hover:bg-stone-500/25',           'text-stone-600 dark:text-stone-400'),
  lime:       A('bg-lime-500/15',       'text-lime-400',       'border-t-lime-400',       'bg-lime-500/15 group-hover:bg-lime-500/25',             'text-lime-700 dark:text-lime-400'),
  sky:        A('bg-sky-500/15',        'text-sky-400',        'border-t-sky-400',        'bg-sky-500/15 group-hover:bg-sky-500/25',               'text-sky-700 dark:text-sky-400'),
  violet:     A('bg-violet-500/15',     'text-violet-400',     'border-t-violet-400',     'bg-violet-500/15 group-hover:bg-violet-500/25',         'text-violet-600 dark:text-violet-400'),
  indigo:     A('bg-indigo-500/15',     'text-indigo-400',     'border-t-indigo-400',     'bg-indigo-500/15 group-hover:bg-indigo-500/25',         'text-indigo-600 dark:text-indigo-400'),
  zinc:       A('bg-zinc-500/15',       'text-zinc-400',       'border-t-zinc-400',       'bg-zinc-500/15 group-hover:bg-zinc-500/25',             'text-zinc-600 dark:text-zinc-400'),
  maroon:     A('bg-maroon-500/15',     'text-maroon-400',     'border-t-maroon-400',     'bg-maroon-500/15 group-hover:bg-maroon-500/25',         'text-maroon-500 dark:text-maroon-400'),
  denim:      A('bg-denim-500/15',      'text-denim-400',      'border-t-denim-400',      'bg-denim-500/15 group-hover:bg-denim-500/25',           'text-denim-500 dark:text-denim-400'),
  sage:       A('bg-sage-500/15',       'text-sage-400',       'border-t-sage-400',       'bg-sage-500/15 group-hover:bg-sage-500/25',             'text-sage-500 dark:text-sage-400'),
  cobalt:     A('bg-cobalt-500/15',     'text-cobalt-400',     'border-t-cobalt-400',     'bg-cobalt-500/15 group-hover:bg-cobalt-500/25',         'text-cobalt-500 dark:text-cobalt-400'),
  magenta:    A('bg-magenta-500/15',    'text-magenta-400',    'border-t-magenta-400',    'bg-magenta-500/15 group-hover:bg-magenta-500/25',       'text-magenta-500 dark:text-magenta-400'),
  plum:       A('bg-plum-500/15',       'text-plum-400',       'border-t-plum-400',       'bg-plum-500/15 group-hover:bg-plum-500/25',             'text-plum-500 dark:text-plum-400'),
  mocha:      A('bg-mocha-500/15',      'text-mocha-400',      'border-t-mocha-400',      'bg-mocha-500/15 group-hover:bg-mocha-500/25',           'text-mocha-500 dark:text-mocha-400'),
  steel:      A('bg-steel-500/15',      'text-steel-400',      'border-t-steel-400',      'bg-steel-500/15 group-hover:bg-steel-500/25',           'text-steel-500 dark:text-steel-400'),
  crimson:    A('bg-crimson-500/15',    'text-crimson-400',    'border-t-crimson-400',    'bg-crimson-500/15 group-hover:bg-crimson-500/25',       'text-crimson-500 dark:text-crimson-400'),

  // Bright custom hues — can't hit AA as a color on white, so light-mode label is
  // ink (dark:-400 keeps color in dark mode). Identity stays via border/well/tint.
  olive:      A('bg-olive-500/15',      'text-olive-400',      'border-t-olive-400',      'bg-olive-500/15 group-hover:bg-olive-500/25',           'text-ink-100 dark:text-olive-400'),
  saffron:    A('bg-saffron-500/15',    'text-saffron-400',    'border-t-saffron-400',    'bg-saffron-500/15 group-hover:bg-saffron-500/25',       'text-ink-100 dark:text-saffron-400'),
  coral:      A('bg-coral-500/15',      'text-coral-400',      'border-t-coral-400',      'bg-coral-500/15 group-hover:bg-coral-500/25',           'text-ink-100 dark:text-coral-400'),
  jade:       A('bg-jade-500/15',       'text-jade-400',       'border-t-jade-400',       'bg-jade-500/15 group-hover:bg-jade-500/25',             'text-ink-100 dark:text-jade-400'),
  grass:      A('bg-grass-500/15',      'text-grass-400',      'border-t-grass-400',      'bg-grass-500/15 group-hover:bg-grass-500/25',           'text-ink-100 dark:text-grass-400'),
  bronze:     A('bg-bronze-500/15',     'text-bronze-400',     'border-t-bronze-400',     'bg-bronze-500/15 group-hover:bg-bronze-500/25',         'text-ink-100 dark:text-bronze-400'),
  periwinkle: A('bg-periwinkle-500/15', 'text-periwinkle-400', 'border-t-periwinkle-400', 'bg-periwinkle-500/15 group-hover:bg-periwinkle-500/25', 'text-ink-100 dark:text-periwinkle-400'),
  gold:       A('bg-gold-500/15',       'text-gold-400',       'border-t-gold-400',       'bg-gold-500/15 group-hover:bg-gold-500/25',             'text-ink-100 dark:text-gold-400'),
}

export const DEFAULT_ACCENT = MODULE_ACCENTS.steel

export function moduleAccent(name) {
  return MODULE_ACCENTS[name] ?? DEFAULT_ACCENT
}
