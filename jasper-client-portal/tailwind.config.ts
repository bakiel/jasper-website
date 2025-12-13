import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // JASPER Brand Colors - using CSS variables
        jasper: {
          navy: 'var(--jasper-navy)',
          emerald: 'var(--jasper-emerald)',
          'emerald-dark': 'var(--jasper-emerald-dark)',
          'emerald-light': 'var(--jasper-emerald-light)',
          carbon: 'var(--jasper-carbon)',
          graphite: 'var(--jasper-graphite)',
          slate: 'var(--jasper-slate)',
          'slate-light': 'var(--jasper-slate-light)',
        },
        // Semantic colors using CSS variables
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          light: 'var(--border-light)',
          dark: 'var(--border-dark)',
        },
        // Status colors
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(44, 138, 91, 0.3)',
        'glow-lg': '0 0 40px rgba(44, 138, 91, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
