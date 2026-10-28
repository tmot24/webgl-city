import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Шейдеры как строки: тот же контракт, что loader "text" в angular.json
function shaderText(): Plugin {
  return {
    name: 'shader-text',
    transform(code, id) {
      if (!/\.(vert|frag|glsl)$/.test(id)) return null;
      return { code: `export default ${JSON.stringify(code)};`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), shaderText()],
  server: {
    open: true,
  },
});
