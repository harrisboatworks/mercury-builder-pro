export const DEFAULT_DEPOSIT_COUNTRY = "Canada";
export const DEPOSIT_IDENTITY_ERROR = "Customer identity and address are required for a deposit";
export const MIN_DEPOSIT_PHONE_DIGITS = 10;
export const MAX_DEPOSIT_PHONE_DIGITS = 15;

export const DEPOSIT_IDENTITY_REQUIRED_FIELDS = [
  "name",
  "email",
  "phone",
  "addressLine1",
  "city",
  "region",
  "postalCode",
  "country",
] as const;

export type DepositIdentityField = (typeof DEPOSIT_IDENTITY_REQUIRED_FIELDS)[number];

export type DepositPostalAddress = {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type DepositIdentity = {
  fullName: string;
  email: string;
  phone: string;
  address: DepositPostalAddress;
};

export class DepositIdentityError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "DepositIdentityError";
    this.field = field;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9().\s-]+$/;
const POSTAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s-]{1,15}$/;
const UNICODE_LETTER_PATTERN = /\p{L}/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireText(
  value: unknown,
  field: string,
  label: string,
  min: number,
  max: number,
): string {
  const trimmed = readString(value);
  if (!trimmed) throw new DepositIdentityError(`${label} is required`, field);
  if (trimmed.length < min) throw new DepositIdentityError(`${label} is required`, field);
  if (trimmed.length > max) throw new DepositIdentityError(`${label} is too long`, field);
  return trimmed;
}

function optionalText(value: unknown, field: string, label: string, max: number): string | null {
  const trimmed = readString(value);
  if (!trimmed) return null;
  if (trimmed.length > max) throw new DepositIdentityError(`${label} is too long`, field);
  return trimmed;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseDepositIdentity(input: unknown): DepositIdentity {
  if (!isRecord(input)) {
    throw new DepositIdentityError(DEPOSIT_IDENTITY_ERROR);
  }

  const fullName = requireText(input.name ?? input.fullName, "name", "Full name", 2, 100);
  if (!UNICODE_LETTER_PATTERN.test(fullName)) {
    throw new DepositIdentityError("Full name is required", "name");
  }

  const email = requireText(input.email, "email", "Email", 3, 255).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new DepositIdentityError("Please enter a valid email", "email");
  }

  const phone = requireText(input.phone, "phone", "Phone number", 10, 25);
  const phoneDigits = digitsOnly(phone);
  if (
    !PHONE_PATTERN.test(phone)
    || phoneDigits.length < MIN_DEPOSIT_PHONE_DIGITS
    || phoneDigits.length > MAX_DEPOSIT_PHONE_DIGITS
  ) {
    throw new DepositIdentityError("Please enter a valid phone number", "phone");
  }

  const addressLine1 = requireText(input.addressLine1, "addressLine1", "Address line 1", 1, 120);
  const addressLine2 = optionalText(input.addressLine2, "addressLine2", "Address line 2", 120);
  const city = requireText(input.city, "city", "City", 1, 80);
  const region = requireText(input.region, "region", "Province / state / region", 1, 80);
  const postalCode = requireText(input.postalCode, "postalCode", "Postal / ZIP code", 2, 16);
  if (!POSTAL_PATTERN.test(postalCode)) {
    throw new DepositIdentityError("Please enter a valid postal / ZIP code", "postalCode");
  }
  const country = requireText(input.country, "country", "Country", 2, 80);

  return {
    fullName,
    email,
    phone,
    address: {
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
    },
  };
}

export function safeParseDepositIdentity(
  input: unknown,
): { success: true; data: DepositIdentity } | { success: false; errors: Record<string, string> } {
  try {
    return { success: true, data: parseDepositIdentity(input) };
  } catch (error) {
    if (error instanceof DepositIdentityError) {
      const errors: Record<string, string> = {};
      if (error.field) errors[error.field] = error.message;
      else {
        for (const field of DEPOSIT_IDENTITY_REQUIRED_FIELDS) {
          errors[field] = error.message;
        }
      }
      if (!error.field && isRecord(input)) {
        const missing = collectMissingDepositIdentityFields(input);
        if (missing.length > 0) {
          const fieldErrors: Record<string, string> = {};
          for (const field of missing) {
            fieldErrors[field] = `${fieldLabel(field)} is required`;
          }
          return { success: false, errors: fieldErrors };
        }
      }
      return { success: false, errors };
    }
    return { success: false, errors: { name: DEPOSIT_IDENTITY_ERROR } };
  }
}

export function collectMissingDepositIdentityFields(input: unknown): DepositIdentityField[] {
  if (!isRecord(input)) return [...DEPOSIT_IDENTITY_REQUIRED_FIELDS];
  return DEPOSIT_IDENTITY_REQUIRED_FIELDS.filter((field) => {
    const raw = field === "name" ? (input.name ?? input.fullName) : input[field];
    return !readString(raw);
  });
}

function fieldLabel(field: DepositIdentityField): string {
  switch (field) {
    case "name":
      return "Full name";
    case "email":
      return "Email";
    case "phone":
      return "Phone number";
    case "addressLine1":
      return "Address line 1";
    case "city":
      return "City";
    case "region":
      return "Province / state / region";
    case "postalCode":
      return "Postal / ZIP code";
    case "country":
      return "Country";
  }
}

export function formatDepositAddress(address: DepositPostalAddress): string {
  return [
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.region} ${address.postalCode}`,
    address.country,
  ].filter((line) => Boolean(line && String(line).trim())).join("\n");
}

export function depositIdentitiesMatch(left: DepositIdentity, right: DepositIdentity): boolean {
  return left.fullName === right.fullName
    && left.email === right.email
    && digitsOnly(left.phone) === digitsOnly(right.phone)
    && left.address.addressLine1 === right.address.addressLine1
    && (left.address.addressLine2 || "") === (right.address.addressLine2 || "")
    && left.address.city === right.address.city
    && left.address.region === right.address.region
    && left.address.postalCode.replace(/\s+/g, "").toUpperCase()
      === right.address.postalCode.replace(/\s+/g, "").toUpperCase()
    && left.address.country.toLowerCase() === right.address.country.toLowerCase();
}

export type SavedQuoteIdentityRow = {
  email?: unknown;
  customer_full_name?: unknown;
  customer_phone?: unknown;
  customer_address_line1?: unknown;
  customer_address_line2?: unknown;
  customer_city?: unknown;
  customer_region?: unknown;
  customer_postal_code?: unknown;
  customer_country?: unknown;
};

export function parseSavedQuoteIdentity(row: SavedQuoteIdentityRow): DepositIdentity {
  return parseDepositIdentity({
    name: row.customer_full_name,
    email: row.email,
    phone: row.customer_phone,
    addressLine1: row.customer_address_line1,
    addressLine2: row.customer_address_line2,
    city: row.customer_city,
    region: row.customer_region,
    postalCode: row.customer_postal_code,
    country: row.customer_country,
  });
}

export function savedQuoteIdentityColumns(identity: DepositIdentity): Record<string, string | null> {
  return {
    customer_full_name: identity.fullName,
    customer_phone: identity.phone,
    customer_address_line1: identity.address.addressLine1,
    customer_address_line2: identity.address.addressLine2,
    customer_city: identity.address.city,
    customer_region: identity.address.region,
    customer_postal_code: identity.address.postalCode,
    customer_country: identity.address.country,
  };
}

export function customerQuoteIdentityColumns(identity: DepositIdentity): Record<string, string | null> {
  return {
    customer_name: identity.fullName,
    customer_email: identity.email,
    customer_phone: identity.phone,
    customer_address_line1: identity.address.addressLine1,
    customer_address_line2: identity.address.addressLine2,
    customer_city: identity.address.city,
    customer_region: identity.address.region,
    customer_postal_code: identity.address.postalCode,
    customer_country: identity.address.country,
  };
}

export function quoteStateCustomerPatch(identity: DepositIdentity): Record<string, unknown> {
  return {
    customerName: identity.fullName,
    customerEmail: identity.email,
    customerPhone: identity.phone,
    customerAddress: identity.address,
  };
}

const ANONYMOUS_DEPOSIT_EMAILS = new Set([
  "anonymous@soft-lead.local",
  "pdf-download@placeholder.com",
]);

export type DepositAddressSource =
  | "saved_quote_submitted"
  | "customer_quote_submitted"
  | "stripe_billing"
  | "missing";

export type ResolvedDealAddress = {
  source: DepositAddressSource;
  label: string;
  address: DepositPostalAddress | null;
  isSubmittedContactAddress: boolean;
};

export type SubmittedAddressColumns = {
  customer_address_line1?: unknown;
  customer_address_line2?: unknown;
  customer_city?: unknown;
  customer_region?: unknown;
  customer_postal_code?: unknown;
  customer_country?: unknown;
};

export const DEAL_ADDRESS_SOURCE_LABELS: Record<DepositAddressSource, string> = {
  saved_quote_submitted: "Submitted contact address",
  customer_quote_submitted: "Submitted contact address (customer quote record)",
  stripe_billing: "Stripe checkout billing address (not the submitted contact address)",
  missing: "Missing — needs follow-up",
};

export function submittedAddressFromColumns(
  row?: SubmittedAddressColumns | null,
): DepositPostalAddress | null {
  if (!row) return null;
  const addressLine1 = readString(row.customer_address_line1);
  const city = readString(row.customer_city);
  const region = readString(row.customer_region);
  const postalCode = readString(row.customer_postal_code);
  const country = readString(row.customer_country);
  if (!addressLine1 || !city || !region || !postalCode || !country) return null;
  return {
    addressLine1,
    addressLine2: readString(row.customer_address_line2) || null,
    city,
    region,
    postalCode,
    country,
  };
}

export function postalAddressFromStripeBilling(value: unknown): DepositPostalAddress | null {
  if (!isRecord(value)) return null;
  const line1 = readString(value.line1);
  const city = readString(value.city);
  const region = readString(value.region);
  const postalCode = readString(value.postal_code);
  const country = readString(value.country);
  if (!line1 && !city && !postalCode && !country) return null;
  return {
    addressLine1: line1 || "—",
    addressLine2: readString(value.line2) || null,
    city: city || "—",
    region: region || "—",
    postalCode: postalCode || "—",
    country: country || "—",
  };
}

export function resolveDealAddress(input: {
  savedQuote?: SubmittedAddressColumns | null;
  customerQuote?: (SubmittedAddressColumns & { stripe_billing_address?: unknown }) | null;
}): ResolvedDealAddress {
  const fromSaved = submittedAddressFromColumns(input.savedQuote);
  if (fromSaved) {
    return {
      source: "saved_quote_submitted",
      label: DEAL_ADDRESS_SOURCE_LABELS.saved_quote_submitted,
      address: fromSaved,
      isSubmittedContactAddress: true,
    };
  }

  const fromCustomerQuote = submittedAddressFromColumns(input.customerQuote);
  if (fromCustomerQuote) {
    return {
      source: "customer_quote_submitted",
      label: DEAL_ADDRESS_SOURCE_LABELS.customer_quote_submitted,
      address: fromCustomerQuote,
      isSubmittedContactAddress: true,
    };
  }

  const fromStripe = postalAddressFromStripeBilling(input.customerQuote?.stripe_billing_address);
  if (fromStripe) {
    return {
      source: "stripe_billing",
      label: DEAL_ADDRESS_SOURCE_LABELS.stripe_billing,
      address: fromStripe,
      isSubmittedContactAddress: false,
    };
  }

  return {
    source: "missing",
    label: DEAL_ADDRESS_SOURCE_LABELS.missing,
    address: null,
    isSubmittedContactAddress: false,
  };
}

export type DepositMailContact = {
  fullName: string;
  email: string;
  phone: string;
};

export function usableDepositEmail(value: unknown): string {
  const email = readString(value).toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email) || ANONYMOUS_DEPOSIT_EMAILS.has(email)) {
    return "";
  }
  return email;
}

export function resolveDepositMailContact(input: {
  savedQuote?: { email?: unknown; customer_full_name?: unknown; customer_phone?: unknown } | null;
  customerQuote?: { customer_name?: unknown; customer_email?: unknown; customer_phone?: unknown } | null;
}): DepositMailContact | null {
  const fullName = readString(input.savedQuote?.customer_full_name)
    || readString(input.customerQuote?.customer_name);
  const email = usableDepositEmail(input.savedQuote?.email)
    || usableDepositEmail(input.customerQuote?.customer_email);
  const phone = readString(input.savedQuote?.customer_phone)
    || readString(input.customerQuote?.customer_phone);
  if (!fullName || !email) return null;
  return { fullName, email, phone };
}

export function formatDealAddressForEmail(resolved: ResolvedDealAddress): string {
  if (resolved.source === "missing" || !resolved.address) {
    return "Address not on file — follow up required";
  }
  const formatted = formatDepositAddress(resolved.address);
  if (resolved.source === "stripe_billing") {
    return `${resolved.label}\n${formatted}`;
  }
  return formatted;
}

export function depositRecordIsPaid(input: {
  savedQuoteDepositStatus?: unknown;
  customerQuotePaymentStatus?: unknown;
  quoteDataPaymentStatus?: unknown;
}): boolean {
  return input.savedQuoteDepositStatus === "paid"
    || input.customerQuotePaymentStatus === "paid";
}

export function canonicalPdfMayLackSubmittedAddress(source: DepositAddressSource): boolean {
  return source !== "saved_quote_submitted";
}
