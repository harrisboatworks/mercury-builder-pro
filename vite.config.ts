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
  build: {
    rollupOptions: {
      output: {
        // Manual chunking to keep first-paint payload lean. Heavy vendors
        // (radix, pdf, markdown) are split off so the initial bundle only
        // contains React + router + the landing route.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Keep React + everything that touches React internals at module top
          // (radix forwardRef, react-router, lucide icons, react-is, use-sync-external-store)
          // in a single vendor chunk to guarantee React is initialized before any
          // consumer evaluates. Splitting these caused a production white-screen:
          // "Cannot read properties of undefined (reading 'forwardRef')" when the
          // ui-radix chunk loaded before react-vendor.
          if (id.match(/node_modules\/(react|react-dom|react-is|scheduler|use-sync-external-store)\//)) return 'react-vendor';
          if (id.includes('react-router')) return 'react-vendor';
          if (id.includes('@radix-ui')) return 'react-vendor';
          if (id.includes('lucide-react')) return 'react-vendor';
          if (id.includes('@react-pdf') || id.includes('pdfkit') || id.includes('fontkit')) return 'pdf-vendor';
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('micromark') || id.includes('mdast') || id.includes('hast')) return 'blog-vendor';
          if (id.includes('framer-motion')) return 'motion-vendor';
          if (id.includes('@supabase')) return 'supabase-vendor';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';
          return 'vendor';
        },
      },
    },
  },
}));
