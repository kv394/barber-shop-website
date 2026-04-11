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
      },
      boxShadow: {
        'sm': '0 2px 0 0 #E2E0D9, 0 3px 6px rgba(0,0,0,0.02)',
        DEFAULT: '0 4px 0 0 #E2E0D9, 0 5px 10px rgba(0,0,0,0.05)',
        'md': '0 6px 0 0 #E2E0D9, 0 8px 15px rgba(0,0,0,0.05)',
        'lg': '0 8px 0 0 #E2E0D9, 0 10px 20px rgba(0,0,0,0.05)',
        'xl': '0 12px 0 0 #E2E0D9, 0 15px 25px rgba(0,0,0,0.05)',
        '2xl': '0 16px 0 0 #E2E0D9, 0 20px 30px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
};
export default config;
