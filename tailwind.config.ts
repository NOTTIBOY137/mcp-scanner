import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#f5f5f5",
        card: { DEFAULT: "#111111", hover: "#1a1a1a" },
        border: "rgba(255,255,255,0.1)",
        muted: { DEFAULT: "#a1a1a1", foreground: "#6b7280" },
        brand: {
          50: "#EEF2FF", 100: "#E0E7FF", 200: "#C7D2FE", 300: "#A5B4FC",
          400: "#818CF8", 500: "#6366F1", 600: "#4F46E5", 700: "#4338CA",
          800: "#3730A3", 900: "#312E81", 950: "#1E1B4B",
        },
        accent: {
          50: "#ECFEFF", 100: "#CFFAFE", 200: "#A5F3FC", 300: "#67E8F9",
          400: "#22D3EE", 500: "#06B6D4", 600: "#0891B2", 700: "#0E7490",
        },
        secure: { DEFAULT: "#10B981", dark: "#059669" },
        critical: { DEFAULT: "#F43F5E", dark: "#E11D48" },
        warning: { DEFAULT: "#F59E0B", dark: "#D97706" },
        surface: { DEFAULT: "#0F172A", raised: "#1E293B", overlay: "#334155" },
        grade: {
          A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6366F1, #0EA5E9)",
        "scan-gradient": "linear-gradient(135deg, #22D3EE, #6366F1)",
      },
    },
  },
  plugins: [],
};

export default config;
