/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 背景色
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#FAFAFA',
        'bg-tertiary': '#F5F5F7',

        // 文字色
        'text-primary': '#1D1D1F',
        'text-secondary': '#86868B',
        'text-tertiary': '#6E6E73',

        // 边框色
        'border-default': '#D2D2D7',
        'border-light': '#E8E8ED',

        // 点缀色（关键操作）
        'accent-blue': '#007AFF',
        'accent-blue-hover': '#0066CC',
        'accent-green': '#34C759',
        'accent-orange': '#FF9500',
        'accent-red': '#FF3B30',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'section-title': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'card-title': ['18px', { lineHeight: '28px', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'body-small': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
        '3xl': '96px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 4px 24px rgba(0, 0, 0, 0.12)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      height: {
        'nav': '64px',
        'input': '48px',
        'button': '48px',
        'button-sm': '36px',
      },
      maxWidth: {
        'content': '1280px',
      },
    },
  },
  plugins: [],
}
