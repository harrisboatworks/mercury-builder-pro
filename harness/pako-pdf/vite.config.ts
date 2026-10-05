import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Connect } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, type Plugin } from 'vite';

const harnessDir = path.dirname(fileURLToPath(import.meta.url));
const savedPdfPath = path.resolve(harnessDir, 'out/synthetic-pako-634.pdf');

function readBody(req: Connect.IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function saveSyntheticPdfPlugin(): Plugin {
  return {
    name: 'save-synthetic-pdf',
    configureServer(server) {
      server.middlewares.use('/synthetic-pako-634.pdf', (req, res, next) => {
        if (req.method === 'PUT') {
          void readBody(req).then((body) => {
            fs.mkdirSync(path.dirname(savedPdfPath), { recursive: true });
            fs.writeFileSync(savedPdfPath, body);
            res.statusCode = 204;
            res.end();
          }).catch((error: unknown) => {
            res.statusCode = 500;
            res.end(error instanceof Error ? error.message : 'save failed');
          });
          return;
        }
        if (req.method === 'GET' && fs.existsSync(savedPdfPath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.end(fs.readFileSync(savedPdfPath));
          return;
        }
        next();
      });
    },
  };
}

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
  plugins: [react(), saveSyntheticPdfPlugin()],
});
