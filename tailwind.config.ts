import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#F8FAFC',
        ink: { DEFAULT: '#0F172A', muted: '#64748B', faint: '#94A3B8' },
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#EFF6FF' },
        success: { DEFAULT: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
        danger:  { DEFAULT: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
        warn:    { DEFAULT: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
        bdr: '#E2E8F0',
        brand: { input: '#FFF2CC', orange: '#F4B183' },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06),0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        modal: '0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
