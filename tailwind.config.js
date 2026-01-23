/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./modules/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    // extend: {
    //   // screens: {
    //   //   'sm': '800px',  // tablets
    //   //   'lg': '1024px', // large tablets
    //   // },
    //   fontSize: {
    //     xs: ["10px"],
    //     sm: ["12px"],
    //     base: ["14px"],
    //     md: ["16px"],
    //     lg: ["17px"],
    //     xl: ["20px"],
    //     "2xl": ["24px"],
    //     "3xl": ["30px"],
    //     "4xl": ["36px"],
    //   },
    // },
  },
  plugins: [],
};
