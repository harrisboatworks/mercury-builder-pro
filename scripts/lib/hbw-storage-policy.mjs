export const HBW_STORAGE_POLICY_URL = 'https://www.harrisboatworks.ca/winter-storage';

export const HBW_STORAGE_FAQ_QUESTION = 'Do you offer boat storage?';

const FORBIDDEN_INDOOR_STORAGE_CLAIMS = [
  {
    label: 'affirmative HBW indoor-storage offer',
    pattern:
      /(?<!does )\b(?:Harris Boat Works|HBW|we)\s+(?:currently\s+)?(?:offer|offers|provide|provides|have|has|can accommodate)\s+(?:(?!(?:\bno\b|\bnot\b|don['’]t))[^.!?]){0,80}\b(?:indoor|heated|climate[- ]controlled)\b[^.!?]{0,60}\bstorage\b/i,
  },
  {
    label: 'affirmative HBW indoor-storage offer',
    pattern:
      /(?<!does )\b(?:Harris Boat Works|HBW|we)\s+(?:currently\s+)?(?:offer|offers|provide|provides|have|has)\s+(?!no\b|not\b)(?:boat\s+|winter\s+|boat winter\s+)?storage\s+(?:both\s+)?(?:indoors?|heated|climate[- ]controlled)\b/i,
  },
  {
    label: 'affirmative HBW indoor-storage offer',
    pattern:
      /\bour storage options?\s+(?:include|includes|feature|features)\s+(?:(?!(?:\bno\b|\bnot\b))[^.!?]){0,80}\b(?:indoor|heated|climate[- ]controlled)\b/i,
  },
  {
    label: 'affirmative HBW indoor-storage offer',
    pattern:
      /\bindoor(?:\s+(?:and|or|&|\/)\s+outdoor)?\s+(?:boat\s+|winter\s+|boat winter\s+)?storage\s+(?:is|are)\s+(?:now\s+)?available\s+at\s+(?:Harris Boat Works|HBW)\b/i,
  },
  {
    label: 'affirmative HBW indoor-storage offer',
    pattern:
      /\bboats?\s+(?:are|can be)\s+stored\s+(?:securely\s+)?(?:inside|indoors)\s+(?:for winter\s+)?at\s+(?:Harris Boat Works|HBW)\b/i,
  },
  {
    label: 'indoor_storage true flag',
    pattern: /\bindoor_storage\s*[:=]\s*true\b/i,
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
