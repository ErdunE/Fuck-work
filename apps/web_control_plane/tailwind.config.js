/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Blue accent
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Semantic only (no unnecessary colors)
        success: { 
          50: '#f0fdf4', 
          600: '#16a34a', 
          700: '#15803d' 
        },
        warning: { 
          50: '#fffbeb', 
          600: '#d97706', 
          700: '#b45309' 
        },
        danger: { 
          50: '#fef2f2', 
          600: '#dc2626', 
          700: '#b91c1c' 
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        // CRITICAL: Custom pixel-perfect values (NOT rem!)
        // Default Tailwind: w-48 = 12rem = 192px
        // Our custom: w-12 = 48px
        '1': '4px',    // 4px
        '2': '8px',    // 8px
        '3': '12px',   // 12px
        '4': '16px',   // 16px
        '5': '20px',   // 20px
        '6': '24px',   // 24px
        '8': '32px',   // 32px
        '10': '40px',  // 40px (button height)
        '12': '48px',  // 48px (score badge)
        '16': '64px',  // 64px (nav height)
        '60': '240px', // 240px (Profile sidebar)
        '70': '280px', // 280px (FilterPanel width)
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'strong': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      }
    },
  },
  plugins: [],
}

