import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2C4BFF",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2B3990",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#F5F7FF",
          foreground: "#2C4BFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(90deg, #4461FF 0%, #385AFF 100%)',
        'primary-gradient-hover': 'linear-gradient(90deg, #385AFF 0%, #4461FF 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;