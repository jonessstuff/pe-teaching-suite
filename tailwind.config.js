/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // PlansK12 logo blue — the wordmark/checkmark hue (#4F7FFA) and its
        // darker fold shade (#3b6de8 at 600). Used to tie the marketing landing
        // page back to the actual brand mark. Kept separate from `accent`
        // (emerald) so the in-app UI palette is unchanged.
        brand: {
          50: '#eff4ff',
          100: '#dbe6ff',
          200: '#bfd2ff',
          300: '#93b4fd',
          400: '#6f97fb',
          500: '#4F7FFA',
          600: '#3b6de8',
          700: '#2f57c4',
          800: '#2a4a9e',
          900: '#27417d',
        },
        subject: {
          pe: '#2dd4d4',
          health: '#8a6fd4',
          family: '#e0a23a',
          drivers: '#5b8bdb',
        },
        // Extra module-accent hues (see AVAILABLE_MODULE_ACCENTS in
        // src/constants/modules.js). Custom scales because the standard Tailwind
        // hues are now all in use; each is tuned to sit in a real gap on the
        // color wheel and read AA on the dark UI at the -400 shade. Used with the
        // same pattern as every other accent: bg-{c}-500/15, text-{c}-400,
        // border-{c}-400. (A 5th option, zinc, is built into Tailwind already.)
        crimson: { 300: '#f5a3a3', 400: '#ef4d4d', 500: '#d92d2d' }, // true red (vs pink-ish rose)
        grass:   { 300: '#86dd97', 400: '#46c860', 500: '#2ba347' }, // leaf green (vs mint emerald / yellow lime)
        bronze:  { 300: '#dcaf78', 400: '#c98a3f', 500: '#a66f2c' }, // copper/brown (no brown in palette)
        plum:    { 300: '#dc9fc0', 400: '#c56b9a', 500: '#a34e7c' }, // muted wine (vs bright fuchsia/pink)
        // 2026-07 palette expansion pass 2 (saturated wheel nearly full — these
        // sit in the remaining gaps; pair near-hues with distinct module icons).
        gold:      { 300: '#e6c85e', 400: '#d4a72c', 500: '#ad841c' }, // mustard/ochre (vs orange amber / green-yellow lime)
        coral:     { 300: '#f6a892', 400: '#f27a5c', 500: '#dd5a3c' }, // warm coral (vs pink rose / orange)
        periwinkle:{ 300: '#b3b6f6', 400: '#8b90ee', 500: '#6a70e0' }, // blue-violet (between blue and violet)
        steel:     { 300: '#9fb3c8', 400: '#6b8db0', 500: '#4e6f92' }, // muted slate-blue (vs grayer slate)
        mocha:     { 300: '#c4a893', 400: '#a07d63', 500: '#7f6049' }, // warm mid-brown neutral (vs taupe stone / copper bronze)
        // 2026-07 palette expansion pass 3 (wheel is full — these are saturated
        // mid-tones tuned to the least-crowded remaining regions; pair near-hues
        // with a distinct module icon). Same usage: bg-{c}-500/15, text-{c}-400,
        // border-{c}-400. All read AA on the dark UI at -400.
        jade:      { 300: '#6fe0bd', 400: '#22b892', 500: '#12876a' }, // jewel green (between emerald and teal)
        cobalt:    { 300: '#8fb0f7', 400: '#4f82ef', 500: '#3160cc' }, // strong mid-blue (deeper/bluer than sky, vs Library blue)
        magenta:   { 300: '#f07bce', 400: '#dd45a8', 500: '#b82f88' }, // vivid magenta (between fuchsia and plum)
        saffron:   { 300: '#f6d067', 400: '#e6a70c', 500: '#bd850a' }, // golden saffron yellow (vs mustard gold / amber)
        olive:     { 300: '#c4cc72', 400: '#9aa32c', 500: '#767d20' }, // olive yellow-green (vs bright lime / leaf grass)
        maroon:    { 300: '#d68a8a', 400: '#bd4a4a', 500: '#9a3636' }, // deep brick red (browner/darker than true-red crimson)
        // 2026-07 palette expansion pass 4 (the saturated wheel is exhausted — these
        // lean muted/desaturated and sit in the least-crowded remaining pockets; each
        // pairs with a distinct module icon to disambiguate a near-hue). Same usage:
        // bg-{c}-500/15, text-{c}-400, border-{c}-400. All read AA on the dark UI at -400.
        denim:     { 300: '#9db6d6', 400: '#5a83b5', 500: '#41618c' }, // dusty civic blue (faded true-blue, vs saturated cobalt / greyer steel / bright sky)
        sage:      { 300: '#aec6a6', 400: '#7ba06d', 500: '#5c7e50' }, // muted grey-green (desaturated, vs vivid grass / yellow-olive / teal-jade)
        clay:      { 300: '#e2a48a', 400: '#c76d48', 500: '#a35334' }, // terracotta / earthenware (redder-brown than bronze, oranger than maroon, muted vs coral)
        sand:      { 300: '#e6d3a4', 400: '#c7a458', 500: '#a4843c' }, // pale warm khaki neutral (lighter/desaturated vs golden gold-saffron, vs dark-brown mocha)
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 1px 0 rgb(15 23 42 / 0.03)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
