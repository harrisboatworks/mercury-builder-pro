# Unify Trade-In Valuation on HBW API

All three calculators (frontend, standalone, public-quote-api) will return identical values by routing through one HBW proxy. API key stays server-side. Model code (e.g. `90 ELPT`) passes through.

## Why three values today

- **Frontend $7,050** — `src/components/quote-builder/TradeInValuation.tsx` calls `fetchHBWValuation()` in `src/lib/trade-valuation.ts:683`. It tries the HBW API but **hardcodes the key in browser code** (line 700). On any failure it silently falls back to local MSRP-anchored math (`estimateTradeValue`) — which is almost certainly what's producing $7,050 vs the canonical $6,400.
- **Standalone $6,400** — direct hit on `hbw-valuation-hbw.vercel.app/api/motor-valuation`. Source of truth.
- **public-quote-api $2,189** — `ballparkTradeValue()` at `supabase/functions/public-quote-api/index.ts:206`, a crude `hp × $40 × age × condition` formula with no MSRP awareness.

## Changes

### 1. Add secret (you handle this)
You're rotating the key and adding `HBW_API_KEY` to Supabase secrets + Vercel env. I won't deploy code that depends on it until you confirm it's set.

### 2. New edge function `supabase/functions/hbw-valuation-proxy/index.ts`
- Public, `verify_jwt = false`, full CORS (incl. `x-session-id`).
- Zod-validated body: `brand`, `year`, `hp`, `condition` required; `stroke`, `hours`, `model` optional. `stroke` enum: `4-stroke | 2-stroke | proxs | optimax | etec`.
- POSTs to HBW with `X-API-Key: Deno.env.get('HBW_API_KEY')`, 8s timeout.
- Returns upstream JSON unchanged on 200; normalized error body on failure.
- Also added to `supabase/config.toml`.

### 3. Update `src/lib/trade-valuation.ts` → `fetchHBWValuation()`
- Replace direct fetch + hardcoded key with `supabase.functions.invoke('hbw-valuation-proxy', { body: {...} })`.
- Same `HBWValuationResult` return shape — no changes needed in `TradeInValuation.tsx`.
- `model` already passed through; verified the call site sends it.
- Returns `null` on failure → local fallback still acts as last-resort safety net.

### 4. Update `supabase/functions/public-quote-api/index.ts` → `estimateTradeIn`
- Replace `ballparkTradeValue()` call with a direct edge-to-edge fetch to HBW (no need to round-trip through the proxy).
- Accept new optional `model` field in the request body and forward it.
- Map `engine_type` → `stroke`: pass through `2-stroke | optimax | etec | proxs`, otherwise default `4-stroke`.
- Response includes `low`, `high`, `average` (wholesale), `listing`, `hst_savings`, `confidence`, `market_demand`, `seasonal`, `factors`.
- On HBW failure return **502** with a clear error — do NOT silently fall back to bad ballpark math. Agents need to know the valuation is unavailable rather than quote the wrong number.
- `ballparkTradeValue()` function stays in the file (still used by `build_quote`, which you said not to touch).
- Update the action's docs block to reflect the new `model` parameter.

### 5. Verification (after deploy)
- Curl the proxy with Mercury 2022 90hp 4-stroke good → expect ~$6,400 range.
- Frontend trade-in page → same number as standalone tool.
- Curl `public-quote-api` `estimate_trade_in` with same payload → matching numbers, plus listing/HST fields.

## Out of scope (per your instructions)
- `build_quote` action still uses local `ballparkTradeValue` — flagged for a future follow-up if you want.
- `agent-mcp-server`, `ai-chatbot-stream`, `process-email-sequence` reference ballpark logic; not changed.

## Confirm before I implement
After approval I'll execute the four code changes above. Please make sure `HBW_API_KEY` is set in Supabase secrets before testing — I'll remind you in the implementation message.
