type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isPrimitive = (value: unknown): value is string | number | boolean | null =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const copyPrimitives = (source: JsonRecord, keys: readonly string[]): JsonRecord => {
  const target: JsonRecord = {};
  for (const key of keys) {
    const value = source[key];
    if (isPrimitive(value)) target[key] = value;
  }
  return target;
};

const compactArray = <T>(values: Array<T | undefined>): T[] =>
  values.filter((value): value is T => value !== undefined);

const PURCHASE_KEYS = [
  'motorModel', 'motorPrice', 'downPayment', 'tradeInValue', 'amountToFinance',
  'priceBasis', 'includedTradeInValue', 'preTradeSubtotal', 'preferredTerm',
  'promoOption', 'promoRate', 'promoTerm', 'promoValue', 'promoName',
  'promoSavings', 'promoCombinationMode',
] as const;

const PERSON_KEYS = [
  'firstName', 'middleName', 'lastName', 'suffix', 'dateOfBirth', 'email',
  'primaryPhone', 'alternatePhone', 'housingStatus', 'monthlyHousingPayment',
] as const;

const ADDRESS_KEYS = [
  'street', 'city', 'province', 'postalCode', 'timeAtAddress',
] as const;

const EMPLOYMENT_KEYS = [
  'status', 'employerName', 'employerPhone', 'jobTitle', 'timeAtJob', 'annualIncome',
] as const;

const PREVIOUS_EMPLOYER_KEYS = ['name', 'timeAtJob'] as const;

const ADDITIONAL_INCOME_KEYS = ['source', 'monthlyAmount'] as const;

const FINANCIAL_KEYS = [
  'creditScoreEstimate', 'monthlyHousingPayment', 'monthlyCarPayment',
  'monthlyCreditCardPayments', 'otherMonthlyDebt', 'bankName', 'accountType',
  'timeWithBank', 'hasBankruptcy',
] as const;

const BANKRUPTCY_KEYS = ['date', 'status'] as const;

const REFERENCE_KEYS = ['fullName', 'relationship', 'phone', 'howLongKnown'] as const;

function sanitizeAddress(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, ADDRESS_KEYS);
}

function sanitizePerson(value: JsonRecord): JsonRecord {
  const result = copyPrimitives(value, PERSON_KEYS);
  const currentAddress = sanitizeAddress(value.currentAddress);
  const previousAddress = sanitizeAddress(value.previousAddress);
  if (currentAddress) result.currentAddress = currentAddress;
  if (previousAddress) result.previousAddress = previousAddress;
  return result;
}

function sanitizePreviousEmployer(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, PREVIOUS_EMPLOYER_KEYS);
}

function sanitizeAdditionalIncome(value: unknown): JsonRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return compactArray(value.map((item) => {
    if (!isRecord(item)) return undefined;
    return copyPrimitives(item, ADDITIONAL_INCOME_KEYS);
  }));
}

function sanitizeEmployment(value: JsonRecord): JsonRecord {
  const result = copyPrimitives(value, EMPLOYMENT_KEYS);
  const previousEmployer = sanitizePreviousEmployer(value.previousEmployer);
  const additionalIncome = sanitizeAdditionalIncome(value.additionalIncome);
  if (previousEmployer) result.previousEmployer = previousEmployer;
  if (additionalIncome) result.additionalIncome = additionalIncome;
  return result;
}

function sanitizeBankruptcyDetails(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, BANKRUPTCY_KEYS);
}

function sanitizeFinancial(value: JsonRecord): JsonRecord {
  const result = copyPrimitives(value, FINANCIAL_KEYS);
  const bankruptcyDetails = sanitizeBankruptcyDetails(value.bankruptcyDetails);
  if (bankruptcyDetails) result.bankruptcyDetails = bankruptcyDetails;
  return result;
}

function sanitizePurchase(value: JsonRecord): JsonRecord {
  return copyPrimitives(value, PURCHASE_KEYS);
}

function sanitizeReference(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  return copyPrimitives(value, REFERENCE_KEYS);
}

function sanitizeReferences(value: JsonRecord): JsonRecord {
  const result: JsonRecord = {};
  const reference1 = sanitizeReference(value.reference1);
  const reference2 = sanitizeReference(value.reference2);
  if (reference1) result.reference1 = reference1;
  if (reference2) result.reference2 = reference2;
  return result;
}

function sanitizeCoApplicant(value: JsonRecord): JsonRecord {
  return {
    ...sanitizePerson(value),
    ...sanitizeEmployment(value),
    ...sanitizeFinancial(value),
  };
}

function mapNullableRecord(
  value: unknown,
  map: (record: JsonRecord) => JsonRecord,
): JsonRecord | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  return map(value);
}

/**
 * Build the only JSON shape that an unauthenticated resume-token bearer may
 * receive. Unknown fields fail closed. The resume form needs the applicant's
 * own draft fields; SIN and any key not on a nested allowlist are dropped.
 */
export function buildPublicApplication(value: unknown): JsonRecord {
  if (!isRecord(value)) return {};

  const result: JsonRecord = {};
  if (typeof value.id === 'string') result.id = value.id;
  if (typeof value.resume_token === 'string') result.resume_token = value.resume_token;
  if (typeof value.current_step === 'number') result.current_step = value.current_step;
  if (typeof value.quote_id === 'string' || value.quote_id === null) {
    result.quote_id = value.quote_id;
  }
  if (Array.isArray(value.completed_steps)) {
    result.completed_steps = value.completed_steps.filter((step) => typeof step === 'number');
  }

  const purchase = mapNullableRecord(value.purchase_data, sanitizePurchase);
  const applicant = mapNullableRecord(value.applicant_data, sanitizePerson);
  const employment = mapNullableRecord(value.employment_data, sanitizeEmployment);
  const financial = mapNullableRecord(value.financial_data, sanitizeFinancial);
  const coApplicant = mapNullableRecord(value.co_applicant_data, sanitizeCoApplicant);
  const references = mapNullableRecord(value.references_data, sanitizeReferences);

  if (purchase !== undefined) result.purchase_data = purchase;
  if (applicant !== undefined) result.applicant_data = applicant;
  if (employment !== undefined) result.employment_data = employment;
  if (financial !== undefined) result.financial_data = financial;
  if (coApplicant !== undefined) result.co_applicant_data = coApplicant;
  if (references !== undefined) result.references_data = references;
  return result;
}
