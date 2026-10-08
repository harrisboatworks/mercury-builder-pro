import {
  Z_BLOCK,
  Z_BUF_ERROR,
  Z_DATA_ERROR,
  Z_ERRNO,
  Z_FINISH,
  Z_FULL_FLUSH,
  Z_MEM_ERROR,
  Z_NEED_DICT,
  Z_NO_FLUSH,
  Z_OK,
  Z_PARTIAL_FLUSH,
  Z_STREAM_END,
  Z_STREAM_ERROR,
  Z_SYNC_FLUSH,
  Z_TREES,
} from 'pako';

// pako 3 exports the flush and status constants as named bindings and no
// longer publishes lib/zlib/constants.js. browserify-zlib and pdfkit still
// copy this object and pass Z_DEFLATED (8) into deflateInit2. The numeric
// values below are the zlib constants pako 1.0.11 exported.
const constants = {
  Z_NO_FLUSH,
  Z_PARTIAL_FLUSH,
  Z_SYNC_FLUSH,
  Z_FULL_FLUSH,
  Z_FINISH,
  Z_BLOCK,
  Z_TREES,
  Z_OK,
  Z_STREAM_END,
  Z_NEED_DICT,
  Z_ERRNO,
  Z_STREAM_ERROR,
  Z_DATA_ERROR,
  Z_MEM_ERROR,
  Z_BUF_ERROR,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  Z_BINARY: 0,
  Z_TEXT: 1,
  Z_UNKNOWN: 2,
  Z_DEFLATED: 8,
};

export default constants;
