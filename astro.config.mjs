// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    // Asegurarse de que los estilos CSS son procesados correctamente
    css: {
      postcss: {}
    }
  }
});
