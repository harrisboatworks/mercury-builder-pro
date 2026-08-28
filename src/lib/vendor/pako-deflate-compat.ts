import * as DeflateModule from '../../../node_modules/pako/lib/zlib/deflate.js';

const deflate = (DeflateModule as { default?: unknown }).default || DeflateModule;

export default deflate;
