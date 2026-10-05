import React from 'react';
import { Document, Page, Text, pdf } from '@react-pdf/renderer';

const status = document.querySelector('#status');
const header = document.querySelector('#header');
const size = document.querySelector('#size');
const button = document.querySelector('#render');

function setText(node: Element | null, value: string) {
  if (node) node.textContent = value;
}

async function renderSyntheticPdf() {
  setText(status, 'rendering');
  setText(header, '');
  setText(size, '');
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
  setText(header, signature);
  setText(size, String(bytes.length));
  setText(status, signature === '%PDF-' && bytes.length > 5 ? 'pdf-ok' : 'pdf-failed');
}

button?.addEventListener('click', () => {
  void renderSyntheticPdf().catch((error: unknown) => {
    setText(status, 'pdf-failed');
    setText(header, error instanceof Error ? error.message : 'render failed');
  });
});
