/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f1",
          100: "#d6ecdf",
          200: "#aed9bf",
          300: "#7cc09a",
          400: "#4ea277",
          500: "#2f865c",
          600: "#236b49",
          700: "#1d553b",
          800: "#194530",
          900: "#143728",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
