import * as MediaEngineModule from '../../../node_modules/media-engine/src/index.js';

const matchMedia = (MediaEngineModule as { default?: unknown }).default || MediaEngineModule;

export default matchMedia;
