/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/forms")],
  daisyui: {
    themes: [
      "light",
      "dark",
      {
        awTheme: {
          primary: "#2563eb",
          "primary-content": "#ffffff",
          secondary: "#7c3aed",
          accent: "#14b8a6",
          neutral: "#1e293b",
          "base-100": "#ffffff",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
        },
      },
    ],
    base: true,
    utils: true,
    logs: false,
    rtl: false,
    prefix: "",
  },
};
