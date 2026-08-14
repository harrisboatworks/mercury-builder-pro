import { esc } from "./email-layout.ts";

export interface QuoteEmailTemplateValues {
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
}

/** Escape all request-controlled values before inserting them into a DB HTML template. */
export function replaceTemplateVariables(
  template: string,
  data: QuoteEmailTemplateValues,
): string {
  const values: Record<string, string> = {
    customerName: data.customerName,
    quoteNumber: data.quoteNumber,
    motorModel: data.motorModel,
    totalPrice: data.totalPrice.toLocaleString(),
  };

  return template.replace(
    /{{(customerName|quoteNumber|motorModel|totalPrice)}}/g,
    (_match, key: keyof typeof values) => esc(values[key]),
  );
}

/** Prevent CRLF header injection if a DB-managed subject contains substitutions. */
export function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim();
}
