/** @type {import('tailwindcss').Config} */
const withOpacity = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: withOpacity('--color-background'),
        foreground: withOpacity('--color-foreground'),
        card: {
          DEFAULT: withOpacity('--color-card'),
          foreground: withOpacity('--color-card-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('--color-popover'),
          foreground: withOpacity('--color-popover-foreground'),
        },
        primary: {
          DEFAULT: withOpacity('--color-primary'),
          foreground: withOpacity('--color-primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('--color-secondary'),
          foreground: withOpacity('--color-secondary-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('--color-muted'),
          foreground: withOpacity('--color-muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('--color-accent'),
          foreground: withOpacity('--color-accent-foreground'),
        },
        destructive: withOpacity('--color-destructive'),
        border: withOpacity('--color-border'),
        input: withOpacity('--color-input'),
        ring: withOpacity('--color-ring'),
      },
      borderRadius: {
        // PWA --radius: 0.85rem (≈13.6px) and its derived steps
        sm: '8px',
        DEFAULT: '11px',
        md: '11px',
        lg: '14px',
        xl: '19px',
        '2xl': '24px',
        '3xl': '30px',
      },
    },
  },
  plugins: [],
};
