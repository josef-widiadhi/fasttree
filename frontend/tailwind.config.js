/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bark: {
          50:  '#fdf8f0',
          100: '#f5e6cc',
          200: '#e8c99a',
          300: '#d4a060',
          400: '#b87832',
          500: '#8b5e2a',
          600: '#6b4520',
          700: '#4d2f14',
          800: '#31190a',
          900: '#180a02',
        },
        leaf: {
          50:  '#f0faf0',
          100: '#d6f0d6',
          200: '#a8dda8',
          300: '#6ec06e',
          400: '#3fa03f',
          500: '#267a26',
          600: '#165816',
          700: '#0a3a0a',
          800: '#041f04',
          900: '#010a01',
        },
        parchment: '#faf3e0',
        ink: '#1a1008',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
      }
    },
  },
  plugins: [],
}
