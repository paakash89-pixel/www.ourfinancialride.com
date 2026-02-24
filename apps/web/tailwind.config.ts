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
        slateBlue: {
          50: "#f8f8fa",
          100: "#e8e8ed",
          300: "#a1a1aa",
          500: "#6e6e73",
          700: "#1d1d1f"
        },
        calmGreen: {
          100: "#e8f6ec",
          300: "#9dc8aa",
          500: "#4fa468",
          700: "#2f7d48"
        }
      },
      boxShadow: {
        soft: "0 18px 44px rgba(15, 23, 42, 0.08)",
        card: "0 10px 28px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl2: "1.2rem"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 500ms ease both"
      }
    }
  },
  plugins: []
};

export default config;
