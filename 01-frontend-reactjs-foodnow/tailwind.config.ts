import type { Config } from 'tailwindcss';

/**
 * FoodNow design tokens. The palette reads as a kitchen order ticket, not a
 * generic delivery-app orange gradient: chili + turmeric accents on warm
 * receipt-paper, with a monospace face reserved for order codes/prices/
 * status timestamps (see shared/components/ui, features/orders).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1410',
        paper: '#FBF6EC',
        primary: {
          DEFAULT: '#D93F2B', // chili
          hover: '#C22F1D',
          bg: '#FBE4DE',
        },
        accent: {
          DEFAULT: '#E8A33D', // turmeric
          bg: '#FAEBD2',
        },
        success: {
          DEFAULT: '#4C7A50', // scallion
          bg: '#E4EEE1',
        },
        danger: {
          DEFAULT: '#B3261E',
          bg: '#F7E1DF',
        },
        muted: {
          DEFAULT: '#8A7F6E', // broth
          border: '#E3DACB',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        ticket: '0.375rem',
      },
    },
  },
} satisfies Config;
