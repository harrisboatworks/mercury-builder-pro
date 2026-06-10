import * as ZStreamModule from '../../../node_modules/pako/lib/zlib/zstream.js';

const ZStream = (ZStreamModule as { default?: unknown }).default || ZStreamModule;

export default ZStream;
