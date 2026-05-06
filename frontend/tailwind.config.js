/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 20px 45px rgba(14, 165, 233, 0.18)"
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(circle at top left, rgba(16, 185, 129, 0.24), transparent 34%), radial-gradient(circle at top right, rgba(59, 130, 246, 0.24), transparent 36%), radial-gradient(circle at bottom center, rgba(249, 115, 22, 0.18), transparent 40%)"
      }
    }
  },
  plugins: []
};
