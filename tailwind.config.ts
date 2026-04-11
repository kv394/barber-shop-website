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
        'xs': ['1.125rem', { lineHeight: '1.5rem' }],     // 18px (was 12px)
        'sm': ['1.3125rem', { lineHeight: '1.875rem' }],  // 21px (was 14px)
        'base': ['1.5rem', { lineHeight: '2.25rem' }],    // 24px (was 16px)
        'lg': ['1.6875rem', { lineHeight: '2.625rem' }],  // 27px (was 18px)
        'xl': ['1.875rem', { lineHeight: '2.625rem' }],   // 30px (was 20px)
        '2xl': ['2.25rem', { lineHeight: '3rem' }],       // 36px (was 24px)
        '3xl': ['2.8125rem', { lineHeight: '3.375rem' }], // 45px (was 30px)
        '4xl': ['3.375rem', { lineHeight: '3.75rem' }],   // 54px (was 36px)
        '5xl': ['4.5rem', { lineHeight: '1' }],           // 72px (was 48px)
        '6xl': ['5.625rem', { lineHeight: '1' }],         // 90px (was 60px)
        '7xl': ['6.75rem', { lineHeight: '1' }],          // 108px (was 72px)
        '8xl': ['9rem', { lineHeight: '1' }],             // 144px (was 96px)
        '9xl': ['12rem', { lineHeight: '1' }],            // 192px (was 128px)
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
      }
    },
  },
  plugins: [],
};
export default config;
