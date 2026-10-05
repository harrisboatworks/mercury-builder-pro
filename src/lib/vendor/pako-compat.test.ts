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

function initDeflate(windowBits: number) {
  const stream = new ZStream();
  expect(deflate.deflateInit2(
    stream,
    6,
    constants.Z_DEFLATED,
    windowBits,
    8,
    constants.Z_DEFAULT_STRATEGY,
  )).toBe(constants.Z_OK);
  return stream;
}

function deflatePayload(stream: ZStream, payload: string, dictionary?: Uint8Array) {
  if (dictionary) {
    expect(deflate.deflateSetDictionary(stream, dictionary)).toBe(constants.Z_OK);
  }
  const input = textEncoder.encode(payload);
  const output = new Uint8Array(input.length + 256);
  stream.input = input;
  stream.next_in = 0;
  stream.avail_in = input.length;
  stream.output = output;
  stream.next_out = 0;
  stream.avail_out = output.length;
  expect(deflate.deflate(stream, constants.Z_FINISH)).toBe(constants.Z_STREAM_END);
  return output.slice(0, stream.next_out);
}

function initInflate(windowBits: number) {
  const stream = new ZStream();
  expect(inflate.inflateInit2(stream, windowBits)).toBe(constants.Z_OK);
  return stream;
}

function inflatePayload(stream: ZStream, compressed: Uint8Array, dictionary?: Uint8Array) {
  const output = new Uint8Array(compressed.length * 8 + 64);
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
  return textDecoder.decode(output.slice(0, stream.next_out));
}

function compress(windowBits: number, payload: string) {
  const stream = initDeflate(windowBits);
  const compressed = deflatePayload(stream, payload);
  deflate.deflateEnd(stream);
  return compressed;
}

function decompress(windowBits: number, compressed: Uint8Array) {
  const stream = initInflate(windowBits);
  const text = inflatePayload(stream, compressed);
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

  it('reuses one deflate stream and one inflate stream after reset', () => {
    const dictionary = textEncoder.encode('synthetic-dictionary');
    const firstPayload = 'synthetic dictionary payload';
    const secondPayload = 'second dictionary payload';
    const deflateStream = initDeflate(15);
    const first = deflatePayload(deflateStream, firstPayload, dictionary);
    expect(deflate.deflateReset(deflateStream)).toBe(constants.Z_OK);
    const second = deflatePayload(deflateStream, secondPayload, dictionary);
    expect(Array.from(first)).not.toEqual(Array.from(second));
    expect(deflate.deflateEnd(deflateStream)).toBe(constants.Z_OK);

    const inflateStream = initInflate(15);
    expect(inflatePayload(inflateStream, first, dictionary)).toBe(firstPayload);
    expect(inflate.inflateReset(inflateStream)).toBe(constants.Z_OK);
    expect(inflatePayload(inflateStream, second, dictionary)).toBe(secondPayload);
    expect(inflate.inflateEnd(inflateStream)).toBe(constants.Z_OK);
  });
});
