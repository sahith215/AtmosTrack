/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEF9F3',
          100: '#FDF2E9',
          200: '#FCE4D2',
          300: '#F9CDB3',
          400: '#F5B18A',
          500: '#F19066',
          600: '#EC6E3F',
          700: '#E55A2B',
          800: '#D14A1F',
          900: '#B5431C',
        },
        orange: {
          50: '#FFF4ED',
          100: '#FFE7D6',
          200: '#FFCCAC',
          300: '#FFA877',
          400: '#FF8C42',
          500: '#FF6B1A',
          600: '#F04F0F',
          700: '#C73B0F',
          800: '#9E3016',
          900: '#7F2A15',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};