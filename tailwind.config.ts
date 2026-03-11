import type { Config } from 'tailwindcss';

// In Tailwind v4 the theme lives entirely in globals.css via @theme inline.
// This file only needs to declare content paths.
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};

export default config;
