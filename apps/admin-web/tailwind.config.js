/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input-bg))",
        ring: "hsl(var(--primary))",
        background: "hsl(var(--page-bg))",
        foreground: "hsl(var(--text-main))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--input-bg))",
          foreground: "hsl(var(--text-main))",
        },
        muted: {
          DEFAULT: "hsl(var(--input-bg))",
          foreground: "hsl(var(--text-muted))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--text-main))",
        },
        brand: {
          blue: "#1E4DFF",
          "blue-hover": "#153BCC",
          green: "#0B4A3A",
          emerald: "#10B981",
        },
        gray: {
          page: "#F5F6F7",
          input: "#F1F3F4",
          border: "#E4E7E9",
          muted: "#5B6B65",
          dark: "#0F2A22",
        },
      },
      borderRadius: {
        lg: "var(--card-radius)",
        md: "var(--input-radius)",
        sm: "calc(var(--input-radius) - 4px)",
        "2xl": "16px",
        xl: "12px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
