/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // SurplusLink brand tokens — mirrors web app design system
        primary: {
          DEFAULT: '#1e1e1e',    // deep charcoal (light mode primary)
          foreground: '#f7f6f5', // warm off-white
        },
        background: {
          DEFAULT: '#faf9f8',    // warm paper-white
          dark: '#1a1a18',       // near-black graphite
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#232320',
        },
        muted: {
          DEFAULT: '#eeeceb',
          foreground: '#7a7872',
        },
        brand: {
          border: '#dddbd8',
          destructive: '#c94a2a',
          success: '#38875a',
          warning: '#c89520',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
