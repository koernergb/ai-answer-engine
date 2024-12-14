import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: null,
            a: {
              color: '#3B82F6',
              '&:hover': {
                color: '#2563EB',
              },
              textDecoration: 'none',
            },
            code: {
              backgroundColor: 'var(--tw-prose-pre-bg)',
              padding: '2px 4px',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            },
            pre: {
              backgroundColor: 'var(--tw-prose-pre-bg)',
              borderRadius: '0.375rem',
              padding: '1rem',
            },
            'p:first-child': {
              marginTop: '0',
            },
            'p:last-child': {
              marginBottom: '0',
            },
          }
        },
        invert: {
          css: {
            '--tw-prose-body': 'var(--tw-prose-invert-body)',
            '--tw-prose-headings': 'var(--tw-prose-invert-headings)',
            '--tw-prose-links': 'var(--tw-prose-invert-links)',
            '--tw-prose-code': 'var(--tw-prose-invert-code)',
            '--tw-prose-pre-bg': 'var(--tw-prose-invert-pre-bg)',
          }
        }
      },
      animation: {
        'bounce-slow': 'bounce 1.5s infinite',
      },
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding',
      }
    },
  },
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;