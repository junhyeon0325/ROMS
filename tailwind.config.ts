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
        background: "var(--background)",
        foreground: "var(--foreground)",
        ow: {
          dark: "#0b0e14",
          card: "#121824",
          accent: "#f99e1a", // Overwatch Gold / Orange accent
          gold: "#e6a100",
          blue: "#00aaff",
          purple: "#9d4edd",
          gray: "#1c2434",
        },
      },
    },
  },
  plugins: [],
};
export default config;
