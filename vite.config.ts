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
        const { generateRssXML } = await import('./src/utils/generateSitemap');
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
  optimizeDeps: {
    exclude: ['@react-pdf/renderer', '@react-pdf/pdfkit', 'pako'],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && sitemapPlugin(),
    // VitePWA disabled — see note at top of file.
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'pako/lib/zlib/zstream.js': path.resolve(__dirname, './node_modules/pako/lib/zlib/zstream.js'),
      'pako/lib/zlib/deflate.js': path.resolve(__dirname, './node_modules/pako/lib/zlib/deflate.js'),
      'pako/lib/zlib/inflate.js': path.resolve(__dirname, './node_modules/pako/lib/zlib/inflate.js'),
      'pako/lib/zlib/constants.js': path.resolve(__dirname, './node_modules/pako/lib/zlib/constants.js'),
    },
  },
}));
