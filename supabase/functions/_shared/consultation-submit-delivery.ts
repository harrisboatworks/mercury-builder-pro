import { buildEmail, detailsCard, esc } from "./email-layout.ts";

export const CONSULTATION_REQUEST_RECEIVED_STATEMENT =
  "This email confirms we received your quote request. It does not attach a quote PDF.";

const CALLER_DOCUMENT_KEYS = [
  "documentId",
  "documentAccessUrl",
  "pdfUrl",
  "quotePdfPath",
  "quote_pdf_path",
  "signedUrl",
];

export function assertNoCallerDocumentDelivery(body: Record<string, unknown>): void {
  for (const key of CALLER_DOCUMENT_KEYS) {
    if (key in body) {
      throw new Error("Caller-controlled documents are not allowed");
    }
  }
}

export function buildConsultationRequestReceivedEmail(data: {
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
}): string {
  const rows = [
    { label: "Reference", value: esc(data.quoteNumber) },
    { label: "Motor", value: esc(data.motorModel) },
    { label: "Quoted total", value: `$${data.totalPrice.toLocaleString()} CAD` },
  ];
  const body = `
    <p style="margin:0 0 14px 0;">Hi ${esc(data.customerName)},</p>
    <p style="margin:0 0 14px 0;">Thanks. Harris Boat Works received your Mercury quote request. A person will review it and contact you within 1 business day.</p>
    ${detailsCard(rows)}
    <p style="margin:18px 0 0 0;color:#6b7280;font-size:14px;">${CONSULTATION_REQUEST_RECEIVED_STATEMENT}</p>
    <p style="margin:16px 0 0 0;">This is not an order and no payment was taken.</p>
    <p style="margin:16px 0 0 0;">Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
  `;
  return buildEmail({
    preheader: `We received your ${data.motorModel} quote request, ref ${data.quoteNumber}`,
    heading: "We received your quote request",
    bodyHtml: body,
    footerNote: "Pickup or installation is arranged only after you approve the reviewed quote.",
  });
}

export function consultationSubmitCustomerDestinations(customerEmail: string): { to: string[] } {
  return { to: [customerEmail] };
}
