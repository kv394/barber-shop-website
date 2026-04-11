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
        botanical: {
          bg: '#F8F6F3',       // Warm Alabaster (App Background)
          surface: '#FFFFFF',  // Pure White (Card/Calendar Surface)
          border: '#E2E0D9',   // Oatmeal (Borders/Dividers)
          text: '#2A2C31',     // Deep Charcoal (Primary Text)
          muted: '#68707A',    // Muted Slate (Secondary Text)
          primary: '#3A5A40',  // Deep Sage Green (Primary Action/CTA)
          accent: '#D4A373',   // Soft Clay (Secondary Accent)
          darkBase: '#1A1D21', // Dark Mode Base
        },
        status: {
          confirmed: '#2D7D53', // Muted Emerald
          pending: '#D9822B',   // Earthy Amber
          cancelled: '#C54E4E', // Soft Crimson
          info: '#3A7CA5',      // Calm Steel Blue
        },
        brand: {
          dark: '#2A2C31',     // Deep Charcoal
          light: '#F8F6F3',    // Warm Alabaster
          gold: '#D4A373',     // Soft Clay (replacing old gold)
          gray: '#E2E0D9'      // Oatmeal
        }
      }
    },
  },
  plugins: [],
};
export default config;
