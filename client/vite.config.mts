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
    open: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Our own stylesheets use @use, but @picocss/pico (a third-party
        // dependency we don't maintain) still uses the legacy @import
        // syntax internally, which Dart Sass flags as deprecated.
        // quietDeps silences deprecation warnings coming from dependencies
        // (anything loaded via node_modules) while still surfacing any
        // warnings from our own code in src/styles.
        quietDeps: true,
      },
    },
  },
});
