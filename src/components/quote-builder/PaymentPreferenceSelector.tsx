// Utility function for HP-based deposit calculation
// Deposit tiers: 0-25HP=$200, 30-115HP=$500, 150HP+=$1000

export const getRecommendedDeposit = (hp: number): number => {
  if (hp <= 25) return 200;
  if (hp <= 115) return 500;
  return 1000; // 150HP+
};
