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
        background: "#06090f",
        surface: "#0c1020",
        "surface-2": "#121a30",
        border: "#1e2d52",
        accent: "#00cfff",
        "accent-hover": "#33daff",
        muted: "#44537a",
        "text-primary": "#e4eeff",
        "text-secondary": "#7a8cba",
        "agent-research": "#4dabff",
        "agent-prd": "#00e676",
        "agent-td": "#ff8c42",
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 207, 255, 0.15)',
        'glow-sm': '0 0 0 2px rgba(0, 207, 255, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
