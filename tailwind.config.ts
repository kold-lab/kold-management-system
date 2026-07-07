import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

// Token values mirror docs/brand.md — that file wins on any conflict.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4A90E2",
          deep: "#0F2D4D",
          ice: "#E6F2FA",
          mist: "#F2F4F7",
          slate: "#6B7B84",
        },
        success: { DEFAULT: "#2E8B6E", soft: "#E4F3EE" },
        warning: { DEFAULT: "#B87A1E", soft: "#FBF1DE" },
        danger: { DEFAULT: "#C24040", soft: "#FBEAEA" },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
