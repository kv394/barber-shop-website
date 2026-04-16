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
        crm: {
          bg: '#F8FAFC',       // Slate 50
          surface: '#FFFFFF',  // Pure White
          border: '#E2E8F0',   // Slate 200
          text: '#0F172A',     // Slate 900
          muted: '#64748B',    // Slate 500
          primary: '#2563EB',  // Blue 600
          accent: '#4F46E5',   // Indigo 600
          darkBase: '#020617', // Slate 950
        },
        status: {
          confirmed: '#16A34A', // Green 600
          pending: '#D97706',   // Amber 600
          cancelled: '#DC2626', // Red 600
          info: '#2563EB',      // Blue 600
        },
        brand: {
          dark: '#0F172A',     // Slate 900
          light: '#F8FAFC',    // Slate 50
          gold: '#4F46E5',     // Indigo 600 (replacing gold with indigo)
          gray: '#E2E8F0'      // Slate 200
        }
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
        'xl': '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
      }
    },
  },
  plugins: [],
};
export default config;
