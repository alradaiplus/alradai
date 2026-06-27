import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bold orange/red accent from the reference design.
        brand: {
          DEFAULT: '#EC4516',
          50: '#FEF2EE',
          100: '#FDE2D8',
          200: '#FBC3AF',
          300: '#F89B79',
          400: '#F4703F',
          500: '#EC4516',
          600: '#D43A0F',
          700: '#B02E0D',
          800: '#8C2611',
          900: '#722312',
        },
        // Warm-neutral surface + text scale for the light UI.
        surface: {
          DEFAULT: '#F5F6F7',
          card: '#FFFFFF',
          muted: '#EDEEF0',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#404449',
          faint: '#71757B',
        },
        line: '#E4E6E9',
      },
      fontFamily: {
        // Populated via CSS variables in layout.
        cairo: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px -4px rgba(16,24,40,0.08)',
        'card-hover':
          '0 2px 4px rgba(16,24,40,0.06), 0 12px 28px -6px rgba(16,24,40,0.16)',
        brand: '0 8px 24px -8px rgba(236,69,22,0.5)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pop-in': 'pop-in 0.18s ease-out both',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('rtl', '&:where([dir="rtl"], [dir="rtl"] *)');
      addVariant('ltr', '&:where([dir="ltr"], [dir="ltr"] *)');
    }),
  ],
};

export default config;
