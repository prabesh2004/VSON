/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B121B',
        surface: '#161F2C',
        'card-border': '#2F3C4C',
        'accent-light': '#A9D1F5',
        'text-muted': '#7A8B9B',
        'text-primary': '#E9EEF4',
        voice: '#00D4AA',
        accent: '#A9D1F5',
        error: '#FF6B6B',
        warning: '#FFB347',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
        voice: '80px',
      },
      minWidth: {
        touch: '48px',
        voice: '80px',
      },
    },
  },
  plugins: [],
}
