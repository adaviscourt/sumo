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
        ink: "#1b1a17",
        rice: "#f8f1de",
        clay: "#b55233",
        pine: "#1f5c4d",
        navy: "#a11e15",
        gold: "#d4a017"
      }
    }
  },
  plugins: []
};

export default config;
