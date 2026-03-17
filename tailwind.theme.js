/** @type {import('tailwindcss').Config['theme']} */
const theme = {
  container: {
    center: true,
    padding: '2rem',
    screens: { '2xl': '1400px' },
  },
  extend: {
    colors: {
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
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      /* Functional colors */
      danger: {
        DEFAULT: '#ff2768',
        foreground: '#ffffff',
      },
      warning: {
        DEFAULT: '#fbdc17',
        foreground: '#232a33',
      },
      info: {
        DEFAULT: '#4c78d4',
        foreground: '#ffffff',
      },
      success: {
        DEFAULT: '#00e7a9',
        foreground: '#232a33',
      },
    },
    borderRadius: {
      outer: '2.5rem',    /* 40px — major containers, modals */
      inner: '1.875rem',  /* 30px — cards, panels */
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    boxShadow: {
      card: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
      'card-hover': 'rgba(0, 0, 0, 0.15) 0px 8px 20px',
      'soft': 'rgba(0, 0, 0, 0.05) 0px 2px 8px',
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
      'fade-in': {
        from: { opacity: '0', transform: 'translateY(4px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
    },
    animation: {
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
      'fade-in': 'fade-in 0.15s ease-out',
    },
  },
};

module.exports = theme;
