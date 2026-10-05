import {
  zlibDeflate,
  zlibDeflateEnd,
  zlibDeflateInit2,
  zlibDeflateReset,
  zlibDeflateSetDictionary,
} from 'pako';

// pdfkit's browser build default-imports this module and calls the pako 1
// names. pako 3 keeps the same 6-argument deflateInit2 and adds an optional
// legacyHash argument, which these callers leave unset.
const deflate = {
  deflate: zlibDeflate,
  deflateEnd: zlibDeflateEnd,
  deflateInit2: zlibDeflateInit2,
  deflateReset: zlibDeflateReset,
  deflateSetDictionary: zlibDeflateSetDictionary,
};

export default deflate;
