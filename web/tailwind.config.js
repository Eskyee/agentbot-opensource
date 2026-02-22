/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          light: '#FFFFFF',
          dark: '#0A0B0D',
          blue: '#0052FF',
        },
        lobster: {
          50: '#edf3ff',
          100: '#dbe8ff',
          200: '#b8d0ff',
          300: '#84adff',
          400: '#4f85ff',
          500: '#0052FF',
          600: '#0045d9',
          700: '#0035ad',
          800: '#002a88',
          900: '#001f66',
        }
      }
    },
  },
  plugins: [],
}
