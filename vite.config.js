import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  server: {
    proxy: {
      "/api/chat": {
        target: "https://api.groq.com",
        changeOrigin: true,
        rewrite: () => "/openai/v1/chat/completions",
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],

  define: {
    global: "globalThis",
  },
});
