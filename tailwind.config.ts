import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 8px 32px -8px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.05)',
        'soft-lg': '0 16px 48px -12px rgb(0 0 0 / 0.15), 0 0 0 1px rgb(0 0 0 / 0.05)',
        'soft-xl': '0 24px 64px -16px rgb(0 0 0 / 0.18), 0 0 0 1px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
