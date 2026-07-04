/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent:    'var(--accent)',
        surface:   'var(--surface-card)',
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
      },
    },
  },
};
