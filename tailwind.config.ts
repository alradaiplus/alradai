import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0A0A',
          900: '#080808',
          800: '#0A0A0A',
          700: '#121212',
          600: '#1A1A1A',
        },
        gold: {
          DEFAULT: '#D4A843',
          50: '#FBF6E8',
          100: '#F5E9C2',
          200: '#EDD693',
          300: '#E3C162',
          400: '#D9B24E',
          500: '#D4A843',
          600: '#B88A2C',
          700: '#8E691F',
          800: '#654915',
          900: '#3E2C0C',
        },
      },
      fontFamily: {
        // Populated via CSS variables in layout
        cairo: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'system-ui', 'sans-serif'],
        space: ['var(--font-space)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'gold-glow': '0 0 40px -8px rgba(212, 168, 67, 0.45)',
        'gold-glow-lg': '0 0 80px -10px rgba(212, 168, 67, 0.55)',
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, #D4A843 0%, #F5E9C2 45%, #B88A2C 100%)',
        'diagonal-grid':
          'linear-gradient(45deg, rgba(212,168,67,0.04) 1px, transparent 1px), linear-gradient(-45deg, rgba(212,168,67,0.04) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(ellipse at 50% 30%, rgba(212,168,67,0.06) 0%, transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gold-border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'scroll-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease-out both',
        'gold-border-spin': 'gold-border-spin 8s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'scroll-bounce': 'scroll-bounce 1.8s ease-in-out infinite',
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
