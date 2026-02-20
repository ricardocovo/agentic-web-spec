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
        background: "#111113",
        surface: "#1a1a1f",
        "surface-2": "#222228",
        border: "#2a2a32",
        accent: "#e8445a",
        "accent-hover": "#f05570",
        muted: "#6b6b7a",
        "text-primary": "#f0f0f5",
        "text-secondary": "#9090a0",
        "agent-research": "#3b82f6",
        "agent-prd": "#22c55e",
        "agent-td": "#f97316",
      },
    },
  },
  plugins: [],
};

export default config;
