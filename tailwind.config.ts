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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          bg: "#0A0F1E",
          primary: "#3B82F6",
          accent: "#F59E0B",
          text: "#F8FAFC",
          panel: "#121a31",
          muted: "#93a4c7",
          border: "#263458",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-playfair)", "serif"],
      },
      borderRadius: {
        xl: "12px",
        lg: "8px",
        "3xl": "24px",
      },
      boxShadow: {
        layered:
          "0 2px 8px rgba(2, 6, 23, 0.18), 0 14px 40px rgba(2, 6, 23, 0.45)",
        glass:
          "0 1px 0 rgba(248,250,252,0.08) inset, 0 20px 50px rgba(2, 6, 23, 0.38)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        mesh: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(0, -14px, 0) scale(1.03)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        mesh: "mesh 10s ease-in-out infinite",
        marquee: "marquee 24s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
