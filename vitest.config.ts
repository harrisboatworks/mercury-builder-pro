import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // NOTE: jsdom 29 needs undici ^7.25. The repo previously pinned
    // overrides.undici to 6.28.0, so jsdom died at startup with
    // "Cannot find module 'undici/lib/handler/wrap-handler.js'" and the entire
    // suite silently ran zero tests. The override is now ^7.25.0.
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
