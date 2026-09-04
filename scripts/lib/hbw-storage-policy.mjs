export const HBW_STORAGE_POLICY_URL = 'https://www.harrisboatworks.ca/winter-storage';

export const HBW_STORAGE_FAQ_QUESTION = 'Do you offer boat storage?';

const FORBIDDEN_INDOOR_STORAGE_CLAIMS = [
  {
    label: 'indoor-and-outdoor storage offer',
    pattern:
      /\b(?:both\s+)?indoor\s*(?:and|or|&|\/)\s*outdoor\s+(?:boat\s+)?storage(?:\s+options?)?\b/i,
  },
  {
    label: 'affirmative HBW indoor-storage offer',
    pattern:
      /\b(?:Harris Boat Works|HBW|we)\s+(?:currently\s+)?(?:offer|offers|provide|provides|have|has)\s+(?:both\s+)?(?:indoor|heated|climate[- ]controlled)\s+(?:boat\s+|winter\s+|boat winter\s+)?storage\b/i,
  },
  {
    label: 'affirmative HBW indoor-storage offer',
    pattern:
      /\b(?:Harris Boat Works|HBW|we)\s+(?:currently\s+)?(?:offer|offers|provide|provides|have|has)\s+(?:boat\s+|winter\s+|boat winter\s+)?storage\s+(?:both\s+)?(?:indoors?|heated|climate[- ]controlled)\b/i,
  },
];

const REQUIRED_STORAGE_FAQ_SIGNALS = [
  {
    label: 'outdoor winter-storage scope',
    pattern: /\boutdoor winter storage\b/i,
  },
  {
    label: 'indoor/heated-storage denial',
    pattern: /\bdo not offer indoor or heated boat storage\b/i,
  },
  {
    label: 'shrink-wrap location clarification',
    pattern: /done inside[\s\S]{0,160}done outside[\s\S]{0,240}refer only to where we apply shrink wrap/i,
  },
];

function storageFaqWindow(source) {
  const questionIndex = source.indexOf(HBW_STORAGE_FAQ_QUESTION);
  if (questionIndex === -1) return null;
  return source.slice(questionIndex, questionIndex + 2_000);
}

function evaluateForbiddenClaims(source, failures) {
  for (const claim of FORBIDDEN_INDOOR_STORAGE_CLAIMS) {
    if (claim.pattern.test(source)) {
      const message = `Policy source contains an ${claim.label}.`;
      if (!failures.includes(message)) failures.push(message);
    }
  }
}

export function evaluateHbwStoragePolicy(policySource) {
  const source = String(policySource ?? '');
  const failures = [];

  evaluateForbiddenClaims(source, failures);

  const faqWindow = storageFaqWindow(source);
  if (faqWindow) {
    for (const signal of REQUIRED_STORAGE_FAQ_SIGNALS) {
      if (!signal.pattern.test(faqWindow)) {
        failures.push(`The GTM storage FAQ is missing the ${signal.label}.`);
      }
    }
  }

  return {
    ok: failures.length === 0,
    storageFaqDetected: faqWindow !== null,
    failures,
  };
}

export function evaluateHbwStorageFaqEntries(entries, { requireExpectedFaq = true } = {}) {
  const normalizedEntries = entries.map((entry) => ({
    question: String(entry?.question ?? ''),
    answer: String(entry?.answer ?? ''),
  }));
  const failures = [];

  for (const entry of normalizedEntries) evaluateForbiddenClaims(entry.answer, failures);

  const expectedEntries = normalizedEntries.filter(
    (entry) => entry.question.trim().toLowerCase() === HBW_STORAGE_FAQ_QUESTION.toLowerCase(),
  );
  if (requireExpectedFaq && expectedEntries.length === 0) {
    failures.push(`Rendered schema is missing the expected "${HBW_STORAGE_FAQ_QUESTION}" FAQ.`);
  }
  if (expectedEntries.length > 1) {
    failures.push(`Rendered schema contains ${expectedEntries.length} copies of the expected storage FAQ.`);
  }

  for (const entry of expectedEntries) {
    for (const signal of REQUIRED_STORAGE_FAQ_SIGNALS) {
      if (!signal.pattern.test(entry.answer)) {
        failures.push(`The rendered storage FAQ is missing the ${signal.label}.`);
      }
    }
  }

  return {
    ok: failures.length === 0,
    storageFaqDetected: expectedEntries.length > 0,
    expectedFaqCount: expectedEntries.length,
    failures,
  };
}
