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
          bg: '#f4f5f7',       // Pale cool gray (app bg)
          surface: '#FFFFFF',  // Pure White (cards, sidebars)
          border: '#f3f4f6',   // Gray-100
          text: '#1f2937',     // Gray-800
          muted: '#6b7280',    // Gray-500
          primary: '#f05a28',  // Vibrant coral/orange
          accent: '#ea580c',   // Orange-600
          darkBase: '#111827', // Gray-900
        },
        status: {
          confirmed: '#16A34A', // Green 600
          pending: '#F59E0B',   // Amber 500
          cancelled: '#DC2626', // Red 600
          info: '#3B82F6',      // Blue 500
          hot: '#EF4444',       // Red 500
          open: '#3B82F6',      // Blue 500
          new: '#10B981',       // Emerald 500
          qualified: '#8B5CF6', // Violet 500
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
