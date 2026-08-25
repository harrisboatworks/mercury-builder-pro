import {
  type ConsultationDeliverySnapshot,
  parseConsultationQuoteNumber,
  validateQuotePdf,
} from "./consultation-document-policy.ts";

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function asciiPdf(parts: string[]): Uint8Array {
  return new TextEncoder().encode(parts.join(""));
}

export function renderConsultationQuotePdf(input: {
  quoteNumber: string;
  snapshot: ConsultationDeliverySnapshot;
}): Uint8Array {
  const quoteNumber = parseConsultationQuoteNumber(input.quoteNumber);
  const lines = [
    "Harris Boat Works",
    "Private Mercury quote",
    quoteNumber,
    input.snapshot.customerName,
    input.snapshot.customerEmail,
    input.snapshot.motorModel,
    `Total ${input.snapshot.totalPrice} CAD`,
  ];
  const content = [
    "BT",
    "/F1 14 Tf",
    "50 740 Td",
    ...lines.flatMap((line, index) => (
      index === 0 ? [`(${escapePdfText(line)}) Tj`] : ["0 -20 Td", `(${escapePdfText(line)}) Tj`]
    )),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let body = "%PDF-1.7\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xrefStart = body.length;
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let index = 1; index <= objects.length; index += 1) {
    xref.push(`${String(offsets[index]).padStart(10, "0")} 00000 n `);
  }
  body += `${xref.join("\n")}\n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  const bytes = asciiPdf([body]);
  validateQuotePdf(bytes, "application/pdf");
  return bytes;
}
