/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c2d3ff',
          300: '#93aeff',
          400: '#607dff',
          500: '#3b5bfe',
          600: '#2338f5',
          700: '#1a27e0',
          800: '#1b22b5',
          900: '#1c228e',
        },
        surface: '#0f1117',
        card:    '#1a1d2e',
        border:  '#252840',
        muted:   '#8892b0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
