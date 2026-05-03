import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          50: "#EEEFFE",
          100: "#DDDFFE",
          200: "#B8BEFF",
          300: "#8E98FD",
          400: "#6B76F9",
          500: "#4F46E5",
          600: "#4038CF",
          700: "#312CAF",
          800: "#24208D",
          900: "#1A1769",
        },
        secondary: {
          DEFAULT: "#0EA5E9",
          50: "#EFF8FD",
          100: "#D9F0FB",
          500: "#0EA5E9",
          600: "#0284C7",
        },
        accent: {
          DEFAULT: "#F59E0B",
          500: "#F59E0B",
          600: "#D97706",
        },
        success: {
          DEFAULT: "#10B981",
          500: "#10B981",
          600: "#059669",
        },
        danger: {
          DEFAULT: "#EF4444",
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "bounce-in": "bounceIn 0.6s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern":
          "linear-gradient(135deg, #4F46E5 0%, #0EA5E9 50%, #10B981 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
