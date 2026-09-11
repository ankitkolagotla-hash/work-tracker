import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cf-bg': 'rgb(var(--cf-bg) / <alpha-value>)',
        'cf-card': 'rgb(var(--cf-card) / <alpha-value>)',
        'cf-border': 'rgb(var(--cf-border) / <alpha-value>)',
        'cf-text': 'rgb(var(--cf-text) / <alpha-value>)',
        'cf-text-muted': 'rgb(var(--cf-text-muted) / <alpha-value>)',
        'cf-accent': 'rgb(var(--cf-accent) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
