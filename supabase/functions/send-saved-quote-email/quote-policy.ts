const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESUME_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SavedQuoteEmailRequest {
  savedQuoteId: string;
  resumeToken: string;
}

export interface SavedQuoteEmailRow {
  id: unknown;
  email: unknown;
  resume_token: unknown;
  quote_state: unknown;
  expires_at: unknown;
  is_soft_lead: unknown;
}

export interface ResolvedSavedQuoteEmail {
  savedQuoteId: string;
  recipient: string;
  customerName: string;
  motorModel: string;
  finalPrice: number;
  priceLabel: "Total" | "Motor price";
  expiresAt: string;
  quoteLink: string;
  referenceNumber: string;
}

export type SavedQuoteLookup = (
  savedQuoteId: string,
  resumeToken: string,
) => Promise<SavedQuoteEmailRow | null>;

export class InvalidSavedQuoteEmailRequestError extends Error {
  constructor() {
    super("Invalid saved quote email request");
    this.name = "InvalidSavedQuoteEmailRequestError";
  }
}

export class SavedQuoteEmailUnavailableError extends Error {
  constructor() {
    super("Saved quote is unavailable");
    this.name = "SavedQuoteEmailUnavailableError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nestedValue(root: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = root;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function boundedText(value: unknown, maximumLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maximumLength) return null;
  return trimmed;
}

function validPrice(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 1_000_000) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

export function parseSavedQuoteEmailRequest(value: unknown): SavedQuoteEmailRequest {
  if (!isRecord(value)) throw new InvalidSavedQuoteEmailRequestError();

  const savedQuoteId = boundedText(value.savedQuoteId, 36);
  const resumeToken = boundedText(value.resumeToken, 128);
  if (
    !savedQuoteId
    || !UUID_PATTERN.test(savedQuoteId)
    || !resumeToken
    || !RESUME_TOKEN_PATTERN.test(resumeToken)
  ) {
    throw new InvalidSavedQuoteEmailRequestError();
  }

  return { savedQuoteId, resumeToken };
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export function isAuthorizedServiceRequest(req: Request, serviceRoleKey: string): boolean {
  if (!serviceRoleKey) return false;
  const authorization = req.headers.get("authorization") || "";
  return constantTimeEqual(authorization, `Bearer ${serviceRoleKey}`);
}

export function resolveSavedQuoteEmail(
  row: SavedQuoteEmailRow,
  request: SavedQuoteEmailRequest,
  now = new Date(),
): ResolvedSavedQuoteEmail {
  const id = boundedText(row.id, 36);
  const resumeToken = boundedText(row.resume_token, 128);
  const email = boundedText(row.email, 254);
  const expiresAt = boundedText(row.expires_at, 64);

  if (
    !id
    || !UUID_PATTERN.test(id)
    || !constantTimeEqual(id, request.savedQuoteId)
    || !resumeToken
    || !constantTimeEqual(resumeToken, request.resumeToken)
    || row.is_soft_lead === true
    || !email
    || !EMAIL_PATTERN.test(email)
    || !expiresAt
  ) {
    throw new SavedQuoteEmailUnavailableError();
  }

  const expiryTime = Date.parse(expiresAt);
  if (!Number.isFinite(expiryTime) || expiryTime <= now.getTime() || !isRecord(row.quote_state)) {
    throw new SavedQuoteEmailUnavailableError();
  }

  const quoteState = row.quote_state;
  const motorModel = [
    nestedValue(quoteState, ["motor", "model"]),
    quoteState.motorModel,
    nestedValue(quoteState, ["selectedMotor", "model"]),
  ].map((candidate) => boundedText(candidate, 200)).find(Boolean);

  const priceCandidate = [
    { value: nestedValue(quoteState, ["pdfSnapshot", "pricing", "totalCashPrice"]), label: "Total" as const },
    { value: nestedValue(quoteState, ["frozenPricing", "total"]), label: "Total" as const },
    { value: quoteState.finalPrice, label: "Total" as const },
    { value: nestedValue(quoteState, ["pricing", "totalCashPrice"]), label: "Total" as const },
    { value: nestedValue(quoteState, ["motor", "price"]), label: "Motor price" as const },
  ].map((candidate) => ({ ...candidate, value: validPrice(candidate.value) }))
    .find((candidate) => candidate.value !== null);

  if (!motorModel || !priceCandidate || priceCandidate.value === null) {
    throw new SavedQuoteEmailUnavailableError();
  }

  const customerName = boundedText(quoteState.customerName, 120) || "Valued Customer";

  return {
    savedQuoteId: id,
    recipient: email,
    customerName,
    motorModel,
    finalPrice: priceCandidate.value,
    priceLabel: priceCandidate.label,
    expiresAt,
    quoteLink: `https://www.mercuryrepower.ca/quote/saved/${id}`,
    referenceNumber: id.slice(0, 8).toUpperCase(),
  };
}

export async function authorizeSavedQuoteEmail(
  input: unknown,
  lookup: SavedQuoteLookup,
  now = new Date(),
): Promise<ResolvedSavedQuoteEmail> {
  const request = parseSavedQuoteEmailRequest(input);
  const row = await lookup(request.savedQuoteId, request.resumeToken);
  if (!row) throw new SavedQuoteEmailUnavailableError();
  return resolveSavedQuoteEmail(row, request, now);
}
