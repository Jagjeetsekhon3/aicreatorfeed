import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:        '#222222',
          surface:   '#2a2a2a',
          card:      '#2f2f2f',
          orange:    '#FF6D1F',
          'orange-hover': '#FF8540',
          cream:     '#FAF3E1',
          beige:     '#F5E7C6',
          muted:     '#9a8f7a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
