import { esc } from "../_shared/email-layout.ts";

export interface QuoteTemplateVariables {
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
}

export type QuoteTemplateMode = "html" | "subject";

export function sanitizeEmailSubject(value: string): string {
  const withoutControls = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    const isControl = codePoint <= 0x1f
      || (codePoint >= 0x7f && codePoint <= 0x9f)
      || codePoint === 0x2028
      || codePoint === 0x2029;
    return isControl ? " " : character;
  }).join("");

  return withoutControls
    .replace(/ {2,}/g, " ")
    .trim();
}

export function replaceTemplateVariables(
  template: string,
  data: QuoteTemplateVariables,
  mode: QuoteTemplateMode,
): string {
  const textValue = mode === "html" ? esc : sanitizeEmailSubject;
  const values = {
    customerName: textValue(data.customerName),
    quoteNumber: textValue(data.quoteNumber),
    motorModel: textValue(data.motorModel),
    totalPrice: data.totalPrice.toLocaleString(),
  };
  const rendered = template.replace(
    /{{(customerName|quoteNumber|motorModel|totalPrice)}}/g,
    (_token, key: keyof typeof values) => values[key],
  );

  return mode === "subject" ? sanitizeEmailSubject(rendered) : rendered;
}
