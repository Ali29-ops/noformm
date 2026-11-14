import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "#1E201F",
        ivory: "#F5F2E9",
        hardwood: "#78675C",
        sage: "#7A8878",
        burgundy: "#622230",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        arabic: ["var(--font-arabic)", "serif"],
        kufi: ["var(--font-kufi)", "sans-serif"],
      },
      letterSpacing: {
        label: "0.28em",
        wide: "0.18em",
      },
      maxWidth: {
        editorial: "1440px",
      },
      transitionDuration: {
        slow: "1200ms",
        reveal: "1400ms",
      },
    },
  },
  plugins: [],
};

export default config;
