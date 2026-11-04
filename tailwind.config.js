/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pch: {
          red: {
            DEFAULT: "#D71920",
            hover: "#B5141A",
            light: "#FDF2F2",
            border: "#F8B4B4",
          },
          black: {
            DEFAULT: "#151515",
            hover: "#222222",
            subtle: "#1E1E1E",
          },
          gray: {
            DEFAULT: "#F3F4F6",
            border: "#E5E7EB",
            muted: "#6B7280",
          }
        }
      }
    },
  },
  plugins: [],
}
