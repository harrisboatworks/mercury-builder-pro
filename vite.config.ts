import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// NOTE: VitePWA intentionally disabled. The service worker was aggressively
// caching the old app shell and serving stale HTML/JS to returning visitors,
// which masked SEO/canonical fixes and caused homepage metadata to bleed
// onto other routes. Re-enable only when there's a real offline use case.
// import { VitePWA } from "vite-plugin-pwa";

const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  `local-${Date.now().toString(36)}`;

function buildVersionPlugin(): Plugin {
  return {
    name: 'emit-build-version',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId }),
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Vite 8 raises its default browser floor to Safari/iOS 16.4 and
    // 2023-era Chromium/Firefox. Preserve Vite 5's prior production target so
    // the dependency upgrade does not silently drop older customer devices.
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
  define: {
    // Build-time date stamp (YYYY-MM-DD) for visible "Page last updated" labels.
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
    // Unique deploy identifier used to refresh long-lived mobile browser tabs.
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  optimizeDeps: {
    include: [
      '@react-pdf/renderer',
      '@react-pdf/pdfkit',
      '@react-pdf/font',
      '@react-pdf/render',
      '@react-pdf/stylesheet',
      'postcss-value-parser',
    ],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && buildVersionPlugin(),
    // VitePWA disabled — see note at top of file.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'pako/lib/zlib/zstream.js': path.resolve(__dirname, './src/lib/vendor/pako-zstream-compat.ts'),
      'pako/lib/zlib/deflate.js': path.resolve(__dirname, './src/lib/vendor/pako-deflate-compat.ts'),
      'pako/lib/zlib/inflate.js': path.resolve(__dirname, './src/lib/vendor/pako-inflate-compat.ts'),
      'pako/lib/zlib/constants.js': path.resolve(__dirname, './src/lib/vendor/pako-constants-compat.ts'),
      'base64-js': path.resolve(__dirname, './src/lib/vendor/base64-js-compat.ts'),
      'js-md5': path.resolve(__dirname, './src/lib/vendor/js-md5-compat.ts'),
      'hsl-to-hex': path.resolve(__dirname, './src/lib/vendor/hsl-to-hex-compat.ts'),
    },
  },
}));
