# Motor valuation architecture

The HBW valuation service is the sole authority for motor trade-in values.

Its preferred public origin is `https://valuation.mercuryrepower.ca`. Newly
generated report links and direct server-to-server requests use that origin.

- Browser requests call `hbw-valuation-proxy`, which adds the private API key and rate limits public traffic.
- `public-quote-api` and `agent-quote-api` call the same HBW service through `_shared/hbw-valuation.ts`.
- Quote builders store and display the canonical response; they do not recalculate it locally.
- Agent `override_value` remains an explicit authorized override and records the canonical value as `originalEstimate` when the service is available. If the service is unavailable, the explicit override remains usable and is marked `manual_override_without_canonical_readback`.
- Missing engine architecture is never silently treated as four-stroke. The HBW model decoder may infer a precise model; otherwise the request fails closed and asks for stroke.

## Consumer routes

| Consumer | Valuation path |
| --- | --- |
| Mercury Repower and HBW site quote forms | Browser → `hbw-valuation-proxy` → shared HBW adapter |
| `public-quote-api` | Server → shared HBW adapter |
| `agent-quote-api` | Server → shared HBW adapter; explicit override rules remain unchanged |
| HBW agents and internal automations | Canonical motor/package API with a server-side `X-API-Key` |
| Standalone public tool | `https://valuation.mercuryrepower.ca/` |
| `/trade-in-value` and `/tools` Trade-In Value Estimator | Shared `TradeInValuation` form → browser `hbw-valuation-proxy` → shared HBW adapter. Continue via `PROMOTE_TRADE_IN` even when the live estimate is unavailable. |
| Voice `estimate_trade_value` and ElevenLabs MCP | Canonical browser/server adapters. Unknown architecture and missing condition request details. Failures produce no numeric estimate or Apply action. |
| Web running total, quote summary, financing, and REST/agent quotes | Shared `applyTradeCredit` / `calculateFinancingPurchase`. Credit is finite, nonnegative, and capped. `hasTradeIn: false` applies no credit. |

Draft `savedAt` is only the draft write time. Valuation freshness uses `valuedAt` when present so later autosaves cannot keep a stale amount indefinitely. Quote records store canonical valuation metadata only; they do not write fabricated brand-penalty audit fields.

The browser never receives the HBW API key. Server-side callers may set
`HBW_VALUATION_URL` for controlled testing; production defaults to the branded
canonical motor endpoint.

## Compatibility aliases

The Vercel deployment hostnames remain accepted application aliases.
`valuation.harrisboatworks.ca` remains in the service's trusted-origin allowlist
for old or staged configurations, but it has no public DNS route and is not a
supported customer URL. New links and integrations must use
`valuation.mercuryrepower.ca`.

The Supabase `trade_valuation_brackets` and `trade_valuation_config` tables are retired compatibility data. They are not queried by runtime code and must not be treated as an authoritative source. They remain in the database for rollback/audit safety until a separately approved destructive migration removes them.
