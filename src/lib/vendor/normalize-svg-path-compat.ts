import * as NormalizeSvgPathModule from '../../../node_modules/normalize-svg-path/index.js';

const normalizeSvgPath = (NormalizeSvgPathModule as { default?: unknown }).default || NormalizeSvgPathModule;

export default normalizeSvgPath;
