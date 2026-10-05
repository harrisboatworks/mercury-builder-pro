import React from 'react';
import { inflate } from 'pako';
import { Document, Page, Text, pdf } from '@react-pdf/renderer';

const FIXTURE_LINES = [
  'Synthetic pako PDF smoke',
  'Fixture SYNTHETIC-PAKO-634',
];

const status = document.querySelector('#status');
const header = document.querySelector('#header');
const size = document.querySelector('#size');
const decoded = document.querySelector('#decoded');
const viewer = document.querySelector<HTMLIFrameElement>('#viewer');
const openSaved = document.querySelector<HTMLAnchorElement>('#open-saved');
const button = document.querySelector('#render');

function setText(node: Element | null, value: string) {
  if (node) node.textContent = value;
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from: number) {
  outer: for (let position = from; position + needle.length <= haystack.length; position += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[position + offset] !== needle[offset]) continue outer;
    }
    return position;
  }
  return -1;
}

function pdfStreams(bytes: Uint8Array) {
  const streams: Uint8Array[] = [];
  const startMark = new TextEncoder().encode('stream');
  const endMark = new TextEncoder().encode('endstream');
  let cursor = 0;
  while (cursor < bytes.length) {
    const start = indexOfBytes(bytes, startMark, cursor);
    if (start < 0) break;
    let dataStart = start + startMark.length;
    if (bytes[dataStart] === 13) dataStart += 1;
    if (bytes[dataStart] === 10) dataStart += 1;
    const end = indexOfBytes(bytes, endMark, dataStart);
    if (end < 0) break;
    let dataEnd = end;
    if (bytes[dataEnd - 1] === 10) dataEnd -= 1;
    if (bytes[dataEnd - 1] === 13) dataEnd -= 1;
    streams.push(bytes.slice(dataStart, dataEnd));
    cursor = end + endMark.length;
  }
  return streams;
}

function decodePdfText(bytes: Uint8Array) {
  const pieces: string[] = [];
  for (const stream of pdfStreams(bytes)) {
    let source: Uint8Array;
    try {
      source = inflate(stream);
    } catch {
      source = stream;
    }
    const content = new TextDecoder('latin1').decode(source);
    for (const match of content.matchAll(/<([0-9A-Fa-f]+)>/g)) {
      const hex = match[1];
      if (hex.length % 2 !== 0) continue;
      const chars = new Uint8Array(hex.length / 2);
      for (let index = 0; index < chars.length; index += 1) {
        chars[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
      }
      pieces.push(new TextDecoder('latin1').decode(chars));
    }
    for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      pieces.push(match[0].slice(1, -1).replace(/\\([()\\])/g, '$1'));
    }
  }
  return pieces.join('');
}

async function renderSyntheticPdf() {
  setText(status, 'rendering');
  setText(header, '');
  setText(size, '');
  setText(decoded, '');
  if (viewer) viewer.removeAttribute('src');
  const blob = await pdf(
    <Document>
      <Page size="LETTER">
        <Text>Synthetic pako PDF smoke</Text>
        <Text>Fixture SYNTHETIC-PAKO-634</Text>
      </Page>
    </Document>,
  ).toBlob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const signature = new TextDecoder().decode(bytes.slice(0, 5));
  const pageText = decodePdfText(bytes);
  const missing = FIXTURE_LINES.filter((line) => !pageText.includes(line));
  const save = await fetch('/synthetic-pako-634.pdf', { method: 'PUT', body: bytes });
  if (!save.ok && save.status !== 204) {
    throw new Error(`save failed (${save.status})`);
  }
  const savedUrl = `/synthetic-pako-634.pdf?rendered=${Date.now()}`;
  if (viewer) viewer.src = savedUrl;
  if (openSaved) openSaved.href = savedUrl;
  setText(header, signature);
  setText(size, String(bytes.length));
  setText(decoded, pageText);
  setText(status, signature === '%PDF-' && missing.length === 0 ? 'pdf-ok' : 'pdf-failed');
}

button?.addEventListener('click', () => {
  void renderSyntheticPdf().catch((error: unknown) => {
    setText(status, 'pdf-failed');
    setText(header, error instanceof Error ? error.message : 'render failed');
  });
});
