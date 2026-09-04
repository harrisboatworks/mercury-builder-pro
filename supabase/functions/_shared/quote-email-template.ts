import { esc } from "./email-layout.ts";

export interface QuoteEmailTemplateValues {
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
}

const TEMPLATE_VARIABLE_PATTERN = /{{(customerName|quoteNumber|motorModel|totalPrice)}}/g;

function templateValues(data: QuoteEmailTemplateValues): Record<string, string> {
  return {
    customerName: data.customerName,
    quoteNumber: data.quoteNumber,
    motorModel: data.motorModel,
    totalPrice: data.totalPrice.toLocaleString(),
  };
}

/** Escape all request-controlled values before inserting them into a DB HTML template. */
export function replaceTemplateVariables(
  template: string,
  data: QuoteEmailTemplateValues,
): string {
  const values = templateValues(data);

  return template.replace(
    TEMPLATE_VARIABLE_PATTERN,
    (_match, key: keyof typeof values) => esc(values[key]),
  );
}

/** Prevent CRLF header injection if a DB-managed subject contains substitutions. */
export function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim();
}

/** Substitute plain-text subject values without leaking HTML entities into the subject. */
export function replaceSubjectTemplateVariables(
  template: string,
  data: QuoteEmailTemplateValues,
): string {
  const values = templateValues(data);
  const subject = template.replace(
    TEMPLATE_VARIABLE_PATTERN,
    (_match, key: keyof typeof values) => values[key],
  );

  return sanitizeEmailSubject(subject);
}
