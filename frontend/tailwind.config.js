/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#090B12',
        surface: {
          DEFAULT: '#101522',
          elevated: '#151C2B',
          hover: '#1E2638',
        },
        border: '#1E293B',
        accent: {
          primary: '#8B5CF6',
          secondary: '#38BDF8',
          hover: '#7C3AED',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          critical: '#EF4444',
          info: '#38BDF8',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(139, 92, 246, 0.3)',
        'glow-cyan': '0 0 20px -5px rgba(56, 189, 248, 0.3)',
      },
    },
  },
  plugins: [],
};
