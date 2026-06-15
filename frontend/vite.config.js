import { defineConfig } from 'vite';
 
export default defineConfig({
  server: {
    port: 5173,
    // forwards any request starting with /api to flask
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});