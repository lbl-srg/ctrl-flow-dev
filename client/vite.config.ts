import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  publicDir: "public",
  build: {
    outDir: "build",
  },
  server: {
    port: 3000,
  },
});
