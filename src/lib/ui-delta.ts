export function computeDelta(prev: number | null | undefined, next: number | null | undefined) {
  if (typeof prev !== "number" || typeof next !== "number") return null;
  const d = Math.round(next - prev);
  return d !== 0 ? d : null;
}