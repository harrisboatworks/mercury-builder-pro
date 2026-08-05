# Motor valuation architecture

The HBW valuation service is the sole authority for motor trade-in values.

- Browser requests call `hbw-valuation-proxy`, which adds the private API key and rate limits public traffic.
- `public-quote-api` and `agent-quote-api` call the same HBW service through `_shared/hbw-valuation.ts`.
- Quote builders store and display the canonical response; they do not recalculate it locally.
- Agent `override_value` remains an explicit authorized override and records the canonical value as `originalEstimate` when the service is available. If the service is unavailable, the explicit override remains usable and is marked `manual_override_without_canonical_readback`.
- Missing engine architecture is never silently treated as four-stroke. The HBW model decoder may infer a precise model; otherwise the request fails closed and asks for stroke.

The Supabase `trade_valuation_brackets` and `trade_valuation_config` tables are retired compatibility data. They are not queried by runtime code and must not be treated as an authoritative source. They remain in the database for rollback/audit safety until a separately approved destructive migration removes them.
