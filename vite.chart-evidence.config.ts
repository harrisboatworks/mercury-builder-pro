import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Local-only evidence build. Not used by the production Vite config or App routes.
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DATE__: JSON.stringify("2026-09-14"),
    __APP_BUILD_ID__: JSON.stringify("chart-runtime-evidence"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-chart-evidence",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/test/chart-runtime-evidence.html"),
    },
  },
});
