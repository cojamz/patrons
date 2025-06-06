/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.6)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.6)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.6)',
        'glow-purple': '0 0 20px rgba(147, 51, 234, 0.6)',
        'glow-yellow': '0 0 20px rgba(234, 179, 8, 0.6)',
      }
    },
  },
  plugins: [],
}