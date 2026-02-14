/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        muj: {
          orange: '#E4542E',
          'orange-hover': '#d04825',
          charcoal: '#231F20',
          beige: '#F6F4F1',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        lato: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
