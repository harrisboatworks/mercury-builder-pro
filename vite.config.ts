import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { writeFileSync } from "fs";

// Sitemap and RSS generation plugin
function sitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap-and-rss',
    async buildStart() {
      try {
        const { generateSitemapXML, generateRssXML } = await import('./src/utils/generateSitemap');
        
        // Generate sitemap with images
        const sitemap = generateSitemapXML();
        writeFileSync('public/sitemap.xml', sitemap);
        const urlCount = (sitemap.match(/<url>/g) || []).length;
        console.log(`✓ Sitemap generated with ${urlCount} URLs (including images)`);
        
        // Generate RSS feed
        const rss = generateRssXML();
        writeFileSync('public/rss.xml', rss);
        const itemCount = (rss.match(/<item>/g) || []).length;
        console.log(`✓ RSS feed generated with ${itemCount} articles`);
      } catch (error) {
        console.warn('Sitemap/RSS generation skipped:', error);
      }
    }
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && sitemapPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'assets/**/*'],
      manifest: {
        name: 'Mercury Quote Tool - Harris Boat Works',
        short_name: 'Mercury Quote',
        description: 'Build your Mercury outboard quote online. Family-owned dealer since 1965.',
        theme_color: '#c8102e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/quote/motor-selection',
        orientation: 'portrait-primary',
        categories: ['business', 'shopping'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|webp|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\/lovable-uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\/rest\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 10
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/rest/]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
