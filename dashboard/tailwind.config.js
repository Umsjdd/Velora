/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        v: {
          bg: '#05050a',
          surface: '#0a0a12',
          card: '#0c0c18',
          'card-hover': '#10102a',
          accent: '#4a6cf7',
          'accent-light': '#6b8aff',
          'accent-dark': '#3a56d4',
          purple: '#7c5cf7',
        }
      }
    }
  },
  plugins: [],
}
