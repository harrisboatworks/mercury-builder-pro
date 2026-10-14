import { getPropellerAllowance } from "./propeller-allowance.ts";
import { resolvePropellerDecision, type PropellerDecision } from "./propeller-selection.ts";

/** Same defaults and explicit ownership choices as the customer configurator. */
export function buildPublicQuotePropeller(input: {
  hp: number;
  customerHasPropeller?: boolean;
  tradeIn?: { brand: string; horsepower: number } | null;
}): { decision: PropellerDecision | "included"; handoffCustomerHasPropeller?: boolean; item: { name: string; price: number; description: string } } {
  const decision = resolvePropellerDecision({
    hp: input.hp,
    installConfig: input.customerHasPropeller === undefined ? undefined : {
      propellerDecision: input.customerHasPropeller ? "reuse_existing" : "include_allowance",
    },
    tradeInInfo: input.tradeIn ? { ...input.tradeIn, hasTradeIn: true } : null,
  });
  const allowance = getPropellerAllowance(input.hp);
  return { decision: allowance ? decision : "included", handoffCustomerHasPropeller: allowance ? decision === "reuse_existing" : undefined, item: !allowance
    ? { name: "Standard Propeller", price: 0, description: "Included with motor" }
    : decision === "reuse_existing"
    ? { name: "Propeller: Use Existing", price: 0, description: "Your propeller will be checked for fit and performance during water testing. Additional cost applies only if a different propeller is required." }
    : allowance };
}
