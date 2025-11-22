/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    // Next.js pages and components
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',

    // Global CSS files
    './styles/**/*.{css}',

    // CSS Modules
    './**/*.module.css',

    // If you have a shared-ui package in the monorepo
    '../shared-ui/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'enjoyment-yellow': '#FFD700',
        'enjoyment-orange': '#FF8C00',
        'enjoyment-pink':   '#FF4FAA',
        'enjoyment-teal':   '#20C997',
        'background-light': '#FFFAF0',
        'neutral-dark':     '#2E2E2E',
      },
      fontFamily: {
        sans: ['Noto Sans', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};