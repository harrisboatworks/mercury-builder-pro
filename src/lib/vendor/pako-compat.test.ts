import { describe, expect, it } from 'vitest';
import constants from './pako-constants-compat';
import deflate from './pako-deflate-compat';
import inflate from './pako-inflate-compat';
import ZStream from './pako-zstream-compat';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Produced by pako 1.0.11 pako.deflate(utf8("synthetic-pako-legacy-v1")).
const LEGACY_PAKO_1_0_11_DEFLATE = Uint8Array.from([
  120, 156, 43, 174, 204, 43, 201, 72, 45, 201, 76, 214, 45, 72, 204, 206, 215,
  205, 73, 77, 79, 76, 174, 212, 45, 51, 4, 0, 120, 100, 9, 42,
]);

function compress(windowBits: number, payload: string, dictionary?: Uint8Array) {
  const input = textEncoder.encode(payload);
  const stream = new ZStream();
  const output = new Uint8Array(input.length + 256);
  expect(deflate.deflateInit2(
    stream,
    6,
    constants.Z_DEFLATED,
    windowBits,
    8,
    constants.Z_DEFAULT_STRATEGY,
  )).toBe(constants.Z_OK);
  if (dictionary) {
    expect(deflate.deflateSetDictionary(stream, dictionary)).toBe(constants.Z_OK);
  }
  stream.input = input;
  stream.next_in = 0;
  stream.avail_in = input.length;
  stream.output = output;
  stream.next_out = 0;
  stream.avail_out = output.length;
  expect(deflate.deflate(stream, constants.Z_FINISH)).toBe(constants.Z_STREAM_END);
  const compressed = output.slice(0, stream.next_out);
  expect(deflate.deflateReset(stream)).toBe(constants.Z_OK);
  deflate.deflateEnd(stream);
  return compressed;
}

function decompress(windowBits: number, compressed: Uint8Array, dictionary?: Uint8Array) {
  const stream = new ZStream();
  const output = new Uint8Array(compressed.length * 8 + 64);
  expect(inflate.inflateInit2(stream, windowBits)).toBe(constants.Z_OK);
  stream.input = compressed;
  stream.next_in = 0;
  stream.avail_in = compressed.length;
  stream.output = output;
  stream.next_out = 0;
  stream.avail_out = output.length;
  let status = inflate.inflate(stream, constants.Z_FINISH);
  if (status === constants.Z_NEED_DICT) {
    expect(dictionary).toBeDefined();
    expect(inflate.inflateSetDictionary(stream, dictionary!)).toBe(constants.Z_OK);
    status = inflate.inflate(stream, constants.Z_FINISH);
  }
  expect(status).toBe(constants.Z_STREAM_END);
  const text = textDecoder.decode(output.slice(0, stream.next_out));
  expect(inflate.inflateReset(stream)).toBe(constants.Z_OK);
  expect(inflate.inflateEnd(stream)).toBe(constants.Z_OK);
  return text;
}

describe('pako 3 zlib shims', () => {
  it('keeps the zlib constants pdfkit passes into deflateInit2', () => {
    expect(constants.Z_DEFLATED).toBe(8);
    expect(constants.Z_DEFAULT_COMPRESSION).toBe(-1);
    expect(constants.Z_DEFAULT_STRATEGY).toBe(0);
    expect(constants.Z_OK).toBe(0);
    expect(constants.Z_STREAM_END).toBe(1);
    expect(constants.Z_NEED_DICT).toBe(2);
    expect(constants.Z_FINISH).toBe(4);
  });

  it('roundtrips zlib, gzip, and raw streams', () => {
    expect(decompress(15, compress(15, 'synthetic zlib payload'))).toBe('synthetic zlib payload');
    expect(decompress(31, compress(31, 'synthetic gzip payload'))).toBe('synthetic gzip payload');
    expect(decompress(-15, compress(-15, 'synthetic raw payload'))).toBe('synthetic raw payload');
  });

  it('inflates a stream compressed by pako 1.0.11', () => {
    expect(decompress(15, LEGACY_PAKO_1_0_11_DEFLATE)).toBe('synthetic-pako-legacy-v1');
  });

  it('resets a zlib stream and restores a preset dictionary', () => {
    const dictionary = textEncoder.encode('synthetic-dictionary');
    const compressed = compress(15, 'synthetic dictionary payload', dictionary);
    expect(decompress(15, compressed, dictionary)).toBe('synthetic dictionary payload');
  });
});
