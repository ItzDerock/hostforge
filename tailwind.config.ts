/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "sans"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        shake: {
          "0%": { transform: "translate(1px, 1px) rotate(0deg);" },
          "10%": { transform: "translate(-1px, -2px) rotate(-1deg);" },
          "20%": { transform: "translate(-2px, 0px) rotate(1deg);" },
          "30%": { transform: "translate(2px, 2px) rotate(0deg);" },
          "40%": { transform: "translate(1px, -1px) rotate(1deg);" },
          "50%": { transform: "translate(-1px, 2px) rotate(-1deg);" },
          "60%": { transform: "translate(-2px, 1px) rotate(0deg);" },
          "70%": { transform: "translate(2px, 1px) rotate(-1deg);" },
          "80%": { transform: "translate(-1px, -1px) rotate(1deg);" },
          "90%": { transform: "translate(1px, 2px) rotate(0deg);" },
          "100%": { transform: "translate(1px, -2px) rotate(-1deg);" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shake: "shake 0.75s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
