import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        panel: "0 18px 48px rgba(8, 15, 34, 0.35)",
      },
      colors: {
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        panel: "var(--color-panel)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        text: {
          primary: "var(--color-text-primary)",
          muted: "var(--color-text-muted)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)",
        },
        status: {
          danger: "var(--color-danger)",
          warning: "var(--color-warning)",
          success: "var(--color-success)",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(0, 211, 229, 0.2), transparent 28%), radial-gradient(circle at top right, rgba(0, 105, 254, 0.28), transparent 24%)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "chart-pulse": {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        "chart-pulse": "chart-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
