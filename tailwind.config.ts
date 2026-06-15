import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#f0f7f8",
          100: "#d9eaed",
          200: "#a8cfd5",
          500: "#1e7a8c",
          600: "#155a6b",
          700: "#0f5b6e",
          800: "#0c4a5a",
          900: "#093a47",
        },
        cream: {
          50: "#fbfaf6",
          100: "#f7f4ea",
        },
        accent: {
          500: "#d97706",
          600: "#b45309",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
