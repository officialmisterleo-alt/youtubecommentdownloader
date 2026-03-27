import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0a0a0a',
          surface: '#171717',
          border: 'rgba(255,255,255,0.07)',
          muted: '#888888',
          subtle: '#555555',
          accent: '#dc2626',
          'accent-hover': '#ef4444',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'], jakarta: ['var(--font-jakarta)', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
