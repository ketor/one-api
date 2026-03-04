/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", 'monospace'],
        code: ["'Courier Prime'", "'JetBrains Mono'", 'monospace'],
      },
      colors: {
        /* XYZ Cloud palette */
        'xyz-blue': {
          1: '#f0f5ff',
          2: '#e6edff',
          3: '#bdceff',
          4: '#94adff',
          5: '#6b89ff',
          6: '#4362ff',
          7: '#2e44d9',
          8: '#1d2cb3',
          9: '#0f188c',
          10: '#0a0d66',
        },
        'xyz-gray': {
          1: '#f8fafc',
          2: '#f1f5f9',
          3: '#e1e7ef',
          4: '#c8d5e5',
          5: '#9eacbf',
          6: '#65758b',
          7: '#48566a',
          8: '#344256',
          9: '#0f1728',
          10: '#090e1a',
          11: '#060a10',
        },
        'xyz-white': {
          1: 'rgba(255, 255, 255, 0.08)',
          2: 'rgba(255, 255, 255, 0.10)',
          3: 'rgba(255, 255, 255, 0.20)',
          4: 'rgba(255, 255, 255, 0.30)',
          5: 'rgba(255, 255, 255, 0.40)',
          6: 'rgba(255, 255, 255, 0.50)',
          7: 'rgba(255, 255, 255, 0.60)',
          8: 'rgba(255, 255, 255, 0.80)',
          9: 'rgba(255, 255, 255, 0.90)',
          10: '#ffffff',
        },
        'xyz-orange': {
          6: '#ff8400',
        },

        /* Shadcn semantic (mapped to CSS vars) */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      maxWidth: {
        'xyz': '1460px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
