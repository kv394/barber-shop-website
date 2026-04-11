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
      fontSize: {
        'xs': ['0.9375rem', { lineHeight: '1.25rem' }],     // 15px (was 12px default)
        'sm': ['1.09375rem', { lineHeight: '1.5625rem' }],  // 17.5px (was 14px default)
        'base': ['1.25rem', { lineHeight: '1.875rem' }],    // 20px (was 16px default)
        'lg': ['1.40625rem', { lineHeight: '2.1875rem' }],  // 22.5px (was 18px default)
        'xl': ['1.5625rem', { lineHeight: '2.1875rem' }],   // 25px (was 20px default)
        '2xl': ['1.875rem', { lineHeight: '2.5rem' }],      // 30px (was 24px default)
        '3xl': ['2.34375rem', { lineHeight: '2.8125rem' }], // 37.5px (was 30px default)
        '4xl': ['2.8125rem', { lineHeight: '3.125rem' }],   // 45px (was 36px default)
        '5xl': ['3.75rem', { lineHeight: '1' }],            // 60px (was 48px default)
        '6xl': ['4.6875rem', { lineHeight: '1' }],          // 75px (was 60px default)
        '7xl': ['5.625rem', { lineHeight: '1' }],           // 90px (was 72px default)
        '8xl': ['7.5rem', { lineHeight: '1' }],             // 120px (was 96px default)
        '9xl': ['10rem', { lineHeight: '1' }],              // 160px (was 128px default)
      },
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
