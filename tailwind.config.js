/** @type {import('tailwindcss').Config} */
import animations from '@midudev/tailwind-animations'

module.exports = {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
      extend: {
        colors: {
          roots: {
            sand: '#f5f0eb',
            stone: '#e8e2db',
            bark: '#3d3428',
            earth: '#5c4f3d',
            clay: '#8b7355',
            moss: '#6b7c5e',
            'warm-white': '#faf7f4',
          }
        },
        fontFamily: {
          sans: ['"Figtree Variable"', 'system-ui', 'sans-serif'],
        },
        borderColor: {
          DEFAULT: 'rgba(61, 52, 40, 0.08)',
        },
        boxShadow: {
          'soft': '0 1px 3px rgba(61, 52, 40, 0.06), 0 1px 2px rgba(61, 52, 40, 0.04)',
          'lifted': '0 4px 12px rgba(61, 52, 40, 0.08), 0 1px 3px rgba(61, 52, 40, 0.04)',
          'overlay': '0 8px 24px rgba(61, 52, 40, 0.12), 0 2px 6px rgba(61, 52, 40, 0.06)',
        },
      },
    },
    plugins: [require("daisyui"), animations],
    daisyui: {
      themes: [{
        "roots-b2b": {
          "primary": "#3d3428",
          "primary-content": "#faf7f4",
          "secondary": "#8b7355",
          "secondary-content": "#faf7f4",
          "accent": "#6b7c5e",
          "accent-content": "#faf7f4",
          "neutral": "#5c4f3d",
          "neutral-content": "#f5f0eb",
          "base-100": "#faf7f4",
          "base-200": "#f5f0eb",
          "base-300": "#e8e2db",
          "base-content": "#3d3428",
          "info": "#5c7a99",
          "info-content": "#faf7f4",
          "success": "#6b7c5e",
          "success-content": "#faf7f4",
          "warning": "#c4973b",
          "warning-content": "#3d3428",
          "error": "#a85444",
          "error-content": "#faf7f4",
        }
      }],
    },
  };
