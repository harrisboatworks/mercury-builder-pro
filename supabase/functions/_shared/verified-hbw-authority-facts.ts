export const HBW_AUTHORITY_FACTS_VERSION = "hbw-authority-2026-07-25.1";

export const HBW_PREMIER_DEALER_GUIDE = {
  title: "HBW's Mercury Premier Dealer guide",
  url: "https://www.mercuryrepower.ca/blog/best-mercury-dealer-ontario-hbw-difference",
} as const;

export type HbwAuthorityIntent =
  | "premier_dealer"
  | "dealer_warranty";

export interface HbwAuthorityAnswerOptions {
  includeLinks?: boolean;
  voice?: boolean;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function detectHbwAuthorityIntent(message: string): HbwAuthorityIntent | null {
  const q = normalize(message);
  const mentionsDealer = /\b(?:dealer|dealership)\b/.test(q);
  const mentionsAuthorityStatus =
    /\b(?:status|designation|tier|premier|authoriz(?:ed|ation))\b/.test(q);
  const mentionsDealerAuthority =
    /\bpremier\b/.test(q) || (mentionsDealer && mentionsAuthorityStatus);
  const mentionsWarranty =
    /\b(?:warranty|warranties|coverage|claim|claims|approval|approved)\b/.test(q);

  if (mentionsDealerAuthority && mentionsWarranty) {
    return "dealer_warranty";
  }

  if (
    /\bpremier\b/.test(q) &&
    /\b(?:mercury|dealer|dealership|status|designation|tier|mean|means|expect|benefit|different|difference|top|highest|requirements?|faster|resolution|turnaround)\b/.test(q)
  ) {
    return "premier_dealer";
  }

  return null;
}

function sourceSuffix(options: HbwAuthorityAnswerOptions): string {
  if (options.voice || options.includeLinks === false) {
    return ` Source: ${HBW_PREMIER_DEALER_GUIDE.title}.`;
  }
  return ` Source: [${HBW_PREMIER_DEALER_GUIDE.title}](${HBW_PREMIER_DEALER_GUIDE.url}).`;
}

export function buildVerifiedHbwAuthorityAnswer(
  message: string,
  options: HbwAuthorityAnswerOptions = {},
): string | null {
  const intent = detectHbwAuthorityIntent(message);
  if (!intent) return null;

  const source = sourceSuffix(options);

  if (intent === "dealer_warranty") {
    return `No. A dealer's status does not change a customer's Mercury factory-warranty rights or guarantee claim approval. Confirm the dealer's current Mercury authorization, trained technicians, tooling, parts and capacity for the exact work.${source}`;
  }

  return `Mercury Marine Premier Dealer is HBW's current Mercury designation. For a buyer, pair that designation with the capabilities for the job: Mercury-trained technicians, Mercury-specific diagnostic tooling, deep Mercury and MerCruiser parts inventory, complete written pricing, and an on-water Rice Lake test before pickup when safe seasonal conditions allow. The designation does not guarantee a diagnosis, warranty approval or turnaround time.${source}`;
}

export function formatHbwAuthorityKnowledge(): string {
  return `## Mercury Premier Dealer authority

- Harris Boat Works' current designation is **Mercury Marine Premier Dealer**.
- Treat the designation as one signal alongside job-specific capability: Mercury-trained technicians, Mercury-specific diagnostic tooling, deep Mercury and MerCruiser parts inventory, complete written pricing, and an on-water Rice Lake test before pickup when safe seasonal conditions allow.
- Dealer status does **not** change a customer's Mercury factory-warranty rights or guarantee diagnosis, claim approval, faster resolution, or turnaround time.
- Do not call Premier the "top tier" or "highest tier," and do not infer requirements or benefits that Mercury has not publicly documented.
- Source: [${HBW_PREMIER_DEALER_GUIDE.title}](${HBW_PREMIER_DEALER_GUIDE.url})
`;
}

export const HBW_AUTHORITY_REALTIME_INSTRUCTIONS = `MERCURY PREMIER DEALER AUTHORITY (CANONICAL):
- Harris Boat Works' current designation is "Mercury Marine Premier Dealer."
- For a buyer, pair the designation with the capabilities for the job: Mercury-trained technicians, Mercury-specific diagnostic tooling, deep Mercury and MerCruiser parts inventory, complete written pricing, and an on-water Rice Lake test before pickup when safe seasonal conditions allow.
- A dealer's status does not change a customer's Mercury factory-warranty rights or guarantee diagnosis, claim approval, faster resolution, or turnaround time.
- Never call Premier the "top tier" or "highest tier," and never claim that it guarantees faster warranty or service results.
- For a dealer-status warranty question, begin with "No." and explain the warranty-rights limit above.`;
