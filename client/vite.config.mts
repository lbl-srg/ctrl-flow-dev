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
    // The backend (server/) runs on port 3000 (see server/src/config.ts
    // PORT default and FE_ORIGIN_URL default of http://localhost:3001),
    // so the client dev server uses 3001 to avoid colliding with it.
    // strictPort ensures a real conflict fails loudly instead of Vite
    // silently binding to a different interface/port.
    port: 3001,
    strictPort: true,
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
