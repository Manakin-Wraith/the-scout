/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          850: '#151b28',
          900: '#0f172a',
          950: '#020617',
        },
        terminal: {
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
          blue: '#3b82f6',
        }
      }
    }
  },
  plugins: [],
}
