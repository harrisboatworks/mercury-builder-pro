export interface IdentifiedPdfCustomer {
  name?: string | null;
  email?: string | null;
}

/**
 * customer_quotes is a contactable CRM table and requires both fields.
 * Unidentified PDF downloads are already represented by the resumable
 * saved_quotes record and quote activity events, so they should not be forced
 * into the CRM with fake placeholder contact details.
 */
export function hasIdentifiedPdfCustomer(customer: IdentifiedPdfCustomer): boolean {
  return Boolean(customer.name?.trim() && customer.email?.trim());
}
