import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // Bind to all interfaces so any machine on the network can reach the dev server
    host: "0.0.0.0",
    port: 5173,

    proxy: {
      // REST API calls:  /api  →  http://172.16.6.254:4000/api
      "/api": {
        target: "http://172.16.6.254:4000",
        changeOrigin: true,
      },

      // Socket.IO long-poll handshake + WebSocket upgrade:
      //   /socket.io  →  http://172.16.6.254:4000/socket.io
      "/socket.io": {
        target: "http://172.16.6.254:4000",
        changeOrigin: true,
        ws: true, // <-- critical: enables WebSocket proxying
      },
    },
  },
});
