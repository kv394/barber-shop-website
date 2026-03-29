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
        sans: ['var(--font-inter)'],
        serif: ['var(--font-playfair-display)'],
      },
      colors: {
        brand: {
          dark: '#111111',
          light: '#fafafa',
          gold: '#c5a059',
          gray: '#555555'
        }
      }
    },
  },
  plugins: [],
};
export default config;
