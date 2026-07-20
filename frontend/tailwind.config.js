/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        agri: {
          canopy: "hsl(var(--agri-canopy))",
          leaf: "hsl(var(--agri-leaf))",
          mint: "hsl(var(--agri-mint))",
          field: "hsl(var(--agri-field))",
          soil: "hsl(var(--agri-soil))",
          water: "hsl(var(--agri-water))",
          sun: "hsl(var(--agri-sun))",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-lg": ["2.25rem", { lineHeight: "2.75rem", fontWeight: "700" }],
        "display-md": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "title-lg": ["1.5rem", { lineHeight: "2rem", fontWeight: "650" }],
        "title-md": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "650" }],
        "body-sm": ["0.875rem", { lineHeight: "1.375rem" }],
        "caption": ["0.75rem", { lineHeight: "1rem", fontWeight: "600" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(17, 24, 39, 0.04), 0 10px 30px rgba(17, 24, 39, 0.08)",
        panel: "0 18px 45px rgba(15, 23, 42, 0.10)",
        focus: "0 0 0 3px hsl(var(--ring) / 0.18)",
      },
    },
  },
  plugins: [],
};
