import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A6BFF",
        secondary: "#EEF3FF",
        success: "#34C759",
        warning: "#FF9500",
        dark: "#0D0D0D",
        muted: "#8A8A8E",
      },
    },
  },
  plugins: [],
};

export default config;
