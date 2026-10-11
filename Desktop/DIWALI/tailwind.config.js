/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0F0E13',
          surface: '#1A1822',
          elevated: '#242130',
        },
        festive: {
          marigold: '#FF8800',
          'marigold-hover': '#E67A00',
          crimson: '#E63946',
          amber: '#FBBF24',
        },
        content: {
          primary: '#F9FAFB',
          secondary: '#D1D5DB',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        display: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
};
