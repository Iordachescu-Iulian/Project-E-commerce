import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base: '#14121F',
        surface: '#1E1B2E',
        ink: '#F4F2EC',
        muted: '#B8B4CC',
        accent: '#5FE0A4',
        secondary: '#5B45E0',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
