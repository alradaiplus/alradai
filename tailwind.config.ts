import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Notes Canvas dark theme — near-black surfaces with a violet/indigo accent
        canvas: {
          bg: "#0b0b0f",
          surface: "#121218",
          panel: "#16161d",
          elevated: "#1c1c24",
          border: "#26262f",
          hover: "#1f1f28",
        },
        ink: {
          DEFAULT: "#ededf2",
          muted: "#9b9ba6",
          faint: "#6a6a76",
        },
        accent: {
          DEFAULT: "#7c6cf6",
          hover: "#8f81f8",
          soft: "rgba(124,108,246,0.14)",
          ring: "rgba(124,108,246,0.45)",
        },
        node: {
          note: "#7c6cf6",
          image: "#37b6ff",
          file: "#f5a623",
          embed: "#ff6ca6",
          link: "#34d399",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        panel: "0 8px 30px rgba(0,0,0,0.5)",
        node: "0 4px 16px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(124,108,246,0.4), 0 8px 30px rgba(124,108,246,0.18)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "slide-up": "slide-up 0.24s cubic-bezier(0.32,0.72,0,1)",
      },
    },
  },
  plugins: [],
};

export default config;
