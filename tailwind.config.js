/** @type {import('tailwindcss').Config} */
import animations from '@midudev/tailwind-animations'

module.exports = {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    plugins: [require("daisyui"), animations],
    daisyui: {
      themes: [{"cupcake" : {
        "primary": "#121212",
        "base-100": "#f6f6f6",
      }}],
    },
  };