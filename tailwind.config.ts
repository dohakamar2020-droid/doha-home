import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#F3F7F4",
          100: "#E6EFE9",
          200: "#CDDFD4",
          300: "#ABC7B7",
          400: "#8CB29A",
          500: "#719B83",
          600: "#5B8069",
          700: "#486553",
          800: "#384F42",
          900: "#28332D",
        },
        cream: "#FAF7F2",
        pink: {
          50: "#FDF8F9",
          100: "#F5E5E8",
          200: "#EBD2D8",
          300: "#DDB6C0",
        },
        ink: "#28332D",
        "ink-soft": "#55635B",
      },
      fontFamily: {
        sans: ["Cairo", "Segoe UI", "Tahoma", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(40, 51, 45, 0.04), 0 8px 24px rgba(40, 51, 45, 0.06)",
        float: "0 12px 32px rgba(40, 51, 45, 0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        "slide-up": "slide-up 260ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
