import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_PORT = process.env.PORT ?? "8787";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The browser only talks to Vite; /api is forwarded to the
    // backend, so API keys never reach frontend code and CORS is not needed.
    proxy: {
      "/api": `http://localhost:${API_PORT}`,
      
    },
  },
  build: {
    chunkSizeWarningLimit: 1200, // three.js is large; it is lazy-loaded.
  },
});
