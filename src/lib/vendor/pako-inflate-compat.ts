import {
  zlibInflate,
  zlibInflateEnd,
  zlibInflateInit2,
  zlibInflateReset,
  zlibInflateSetDictionary,
} from 'pako';

const inflate = {
  inflate: zlibInflate,
  inflateEnd: zlibInflateEnd,
  inflateInit2: zlibInflateInit2,
  inflateReset: zlibInflateReset,
  inflateSetDictionary: zlibInflateSetDictionary,
};

export default inflate;
