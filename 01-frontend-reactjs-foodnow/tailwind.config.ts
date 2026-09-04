import type { Config } from 'tailwindcss';

/**
 * FoodNow design tokens — "order ticket & ink stamp", not food-photo colors:
 * cool near-black ink on grey-white paper, one red-stamp accent reserved for
 * primary actions, monospace reserved for order codes only (never prices or
 * labels — see UX-AUDIT-REPORT.md / design brief G4). Token *names* are kept
 * stable from the original scaffold so the ~50 existing call sites resolve
 * unchanged; only the underlying values move away from the cream+chili
 * defaults. See shared/components/ui for the primitives built on these.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15181A',
        paper: '#F6F6F3',
        primary: {
          DEFAULT: '#C1392B', // ink-stamp red
          hover: '#A32E22',
          bg: '#F6E2DF',
        },
        accent: {
          DEFAULT: '#C98A2C', // turmeric — warning semantic only, not decoration
          bg: '#F5E8D2',
        },
        success: {
          DEFAULT: '#3F7A5C', // herb green
          bg: '#E1EDE6',
        },
        danger: {
          DEFAULT: '#7A2B24', // maroon — deliberately not the same red as `primary`
          bg: '#F0DEDC',
        },
        muted: {
          DEFAULT: '#5B5D5F', // AA on paper-50 (fixes G6 contrast finding)
          border: '#DEDCD4',
        },
        status: {
          pending: '#8A8580',
          confirmed: '#C98A2C',
          preparing: '#B96A2C',
          ready: '#3B6E8F',
          enroute: '#2E7D6B',
          delivered: '#3F7A5C',
          cancelled: '#7A2B24',
        },
      },
      fontFamily: {
        display: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      // Diacritic headroom: display 1.35x / body 1.55x / caption 1.45x line-height
      // (Vietnamese tone marks clip at typical 1.1-1.2x Latin-only line-heights).
      fontSize: {
        'display-lg': ['2.25rem', { lineHeight: '1.35', fontWeight: '700' }],
        'display-md': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.55', fontWeight: '500' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.45', fontWeight: '500' }],
        'mono-code': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        ticket: '0.375rem', // reserved for receipt-like components (checkout summary, totals, stamp)
        card: '0.5rem', // generic containers
      },
      boxShadow: {
        // Elevation is mostly flat + hairline borders; shadow reserved for things
        // that actually float above content (modal, sticky bar, toast).
        float: '0 8px 24px -8px rgb(21 24 26 / 0.25)',
      },
    },
  },
} satisfies Config;
