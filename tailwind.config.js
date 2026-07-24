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
