import QRCode from 'qrcode';

const SAVED_QUOTE_QR_OPTIONS = {
  width: 240,
  margin: 4,
  color: { dark: '#111827', light: '#ffffff' },
} as const;

/**
 * A PDF must only call its QR a resumable quote when a saved-quote URL exists.
 * Returning undefined keeps the PDF on its honest call/text/website fallback.
 */
export async function generateSavedQuoteQrCode(
  savedQuoteUrl?: string | null,
): Promise<string | undefined> {
  if (!savedQuoteUrl) return undefined;
  return QRCode.toDataURL(savedQuoteUrl, SAVED_QUOTE_QR_OPTIONS);
}
