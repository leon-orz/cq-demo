/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#0d0f12',
        panel: '#171a20',
        line: '#2c323d',
        ember: '#f59e0b',
      },
    },
  },
  plugins: [],
};
