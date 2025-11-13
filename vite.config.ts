import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    'global': 'globalThis',
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - core libraries
          if (id.includes('node_modules')) {
            // React ecosystem (most frequently used)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI library (Radix UI components)
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Supabase & TanStack Query (data layer)
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'vendor-data';
            }
            // PDF generation (heavy, rarely used)
            if (id.includes('@react-pdf') || id.includes('jspdf')) {
              return 'vendor-pdf';
            }
            // Other vendor code
            return 'vendor-other';
          }
          
          // Admin bundle (defer until admin pages accessed)
          if (id.includes('/src/pages/Admin') || id.includes('/src/components/admin/')) {
            return 'admin';
          }
          
          // Financing bundle (defer until financing accessed)
          if (id.includes('/src/pages/Financing') || id.includes('/src/components/financing/')) {
            return 'financing';
          }
          
          // Heavy features
          if (id.includes('framer-motion') || id.includes('@huggingface')) {
            return 'heavy-features';
          }
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      format: {
        comments: false,
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    exclude: [
      '@react-pdf/renderer',
      '@huggingface/transformers',
      'framer-motion',
    ],
  },
}));
