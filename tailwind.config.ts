import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        platinum: '#e7e7e7',
        english_violet: '#3b3549',
        ultra_violet: '#5a4f96',
        dark_purple: '#140f22',
        dogwood_rose: '#cc0066',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // TODO find better font
      },
    },
  },
  plugins: [],
};
export default config;