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
