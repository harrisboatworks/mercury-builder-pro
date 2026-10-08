import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

const repoRoot = path.resolve(__dirname, '../..');
const fakeClient = path.resolve(__dirname, 'fake-supabase.ts');

function forceFakeSupabase(): Plugin {
  return {
    name: 'force-fake-supabase',
    enforce: 'pre',
    resolveId(source) {
      const normalized = source.replaceAll('\\', '/');
      if (normalized.includes('integrations/supabase/client')) return fakeClient;
      return null;
    },
  };
}

export default defineConfig({
  root: __dirname,
  server: {
    host: '127.0.0.1',
    port: 4177,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  define: {
    __BUILD_DATE__: JSON.stringify('2026-10-08'),
    __APP_BUILD_ID__: JSON.stringify('admin-quote-detail-offline-harness'),
  },
  resolve: {
    alias: [
      { find: '@/integrations/supabase/client', replacement: fakeClient },
      { find: '@', replacement: path.resolve(repoRoot, 'src') },
      { find: 'pako/lib/zlib/zstream.js', replacement: path.resolve(repoRoot, 'src/lib/vendor/pako-zstream-compat.ts') },
      { find: 'pako/lib/zlib/deflate.js', replacement: path.resolve(repoRoot, 'src/lib/vendor/pako-deflate-compat.ts') },
      { find: 'pako/lib/zlib/inflate.js', replacement: path.resolve(repoRoot, 'src/lib/vendor/pako-inflate-compat.ts') },
      { find: 'pako/lib/zlib/constants.js', replacement: path.resolve(repoRoot, 'src/lib/vendor/pako-constants-compat.ts') },
      { find: 'base64-js', replacement: path.resolve(repoRoot, 'src/lib/vendor/base64-js-compat.ts') },
      { find: 'js-md5', replacement: path.resolve(repoRoot, 'src/lib/vendor/js-md5-compat.ts') },
      { find: 'hsl-to-hex', replacement: path.resolve(repoRoot, 'src/lib/vendor/hsl-to-hex-compat.ts') },
    ],
  },
  plugins: [forceFakeSupabase(), react()],
});
