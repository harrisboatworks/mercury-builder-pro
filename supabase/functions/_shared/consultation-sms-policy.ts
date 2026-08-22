import { ConsultationDocumentRequestError } from "./consultation-document-policy.ts";

const TOKEN_PATTERN = /cd_[0-9a-f]{64}/i;
const FRAGMENT_PATH_PATTERN = /\/quote\/document#/i;
const SIGNED_OR_QUERY_TOKEN_PATTERN = /\/storage\/v1\/object\/sign|\btoken=/i;

export function isTokenBearingSmsMessage(message: unknown): boolean {
  if (typeof message !== "string" || !message) return false;
  return (
    TOKEN_PATTERN.test(message)
    || FRAGMENT_PATH_PATTERN.test(message)
    || SIGNED_OR_QUERY_TOKEN_PATTERN.test(message)
  );
}

export function parseSmsAuditMessage(value: unknown): string {
  if (typeof value !== "string") {
    throw new ConsultationDocumentRequestError("SMS audit message is required");
  }
  const auditMessage = value.trim();
  if (!auditMessage || auditMessage.length > 500) {
    throw new ConsultationDocumentRequestError("SMS audit message is invalid");
  }
  if (isTokenBearingSmsMessage(auditMessage)) {
    throw new ConsultationDocumentRequestError("SMS audit message cannot include a document token");
  }
  return auditMessage;
}

export function assertTokenSafeSmsLog(options: {
  message: string;
  auditMessage?: unknown;
}): string {
  if (!isTokenBearingSmsMessage(options.message)) {
    return typeof options.auditMessage === "string" && options.auditMessage.trim()
      ? parseSmsAuditMessage(options.auditMessage)
      : options.message;
  }
  return parseSmsAuditMessage(options.auditMessage);
}
