export type PropellerDecision = 'include_allowance' | 'reuse_existing';

interface PropellerDecisionInput {
  hp: number;
  installConfig?: { propellerDecision?: PropellerDecision } | null;
  boatInfo?: { hasCompatibleProp?: boolean } | null;
  tradeInInfo?: {
    hasTradeIn?: boolean;
    brand?: string;
    horsepower?: number | string;
  } | null;
}

export function isSameHpMercuryTrade(
  tradeInInfo: PropellerDecisionInput['tradeInInfo'],
  hp: number,
): boolean {
  return Boolean(
    tradeInInfo?.hasTradeIn
      && tradeInInfo.brand?.trim().toLowerCase() === 'mercury'
      && Number(tradeInInfo.horsepower) === Number(hp),
  );
}

/**
 * Resolve one propeller decision for every quote surface.
 *
 * Explicit installation-step choices override the legacy boat-info checkbox
 * and the automatic same-HP Mercury trade-in assumption. Old saved quotes
 * without the new field keep their previous behaviour.
 */
export function resolvePropellerDecision({
  hp,
  installConfig,
  boatInfo,
  tradeInInfo,
}: PropellerDecisionInput): PropellerDecision {
  if (installConfig?.propellerDecision) {
    return installConfig.propellerDecision;
  }

  if (boatInfo?.hasCompatibleProp || isSameHpMercuryTrade(tradeInInfo, hp)) {
    return 'reuse_existing';
  }

  return 'include_allowance';
}
