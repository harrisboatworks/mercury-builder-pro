import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// NOTE: VitePWA intentionally disabled. The service worker was aggressively
// caching the old app shell and serving stale HTML/JS to returning visitors,
// which masked SEO/canonical fixes and caused homepage metadata to bleed
// onto other routes. Re-enable only when there's a real offline use case.
// import { VitePWA } from "vite-plugin-pwa";
import { writeFileSync } from "fs";

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

// Sitemap and RSS generation plugin
function sitemapPlugin(): Plugin {
  return {
    name: 'generate-rss',
    async buildStart() {
      try {
        // NOTE: sitemap.xml is authoritatively written by scripts/static-prerender.mjs
        // after vite build (it includes motor, case-study, and location URLs that
        // require async data fetching). Writing it here would race and ship a
        // stale sitemap missing those URLs. RSS stays here — blog-only, no async.
        const modPath = './src/utils/generateSitemap.ts';
        const { generateRssXML } = await import(/* @vite-ignore */ modPath);
        const rss = generateRssXML();
        writeFileSync('public/rss.xml', rss);
        const itemCount = (rss.match(/<item>/g) || []).length;
        console.log(`✓ RSS feed generated with ${itemCount} articles`);
      } catch (error) {
        console.warn('RSS generation skipped:', error);
      }
    }
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
    mode === 'production' && sitemapPlugin(),
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
