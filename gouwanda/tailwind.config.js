import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.ts',
    './resources/**/*.tsx',
    './resources/**/*.jsx',
  ],
  theme: {
    extend: {
      colors: {
        // Exemple de couleur personnalisée
        primary: '#1D4ED8',
      },
    },
  },
  plugins: [],
});
