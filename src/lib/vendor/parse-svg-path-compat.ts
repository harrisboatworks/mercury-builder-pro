import * as ParseSvgPathModule from '../../../node_modules/parse-svg-path/index.js';

const parseSvgPath = (ParseSvgPathModule as { default?: unknown }).default || ParseSvgPathModule;

export default parseSvgPath;
