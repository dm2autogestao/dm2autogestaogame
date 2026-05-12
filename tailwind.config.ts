import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        meadow: "#58CC02",
        leaf: "#46A302",
        limepop: "#D7FF47",
        skyjoy: "#1CB0F6",
        coral: "#FF6B6B",
        amberpop: "#FFC800",
        ink: "#172033",
        mist: "#F3F7FB"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 51, 0.12)",
        press: "0 6px 0 rgba(23, 32, 51, 0.16)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
