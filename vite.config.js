import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": "the-software-engineering-project-production.up.railway.app",
    },
    hmr: {
      protocol: "ws",
      host:     "localhost",
      port:     5173,
    },
  },
  build: {
    outDir: 'dist'
  }
});