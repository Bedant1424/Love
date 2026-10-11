/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#FFFDF9',
          surface: '#FFFFFF',
          elevated: '#FAF6EE',
          subtle: '#F3ECE0',
          dark: '#0F0A1C',
          plum: '#1E112A',
          twilight: '#1A1438',
        },
        festive: {
          marigold: '#EA580C',
          'marigold-hover': '#C2410C',
          gold: '#D97706',
          'gold-glow': '#FBBF24',
          vermilion: '#DC2626',
          pink: '#E11D48',
          emerald: '#059669',
          turquoise: '#0891B2',
          amber: '#F59E0B',
          crimson: '#BE123C',
        },
        content: {
          primary: '#1C1917',
          secondary: '#57534E',
          muted: '#78716C',
          light: '#FAF8F5',
          'light-muted': '#D6D3D1',
        },
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
        'warm-md': '0 4px 10px rgba(28, 25, 23, 0.08), 0 2px 4px rgba(28, 25, 23, 0.04)',
        'warm-lg': '0 10px 25px rgba(28, 25, 23, 0.10), 0 4px 10px rgba(28, 25, 23, 0.05)',
        'gold-glow': '0 0 25px rgba(251, 191, 36, 0.35)',
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
