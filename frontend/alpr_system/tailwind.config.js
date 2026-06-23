/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // base surfaces
        bg:      '#0f1117',
        surface: '#181c25',
        card:    '#1e2330',
        border:  '#2a3040',
        // text
        primary:   '#e8eaf0',
        secondary: '#8b92a5',
        muted:     '#4a5168',
        // accents
        amber:  '#f59e0b',
        'amber-dim': '#92610a',
        teal:   '#2dd4bf',
        'teal-dim':  '#0d6b62',
        red:    '#f87171',
        green:  '#4ade80',
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease both',
        'slide-up':   'slideUp 0.35s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}