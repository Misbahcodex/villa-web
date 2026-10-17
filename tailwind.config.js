/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ==========================================
        // Reference Architectural Luxury Palette
        // ==========================================
        base: "#10100F",
        surface: "#171716",
        "surface-elevated": "#20201E",
        subtle: "#34312D",
        "border-subtle": "#34312D",
        "on-dark": "#F2E9DD",
        "muted-dark": "#A7A097",
        accent: {
          DEFAULT: "#C99A69",
          strong: "#B78A5B",
          cool: "#77746E",
        },
        "accent-cool": "#77746E",
        "accent-strong": "#B78A5B",
        success: "#3E7B52",

        // Compatibility aliases mapped to reference palette
        "soft-pearl": "#F2E9DD",
        "warm-umber": "#171716",
        "slate-grey": "#A7A097",
        "warm-taupe": "#C99A69",
        "slate-blue": "#77746E",
        "umber-950": "#10100F",
        "umber-900": "#171716",
        "umber-800": "#34312D",
        "pearl-50": "#F2E9DD",
        "slate-blue-700": "#77746E",
        light: "#171716",
        "light-alt": "#20201E",
        "on-light": "#F2E9DD",
        "muted-light": "#A7A097",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      letterSpacing: {
        eyebrow: "0.25em",
        tighter: "-0.04em",
      },
      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "6px",
        xl: "8px",
        "2xl": "12px",
        DEFAULT: "4px",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
