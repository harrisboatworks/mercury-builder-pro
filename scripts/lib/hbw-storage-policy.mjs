export const HBW_STORAGE_POLICY_URL = 'https://www.harrisboatworks.ca/winter-storage';

export const HBW_STORAGE_FAQ_QUESTION = 'Do you offer boat storage?';

const HBW_CONTEXT = /\b(?:Harris Boat Works|HBW|we|our)\b/i;
const INDOOR_STORAGE_TERM =
  /\b(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\b|\bstorage\b[^.!?;]{0,60}\b(?:indoors?|heated|climate[- ]controlled)\b|\b(?:store|stored)\s+boats?\s+(?:inside|indoors)\b|\bboats?\s+(?:are|can be)\s+stored\s+(?:securely\s+)?(?:inside|indoors)\b/i;

const SAFE_NEGATED_STORAGE_TERMS = [
  /\b(?:do|does|did)\s+not\s+(?:currently\s+)?(?:offer|provide|have|include|store|arrange|accommodate)\b[^.!?;]{0,100}\b(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\b/gi,
  /\bdon['’]t\s+(?:currently\s+)?(?:offer|provide|have|include|store|arrange|accommodate)\b[^.!?;]{0,100}\b(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\b/gi,
  /\b(?:never|cannot|can['’]t|will\s+not|won['’]t)\s+(?:currently\s+)?(?:offer|provide|have|include|store|arrange|accommodate)\b[^.!?;]{0,100}\b(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\b/gi,
  /\b(?:do|does|did)\s+not\s+store\s+boats?\s+(?:inside|indoors)\b/gi,
  /\bdon['’]t\s+store\s+boats?\s+(?:inside|indoors)\b/gi,
  /\bno\s+(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\b/gi,
  /\bnot\s+(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\b/gi,
  /\b(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\s+(?:is|are|will be)\s+(?:not\s+available|unavailable|not\s+offered)\b/gi,
  /\b(?:indoor|heated|climate[- ]controlled)\b[^.!?;]{0,60}\bstorage\s+(?:cannot|can['’]t|will\s+not|won['’]t)\s+be\s+(?:offered|provided|arranged|accommodated)\b/gi,
  /\bindoor_storage\s*[:=]\s*false\b/gi,
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
  if (/\bindoor_storage\s*[:=]\s*true\b/i.test(source)) {
    failures.push('Policy source contains an indoor_storage true flag.');
  }

  const sentences = source
    .replaceAll('\\n', '\n')
    .match(/[^.!?;\n]+[.!?;]?/g) ?? [];
  for (const sentence of sentences) {
    let hbwContextSeen = false;
    const clauses = sentence.split(/\b(?:but|however|although|whereas)\b/i);
    for (const clause of clauses) {
      const hasExplicitHbwContext = HBW_CONTEXT.test(clause);
      const inheritsHbwContext = hbwContextSeen &&
        /^\s*,?\s*(?:does|do|is|are|can|will|indoor|heated|climate)/i.test(clause) &&
        !/\b(?:other|another|competitor|nearby)\s+(?:marinas?|dealers?|providers?)\b/i.test(clause);
      if (hasExplicitHbwContext) hbwContextSeen = true;
      if (clause.trimEnd().endsWith('?') || (!hasExplicitHbwContext && !inheritsHbwContext)) {
        continue;
      }
      let unnegatedClause = clause;
      for (const safePattern of SAFE_NEGATED_STORAGE_TERMS) {
        unnegatedClause = unnegatedClause.replace(safePattern, '');
      }
      if (INDOOR_STORAGE_TERM.test(unnegatedClause)) {
        const message = 'Policy source contains an affirmative HBW indoor-storage claim.';
        if (!failures.includes(message)) failures.push(message);
      }
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
