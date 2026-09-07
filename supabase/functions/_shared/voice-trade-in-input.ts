import { normalizeHbwStroke } from "./hbw-valuation-response.ts";

export type CanonicalVoiceCondition = "excellent" | "good" | "fair" | "poor";

export function mapVoiceTradeCondition(
  condition?: string,
): CanonicalVoiceCondition | null {
  if (typeof condition !== "string" || !condition.trim()) return null;
  const normalized = condition.trim().toLowerCase();
  if (normalized === "rough") return "poor";
  if (
    normalized === "excellent" ||
    normalized === "good" ||
    normalized === "fair" ||
    normalized === "poor"
  ) {
    return normalized;
  }
  return null;
}

export function resolveVoiceArchitecture(params: {
  engine_type?: string;
  model?: string;
}): string | null {
  if (params.engine_type && typeof params.engine_type !== "string") return null;
  if (params.engine_type && params.engine_type.trim()) {
    try {
      return normalizeHbwStroke(params.engine_type) ?? null;
    } catch {
      return null;
    }
  }

  const model = (params.model || "").toLowerCase();
  if (/\boptimax\b/.test(model)) return "optimax";
  if (/\betec\b/.test(model) || /\be-tec\b/.test(model)) return "etec";
  if (/\bpro\s*xs\b/.test(model) || /\bproxs\b/.test(model)) return "proxs";
  if (/\b(?:4|four)[\s-]*stroke\b/.test(model)) return "4-stroke";
  if (/\b(?:2|two)[\s-]*stroke\b/.test(model)) return "2-stroke";
  return null;
}
