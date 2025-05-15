import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Needed for proper WebSocket connection
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173, // Force WebSocket to use same port
    },
  },
});
