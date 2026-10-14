import { PUBLIC_SITE_URL } from "./public-motor-contract.ts";

export type AgentQuoteSurface = "agent_rest" | "agent_mcp" | "agent_ucp";

/** Public, non-identifying provenance. Never a consent or payment authority. */
export function buildAgentQuoteLink(
  motorId: string | undefined,
  fields: Record<string, string | number | boolean | null | undefined> = {},
  surface: AgentQuoteSurface = "agent_rest",
): string {
  const url = new URL("/quote/motor-selection", PUBLIC_SITE_URL);
  if (motorId) url.searchParams.set("motor", motorId);
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }
  url.searchParams.set("src", surface);
  return url.toString();
}

/** Only relabel an upstream link on our own quote route. Preserve errors verbatim. */
export function attributeMcpQuotePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  const record = payload as Record<string, unknown>;
  if (typeof record.deep_link !== "string") return payload;
  try {
    const url = new URL(record.deep_link);
    if (url.origin !== new URL(PUBLIC_SITE_URL).origin || url.pathname !== "/quote/motor-selection") return payload;
    url.searchParams.set("src", "agent_mcp");
    return { ...record, deep_link: url.toString() };
  } catch {
    return payload;
  }
}
