export const MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES = [
  { label: "2.5-14.9 HP", hpMin: 2.5, hpMax: 14.9, prices: [76, 137, 194, 247, 293] },
  { label: "15-39.9 HP", hpMin: 15, hpMax: 39.9, prices: [178, 319, 454, 576, 684] },
  { label: "40-74.9 HP", hpMin: 40, hpMax: 74.9, prices: [355, 639, 904, 1149, 1365] },
  { label: "75-149.9 HP", hpMin: 75, hpMax: 149.9, prices: [539, 971, 1376, 1748, 2077] },
  { label: "150-199.9 HP", hpMin: 150, hpMax: 199.9, prices: [753, 1357, 1921, 2442, 2900] },
  { label: "200-299.9 HP", hpMin: 200, hpMax: 299.9, prices: [1809, 3256, 4612, 5861, 6964] },
  { label: "300-399.9 HP", hpMin: 300, hpMax: 399.9, prices: [2580, 4644, 6579, 8358, 9932] },
  { label: "400 HP", hpMin: 400, hpMax: 400, prices: [3593, 6468, 9162, 11642, 13833] },
  { label: "425 HP", hpMin: 425, hpMax: 425, prices: [3760, 6770, 9589, 12183, 14478] },
  { label: "500 HP", hpMin: 500, hpMax: 500, prices: [4870, 8766, 12417, 15777, 18748] },
  { label: "600 HP", hpMin: 600, hpMax: 600, prices: [5836, 10504, 14881, 18908, 22469] },
] as const;

export function formatMercuryProductProtectionRateCard(): string {
  const rows = MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES.map((band) =>
    `| ${band.label} | ${band.prices.map((price) => `$${price.toLocaleString("en-CA")}`).join(" | ")} |`
  ).join("\n");

  return `| HP Range | 1 Year | 2 Years | 3 Years | 4 Years | 5 Years |
|----------|--------|---------|---------|---------|---------|
${rows}`;
}

function formatCad(value: number): string {
  return `$${value.toLocaleString("en-CA")}`;
}

export function buildMercuryProductProtectionCustomerAnswer(question: string): string | null {
  const asksAboutProductProtection = /\b(product protection|platinum(?: product protection)?(?: plan)?|extended warranty|extended service contract|protection plan)\b/i.test(question);
  if (!asksAboutProductProtection) return null;

  const hpMatch = question.match(/\b(\d+(?:\.\d+)?)\s*(?:hp|horsepower)\b/i);
  if (!hpMatch) return null;

  const hp = Number(hpMatch[1]);
  const band = MERCURY_PLATINUM_PRODUCT_PROTECTION_RATES.find(
    (candidate) => hp >= candidate.hpMin && hp <= candidate.hpMax,
  );
  if (!band) {
    return `I couldn't verify a published Mercury Platinum Product Protection rate for a ${hp} HP motor, so I won't guess. See [the current Canadian rate card](/mercury-product-protection) or call (905) 342-2153 for a serial-number-confirmed price.`;
  }

  const yearMatch = question.match(/\b(\d+)\s*[- ]?year\b/i);
  const requestedYears = yearMatch ? Number(yearMatch[1]) : null;
  if (requestedYears !== null && (requestedYears < 1 || requestedYears > 5)) {
    return `Mercury Platinum Product Protection is sold in purchased plan terms from one to five years. Combined coverage, including the applicable Mercury limited warranty and any active promotion, cannot exceed eight years. See [the current Canadian rate card](/mercury-product-protection) or call (905) 342-2153 so we can confirm the right term by serial number.`;
  }

  const qualification = "Product Protection is an extended service contract, not an extension of the standard product warranty. Final eligibility and current coverage are confirmed by serial number.";
  if (requestedYears !== null) {
    const price = band.prices[requestedYears - 1];
    return `A ${requestedYears}-year Mercury Platinum Product Protection plan for a ${hp} HP motor is ${formatCad(price)} CAD before HST. That is the published price for the purchased ${requestedYears}-year plan, not a yearly installment. ${qualification} [View all current Canadian rates](/mercury-product-protection).`;
  }

  const options = band.prices
    .map((price, index) => `${index + 1} year${index === 0 ? "" : "s"}: ${formatCad(price)}`)
    .join("; ");
  return `For a ${hp} HP motor, current Mercury Platinum Product Protection prices are ${options} CAD before HST. Each amount is the full published price for that purchased plan term. ${qualification} [View all current Canadian rates](/mercury-product-protection).`;
}
