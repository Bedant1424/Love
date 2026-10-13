/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'rose-CTA': '#C2315D',
        'rose-CTA-hover': '#AB2B52',
        'lavender-CTA': '#7A4AC2',
        'lavender-CTA-hover': '#683BA8',
        rose: {
          50: '#FFF5F7',
          100: '#FFE6EC',
          300: '#F9A8BD',
          500: '#E85D83',
        },
        lavender: {
          50: '#F7F4FD',
          100: '#EFE9FA',
          200: '#DFD2F5',
          400: '#B799E6',
          500: '#9F7AEA',
          800: '#523685',
        },
        cream: {
          50: '#FAF7F2',
          100: '#F3ECE2',
        },
        plum: {
          900: '#241530',
          950: '#160B1F',
        },
        gold: {
          400: '#FCD34D',
          500: '#F59E0B',
        },
        neutral: {
          500: '#736882',
          800: '#2D2635',
        },
      },
      fontFamily: {
        heading: ['Pacifico', 'Playfair Display', 'Caveat', 'Georgia', 'serif'],
        body: ['Quicksand', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        handwriting: ['Caveat', 'Dancing Script', 'cursive'],
      },
      boxShadow: {
        polaroid: '0 8px 24px -4px rgba(45, 38, 53, 0.12), 0 2px 6px -1px rgba(45, 38, 53, 0.06)',
        card: '0 10px 25px -5px rgba(159, 122, 234, 0.15)',
        floating: '0 20px 35px -8px rgba(45, 38, 53, 0.22)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { transform: 'scale(1) rotate(-1deg)', opacity: '0.95' },
          '50%': { transform: 'scale(1.1) rotate(1.5deg)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
      },
      animation: {
        flicker: 'flicker 0.6s infinite alternate ease-in-out',
        float: 'float 3.5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
