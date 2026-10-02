import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#10B981',
        'background-light': '#F8FAFC',
        'background-dark': '#0a0a0a',
        'card-light': '#FFFFFF',
        'card-dark': '#171717',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        sans: ['"Outfit"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      backgroundImage: {
        'swirl-pattern':
          "url('data:image/svg+xml,%3Csvg width=\\'100%\\' height=\\'100%\\' viewBox=\\'0 0 800 400\\' xmlns=\\'http://www.w3.org/2000/svg\\' opacity=\\'0.05\\'%3E%3Cpath d=\\'M250,100 Q400,0 550,100 T850,100\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'/%3E%3Cpath d=\\'M-50,200 Q150,100 350,200 T750,200\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'/%3E%3Cpath d=\\'M150,300 Q300,200 450,300 T850,300\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'/%3E%3C/svg%3E')",
      },
    },
  },
};

export default config;
