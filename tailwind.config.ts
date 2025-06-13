import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Modern Color Palette - Primary Brand Colors
        "dark-purple": {
          DEFAULT: "#161032",
          50: "#c4bcea",
          100: "#8978d4",
          200: "#523bb9",
          300: "#342576",
          400: "#120d28",
          500: "#161032",
          600: "#0d0a1e",
          700: "#090614",
          800: "#04030a",
          900: "#020103",
        },
        "harvest-gold": {
          DEFAULT: "#eca400",
          50: "#ffeec8",
          100: "#ffde91",
          200: "#ffcd5a",
          300: "#ffbd23",
          400: "#bc8300",
          500: "#eca400",
          600: "#8d6300",
          700: "#5e4200",
          800: "#2f2100",
          900: "#1a1200",
        },
        "deep-sky-blue": {
          DEFAULT: "#5cc8ff",
          50: "#def4ff",
          100: "#bee9ff",
          200: "#9ddeff",
          300: "#7cd3ff",
          400: "#16b1ff",
          500: "#5cc8ff",
          600: "#008bd0",
          700: "#005c8b",
          800: "#002e45",
          900: "#001722",
        },
        "sea-green": {
          DEFAULT: "#0a8754",
          50: "#bbfae1",
          100: "#76f5c2",
          200: "#32f0a4",
          300: "#0fc97f",
          400: "#086a43",
          500: "#0a8754",
          600: "#065032",
          700: "#043521",
          800: "#021b11",
          900: "#010d08",
        },
        "bice-blue": {
          DEFAULT: "#006ba6",
          50: "#bbe7ff",
          100: "#76cfff",
          200: "#32b7ff",
          300: "#009aed",
          400: "#005887",
          500: "#006ba6",
          600: "#004265",
          700: "#002c43",
          800: "#001622",
          900: "#000b11",
        },

        // Semantic Color Mapping for Better UX
        brand: {
          DEFAULT: "#161032", // Dark purple - main brand
          foreground: "#FFFFFF", // White text on main brand
          primary: "#161032", // Dark purple - main brand
          secondary: "#5cc8ff", // Deep sky blue - secondary actions
          accent: "#eca400", // Harvest gold - highlights/CTAs
          success: "#0a8754", // Sea green - success states
          info: "#006ba6", // Bice blue - informational
        },

        // Legacy colors for backward compatibility
        teal: "#0a8754", // Map to sea-green
        orange: "#eca400", // Map to harvest-gold
        coral: "#5cc8ff", // Map to deep-sky-blue
        red: "#CB0404", // Keep existing for errors

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["Inter", ...fontFamily.sans],
        sans: ["Nunito", ...fontFamily.sans],
      },
      boxShadow: {
        soft: "0 2px 15px 0 rgba(22, 16, 50, 0.05)",
        medium: "0 4px 25px 0 rgba(22, 16, 50, 0.1)",
        large: "0 8px 40px 0 rgba(22, 16, 50, 0.12)",
        "inner-soft": "inset 0 2px 4px 0 rgba(22, 16, 50, 0.05)",
        "glow-gold": "0 0 20px rgba(236, 164, 0, 0.3)",
        "glow-blue": "0 0 20px rgba(92, 200, 255, 0.3)",
        card: "0 1px 3px rgba(0,0,0,.08)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in-out": {
          "0%": { opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-out": "fade-in-out 5s ease-in-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
}