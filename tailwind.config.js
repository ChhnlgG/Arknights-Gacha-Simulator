/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dust: {
          50: '#f1ede2',
          100: '#e7e5df',
          200: '#d2cec4',
          300: '#b9b4aa',
          400: '#77746e',
          500: '#54534f',
          600: '#3a3936',
          700: '#2a2a27',
          800: '#1d1d1b',
          900: '#141412',
          950: '#111110',
        },
        ember: {
          50: '#fff5e3',
          100: '#ffe0a8',
          200: '#f6c56b',
          300: '#e8a63a',
          400: '#cf8618',
          500: '#a76610',
          600: '#7d4b0a',
        },
        plum: {
          300: '#cd9ee6',
          400: '#9c82b8',
          500: '#7c68a0',
          600: '#4d3d6b',
        },
        pine: {
          300: '#7fae9c',
          400: '#5a8f7c',
          500: '#47705f',
        },
        ark: {
          bg: '#111110',
          'bg-deep': '#0c0c0b',
          border: '#2a2a2c',
        },
      },
      fontFamily: {
        display: ['"Ark Serif"', '"Noto Serif SC"', 'Songti SC', 'SimSun', 'serif'],
        body: [
          '"Ark Sans"',
          '"Noto Sans SC"',
          'system-ui',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      borderRadius: {
        'r-btn': '4px',
        'r-card': '6px',
        'r-tag': '2px',
      },
      letterSpacing: {
        label: '0.14em',
        dense: '-0.01em',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'perspective(1200px) rotateY(140deg) scale(.78)', opacity: '0' },
          '60%': { transform: 'perspective(1200px) rotateY(-12deg) scale(1.02)', opacity: '1' },
          to: { transform: 'perspective(1200px) rotateY(0) scale(1)', opacity: '1' },
        },
        floatIn: {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        bannerIn: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          to: { opacity: '1' },
        },
        'breathing-gold': {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(255,214,140,0.45), 0 0 18px 2px rgba(232,166,58,0.30), 0 10px 24px -12px rgba(0,0,0,0.9)' },
          '50%': { boxShadow: '0 0 0 1px rgba(255,226,170,0.75), 0 0 30px 6px rgba(232,166,58,0.55), 0 10px 26px -12px rgba(0,0,0,0.9)' },
        },
      },
      animation: {
        'card-flip': 'cardFlip .72s cubic-bezier(.2,.8,.2,1) forwards',
        'float-in': 'floatIn .42s cubic-bezier(.2,.8,.2,1) forwards',
        'banner-in': 'bannerIn .22s ease-out both',
        'fade-in': 'fadeIn .25s ease-out both',
        'breathing-gold': 'breathing-gold 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
