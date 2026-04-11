import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
      },
      colors: {
        slate: {
          50: '#F5F5F5',   // White Smoke
          100: '#fbf4ef',  // Light Cashmere
          200: '#F2D9C7',  // Cashmere
          300: '#D1BFAD',  // Soft Amber
          400: '#C4D9D1',  // Horizon
          500: '#689c8e',  // Light Lochinvar
          600: '#508A7A',  // Lochinvar
          700: '#405954',  // Mineral Green
          800: '#344a46',  // Dark Mineral Green
          900: '#263633',  // Darker Mineral Green
          950: '#16211f',  // Deepest Mineral Green
        },
        gray: {
          50: '#F5F5F5',   // White Smoke
          100: '#fbf4ef',
          200: '#F2D9C7',  // Cashmere
          300: '#D1BFAD',  // Soft Amber
          400: '#C4D9D1',  // Horizon
          500: '#689c8e',
          600: '#508A7A',  // Lochinvar
          700: '#405954',  // Mineral Green
          800: '#344a46',
          900: '#263633',
          950: '#16211f',
        },
        brand: {
          dark: '#16211f',     // Deepest Mineral Green
          light: '#F5F5F5',    // White Smoke
          gold: '#D59066',     // Copperfield
          gray: '#C4D9D1'      // Horizon
        }
      }
    },
  },
  plugins: [],
};
export default config;
