import * as BrotliDecompressModule from '../../../node_modules/brotli/decompress.js';

const brotliDecompress = (BrotliDecompressModule as { default?: unknown }).default || BrotliDecompressModule;

export default brotliDecompress;
