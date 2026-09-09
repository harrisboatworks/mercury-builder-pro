function finiteHorsepower(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Unique finite horsepowers nearest a requested HP, excluding missing ratings. */
export function nearbyAvailableHorsepowers(
  horsepowers: ReadonlyArray<unknown>,
  detectedHP: number,
  maxDelta = 15,
  limit = 4,
): number[] {
  const availableHPs = [...new Set(
    horsepowers
      .map(finiteHorsepower)
      .filter((hp): hp is number => hp !== null),
  )].sort((a, b) => a - b);

  return availableHPs
    .filter((hp) => Math.abs(hp - detectedHP) <= maxDelta)
    .slice(0, limit);
}
