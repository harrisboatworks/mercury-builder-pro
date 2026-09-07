// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const cardSource = readFileSync(
  new URL("./MotorCardPreview.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../pages/quote/MotorSelectionPage.tsx", import.meta.url),
  "utf8",
);

describe("motor-card financing wiring", () => {
  it("uses the policy estimate helper and cannot restore the old straight-line formula", () => {
    expect(cardSource).toContain(
      "calculateMotorFinancingEstimate(price, sharedData?.financingRate ?? null)",
    );
    expect(cardSource).not.toMatch(/\+\s*299/);
    expect(cardSource).not.toMatch(/totalFinanced\s*\/\s*term/);
  });

  it("shares a validated disclosed APR and removes the dead page-local payment map", () => {
    expect(pageSource).toContain("financingRate,");
    expect(pageSource).toContain("Number.isFinite(financingPromo.rate)");
    expect(pageSource).toContain("isMercuryPromoActive()");
    expect(pageSource).toContain("formatFinancingRate(financingRate)");
    expect(pageSource).toContain("formatFinancingRate(MERCURY_PROMO_APR)");
    expect(pageSource).not.toContain("const monthlyPayments");
  });

  it("discloses the policy fee and lender term limits", () => {
    expect(pageSource).toContain("${DEALERPLAN_FEE} DealerPlan fee");
    expect(pageSource).toContain("FINANCING_CONTRACT_TERM_MONTHS");
    expect(pageSource).toContain("FINANCING_MAXIMUM_AMORTIZATION_MONTHS");
    expect(pageSource).toContain("OAC.");
  });
});
