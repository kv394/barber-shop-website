import type { Config } from "tailwindcss";

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
        brand: {
          dark: '#020617',     // slate-950
          light: '#f8fafc',    // slate-50
          gold: '#eab308',     // yellow-500 (Vibrant, modern gold)
          gray: '#64748b'      // slate-500
        }
      }
    },
  },
  plugins: [],
};
export default config;
