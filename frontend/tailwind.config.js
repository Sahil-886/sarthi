export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fffbeb',       // warm yellow background
        secondary: '#fef9c3',     // lighter yellow
        accent: '#f59e0b',        // amber accent
        accentDark: '#d97706',    // darker amber for hover
        text: '#1c1917',          // warm dark text
        lightText: '#78716c',     // warm medium text
        card: '#ffffff',          // white cards
        border: '#fde68a',        // yellow border
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
