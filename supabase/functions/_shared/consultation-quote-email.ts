import {
  CONSULTATION_DOCUMENT_ACCESS_ORIGIN,
  ConsultationDocumentRequestError,
  isForbiddenConsultationAttachmentUrl,
  parseConsultationDocumentId,
  parseDurableDocumentAccessUrl,
} from "./consultation-document-policy.ts";

export const CONSULTATION_ATTACHMENT_STATEMENT =
  "A PDF copy of your full quote is attached to this email.";
export const CONSULTATION_CTA_LABEL = "Open your private quote";

const UNRESOLVED_TEMPLATE_PATTERN = /\{\{[^}]+\}\}/;

export interface ConsultationEmailTemplateData {
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
  documentAccessUrl: string;
}

export function assertConsultationDocumentId(value: unknown): string {
  return parseConsultationDocumentId(value);
}

export function assertConsultationAccessUrl(value: unknown): string {
  if (isForbiddenConsultationAttachmentUrl(value)) {
    throw new ConsultationDocumentRequestError("Caller-controlled document URLs are not allowed");
  }
  return parseDurableDocumentAccessUrl(value);
}

export function rejectConsultationCallerPdfUrl(value: unknown): void {
  if (value == null || value === "") return;
  throw new ConsultationDocumentRequestError("Consultation email cannot accept a caller PDF URL");
}

export function replaceConsultationTemplateVariables(
  template: string,
  data: ConsultationEmailTemplateData,
): string {
  return template
    .replace(/{{customerName}}/g, data.customerName)
    .replace(/{{quoteNumber}}/g, data.quoteNumber)
    .replace(/{{motorModel}}/g, data.motorModel)
    .replace(/{{totalPrice}}/g, data.totalPrice.toLocaleString())
    .replace(/{{documentAccessUrl}}/g, data.documentAccessUrl);
}

export function assertResolvedConsultationTemplate(html: string, documentAccessUrl: string): void {
  if (UNRESOLVED_TEMPLATE_PATTERN.test(html)) {
    throw new ConsultationDocumentRequestError("Email template variable is unresolved");
  }
  if (!html.includes(CONSULTATION_ATTACHMENT_STATEMENT) && !/attached/i.test(html)) {
    throw new ConsultationDocumentRequestError("Consultation email must state the PDF is attached");
  }
  if (!html.includes(documentAccessUrl)) {
    throw new ConsultationDocumentRequestError("Consultation email must include the durable access link");
  }
  if (isForbiddenConsultationAttachmentUrl(html)) {
    throw new ConsultationDocumentRequestError("Consultation email cannot use a public or signed URL");
  }
  if (!html.includes(CONSULTATION_DOCUMENT_ACCESS_ORIGIN + "/quote/document#cd_")) {
    throw new ConsultationDocumentRequestError("Consultation email must include the durable access link");
  }
}
