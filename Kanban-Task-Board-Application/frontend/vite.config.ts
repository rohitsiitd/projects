import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This sends all '/api' requests to your Express server
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        // Optional: removes '/api' from the path before sending to backend
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
});
