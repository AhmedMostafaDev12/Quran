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
        background: "#0A0F1E",
        primary: "#0A0F1E",
        secondary: "#0D1B2A",
        gold: {
          DEFAULT: "#C9A84C",
          light: "#F0D070"
        },
        muted: "#8A9BB0",
        "green-accent": "#2D6A4F",
      },
      textColor: {
        primary: "#E8D5B0",
      },
    },
  },
  plugins: [],
};
export default config;
