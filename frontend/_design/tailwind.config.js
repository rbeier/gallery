/** @type {import('tailwindcss').Config} */
// Design tokens for the Robin Beier gallery.
// Semantic colors are driven by CSS variables (see globals.css) so that
// `dark:` — or just the system preference — swaps the whole palette.
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  // Gallery follows the OS setting. Switch to 'class' if you add a manual toggle.
  darkMode: 'media',

  theme: {
    extend: {
      colors: {
        // Semantic (theme-aware) — resolve from CSS variables
        bg:      'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink:     'rgb(var(--ink) / <alpha-value>)',
        muted:   'rgb(var(--muted) / <alpha-value>)',
        line:    'rgb(var(--line) / <alpha-value>)',
        chip:    'rgb(var(--chip) / <alpha-value>)',

        // Raw ramps, if you want to reference tones directly
        paper: {
          50:  '#faf8f3',
          100: '#f5f2ea', // light bg
          200: '#ece6da',
          900: '#221e17', // dark surface
          950: '#17140f', // dark bg
        },
        ink: {
          DEFAULT: '#241f18', // light text
          soft:    '#ece6d9', // dark text
        },
      },

      fontFamily: {
        // Editorial display serif
        serif: ['Newsreader', 'Georgia', 'serif'],
        // UI / body
        sans:  ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Metadata, counters, labels
        mono:  ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },

      // Fluid type used across the app (clamp-based, responsive without breakpoints)
      fontSize: {
        'display':  ['clamp(30px, 5.6vw, 50px)', { lineHeight: '1.04', letterSpacing: '-0.015em' }],
        'title':    ['clamp(24px, 3.2vw, 38px)', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'heading':  ['clamp(16px, 2.2vw, 19px)', { lineHeight: '1.2' }],
        'meta':     ['10.5px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },

      letterSpacing: {
        label: '0.14em', // uppercase mono eyebrows
        wide:  '0.2em',
      },

      borderRadius: {
        tile: '8px',   // grid images
        card: '12px',  // album covers
        pill: '20px',  // chips / tabs
      },

      maxWidth: {
        prose:   '34em',  // descriptions
        content: '1180px',
        wide:    '1500px', // grid on large screens
      },

      transitionDuration: {
        theme: '300ms', // bg/color crossfade on theme change
      },

      keyframes: {
        rise: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        fade: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        rise: 'rise 0.4s ease both',
        fade: 'fade 0.28s ease',
      },
    },
  },

  plugins: [],
};
