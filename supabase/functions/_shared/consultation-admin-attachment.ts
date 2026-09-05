/** Keep an internal PDF bound to its original quote and staff notification. */
export function isAuthorizedAdminAttachment(request: {
  internal: boolean;
  emailType: string;
  quoteId?: string;
  documentId?: string;
  pdfUrl?: string;
}): boolean {
  return request.internal && request.emailType === 'admin_quote_notification'
    && Boolean(request.quoteId) && !request.documentId && !request.pdfUrl;
}

export function matchesAdminAttachmentQuote(document: {
  customer_quote_id: string | null;
  quote_number: string;
}, quoteId: string | undefined, quoteNumber: string): boolean {
  return Boolean(quoteId) && document.customer_quote_id === quoteId
    && document.quote_number === quoteNumber;
}
