import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        gold: "#d9b061",
        ink: "#1f1a14",
        stone: "#f7f3eb"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 26, 20, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
