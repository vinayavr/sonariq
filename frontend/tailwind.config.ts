import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/services/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#13211f",
        leaf: "#2f7d63",
        mint: "#dff4ec",
        coral: "#e76f51",
        gold: "#f4a261",
        cloud: "#f7faf8",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(19, 33, 31, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
