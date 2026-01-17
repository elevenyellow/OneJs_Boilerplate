/**
 * Tailwind CSS Configuration
 *
 * Colors are imported from src/theme/tailwind.colors.js which mirrors
 * the TypeScript color definitions in src/theme/colors.ts.
 *
 * DO NOT define colors directly here - add them to colors.ts and
 * tailwind.colors.js to maintain a single source of truth.
 *
 * @type {import('tailwindcss').Config}
 */
const { tailwindColors } = require('./src/theme/tailwind.colors')

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tailwindColors,
    },
  },
  plugins: [],
}
