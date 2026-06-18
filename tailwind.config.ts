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
        // Monochrome dark system — near-black surfaces, near-white accent.
        // Mirrors the CSS variables in globals.css (single source of truth).
        canvas: {
          bg: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          panel: "var(--bg-secondary)",
          elevated: "var(--bg-elevated)",
          border: "var(--border-subtle)",
          strong: "var(--border-strong)",
          hover: "var(--bg-elevated)",
        },
        ink: {
          DEFAULT: "var(--text-primary)",
          muted: "var(--text-secondary)",
          faint: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          foreground: "var(--accent-foreground)",
          soft: "var(--accent-soft)",
          ring: "var(--accent-ring)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        // Node category hues — restrained, desaturated tints used only for the
        // knowledge graph and node accents so types stay distinguishable while
        // the chrome stays monochrome (Linear / Obsidian convention).
        node: {
          note: "#9aa0a6",
          task: "#c7c7c7",
          project: "#e0e0e0",
          ai: "#b9a7ff",
          pdf: "#e08f8f",
          image: "#8fb6e0",
          voice: "#8fd0c0",
          research: "#d6c393",
          embed: "#c79ad0",
          file: "#d6b48f",
          link: "#a0a0a0",
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
        glow: "0 0 0 1px rgba(245,245,245,0.22), 0 8px 30px rgba(0,0,0,0.55)",
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
