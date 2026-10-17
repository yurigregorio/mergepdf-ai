import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@lipoe/browser-qpdf'],
  },
});
