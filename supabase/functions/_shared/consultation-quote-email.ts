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
const TEMPLATE_VARIABLE_PATTERN =
  /\{\{(customerName|quoteNumber|motorModel|totalPrice|documentAccessUrl)\}\}/g;

export interface ConsultationEmailTemplateData {
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
  documentAccessUrl: string;
}

export interface QuoteEmailDestinations {
  to: string[];
  bcc?: string[];
}

export interface ReplaceConsultationTemplateOptions {
  html?: boolean;
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

export function buildQuoteEmailDestinations(input: {
  isConsultationPath: boolean;
  isAdminNotification: boolean;
  customerEmail: string;
  adminRecipients: string[];
  auditBccRecipient?: string;
}): QuoteEmailDestinations {
  if (input.isConsultationPath) {
    return { to: [input.customerEmail] };
  }
  if (input.isAdminNotification) {
    return { to: [...input.adminRecipients] };
  }
  if (input.auditBccRecipient) {
    return { to: [input.customerEmail], bcc: [input.auditBccRecipient] };
  }
  return { to: [input.customerEmail] };
}

function escapeHtmlText(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
}

function encodeHrefAttribute(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function replaceConsultationTemplateVariables(
  template: string,
  data: ConsultationEmailTemplateData,
  options: ReplaceConsultationTemplateOptions = {},
): string {
  const html = options.html !== false;
  const documentAccessUrl = assertConsultationAccessUrl(data.documentAccessUrl);
  const values: Record<string, string> = {
    customerName: html ? escapeHtmlText(data.customerName) : data.customerName,
    quoteNumber: html ? escapeHtmlText(data.quoteNumber) : data.quoteNumber,
    motorModel: html ? escapeHtmlText(data.motorModel) : data.motorModel,
    totalPrice: html
      ? escapeHtmlText(data.totalPrice.toLocaleString())
      : data.totalPrice.toLocaleString(),
    documentAccessUrl: html ? encodeHrefAttribute(documentAccessUrl) : documentAccessUrl,
  };
  return template.replace(
    TEMPLATE_VARIABLE_PATTERN,
    (_match, key: keyof typeof values) => values[key],
  );
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
