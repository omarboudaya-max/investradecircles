/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#1e293b',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1e293b'
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1e293b'
        },
        primary: {
          DEFAULT: '#06b6d4',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#f1f5f9',
          foreground: '#334155'
        },
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b'
        },
        accent: {
          DEFAULT: '#38bdf8',
          foreground: '#ffffff'
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#f8fafc'
        },
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#0891b2',
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px'
      }
    },
  },
  plugins: [],
}
