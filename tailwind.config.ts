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
        rice: "#f5e9cc",
        clay: "#b55233",
        pine: "#1f5c4d",
        navy: "#27386e",
        gold: "#d4a017",
        vermillion: "#c0311a"
      }
    }
  },
  plugins: []
};

export default config;
