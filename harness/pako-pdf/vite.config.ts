import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

const harnessDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(harnessDir, '../..');

// Same four aliases as the app vite.config.ts. pdfkit's browser build
// default-imports these paths; this harness does not replace that consumer.
export default defineConfig({
  root: harnessDir,
  server: {
    host: '127.0.0.1',
    port: 4181,
    fs: { allow: [repoRoot] },
  },
  resolve: {
    alias: {
      'pako/lib/zlib/zstream.js': path.resolve(repoRoot, 'src/lib/vendor/pako-zstream-compat.ts'),
      'pako/lib/zlib/deflate.js': path.resolve(repoRoot, 'src/lib/vendor/pako-deflate-compat.ts'),
      'pako/lib/zlib/inflate.js': path.resolve(repoRoot, 'src/lib/vendor/pako-inflate-compat.ts'),
      'pako/lib/zlib/constants.js': path.resolve(repoRoot, 'src/lib/vendor/pako-constants-compat.ts'),
      'base64-js': path.resolve(repoRoot, 'src/lib/vendor/base64-js-compat.ts'),
      'js-md5': path.resolve(repoRoot, 'src/lib/vendor/js-md5-compat.ts'),
      'hsl-to-hex': path.resolve(repoRoot, 'src/lib/vendor/hsl-to-hex-compat.ts'),
    },
  },
  plugins: [react()],
});
