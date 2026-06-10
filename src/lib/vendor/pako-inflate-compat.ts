import * as InflateModule from '../../../node_modules/pako/lib/zlib/inflate.js';

const inflate = (InflateModule as { default?: unknown }).default || InflateModule;

export default inflate;
