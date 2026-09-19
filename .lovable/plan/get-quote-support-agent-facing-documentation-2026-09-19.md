# GET quote support + agent-facing documentation

Two changes: a GET path on the existing public quote API that reuses the exact same pricing code as POST, and matching documentation everywhere the API is described.

## Why I am pausing first

Two house rules apply here:

1. The work spans more than five files (edge function, agents page, prerendered static HTML, llms.txt, mcp.json, plus tests).
2. The static/noscript HTML and FAQ JSON-LD for /agents are not in the React page. They live in `scripts/static-prerender.mjs`, which is on the do-not-touch-without-explicit-instruction list. Your request names that output ("make sure it's in the static/noscript HTML and FAQ JSON-LD of /agents"), so I read that as authorisation for the /agents entry in that file only. Please confirm.

## 1. GET support on `supabase/functions/public-quote-api/index.ts`

No second pricing implementation. The GET handler builds the same body object POST builds and calls the existing `listMotors` / `estimateTradeIn` / `buildQuote` functions unchanged.

- GET with no `action`: unchanged self-description JSON (plus new `get_usage` and `errors` blocks).
- GET with `action=build_quote`: flat params `motor_id`, `horsepower`, `family`, `purchase_path`, `customer_has_propeller`, `financing_offer_id`, `boat_make`, `boat_model`, `trade_brand`, `trade_year`, `trade_hp`, `trade_condition`, `trade_engine_type`, `trade_engine_hours`, mapped into the nested `boat_info` / `trade_in` body shape and validated by the same code.
- GET with `action=estimate_trade_in`: `brand`, `year`, `horsepower`, `condition`, `engine_type`, `engine_hours`.
- GET with `action=list_motors`: same filters as POST.
- Any `contact`, `name`, `email`, `phone` param on GET is dropped before the body is built and never logged. Lead capture stays POST-only, and the response says so.
- Rate limiting: the existing bucket lookup moves ahead of the method branch so GET and POST share the same per-IP buckets (build_quote 10/10min fail-closed, estimate_trade_in 30/10min, list_motors 120/10min). GET is not a bypass.
- Response: `text/markdown; charset=utf-8` by default, with motor name and HP, line items, trade-in credit, subtotal / HST / total in CAD, financing offers when present, the standard rules block, a `Generated:` ISO timestamp, and a "Continue this quote" deep link built from the same inputs by the existing `quoteUrl` helper. `format=json` returns the POST JSON minus the lead fields.
- Headers on GET action responses: `Cache-Control: no-store`, `X-Robots-Tag: noindex`, existing CORS.
- Errors keep the POST status codes and JSON bodies even when the success format is markdown.
- Free text (`boat_make`, `boat_model`) is length-capped and passed through the existing `sanitizeAgentNote` style cleaner before being rendered into markdown.

## 2. Documentation

- `src/pages/AgentsHub.tsx`: a "GET quote (for assistants that cannot POST)" section with one full worked example URL using a real motor id pulled from the live catalog, the plain statement that it never captures a lead, and a new "Error responses" section built from the actual code.
- `scripts/static-prerender.mjs` (/agents entry only): the same two sections in the static HTML body, plus two new FAQ JSON-LD entries so GET-only agents reading raw HTML see them.
- Edge function self-description JSON: `get_usage` and `errors` blocks.
- `public/llms.txt` and `public/.well-known/mcp.json`: mention the GET quote form, bump `lastUpdated`. The UCP profile describes checkout, not this endpoint, so I will leave it unless you want it touched.
- All example URLs use `https://www.mercuryrepower.ca`.

## Error shapes I will document (read from the code, not invented)

| Status | Body | Agent action |
|---|---|---|
| 400 | `{"error": "<message>"}`, unknown action adds `available_actions` and `docs_url` | fix the input |
| 404 | `{"error": "Motor not found"}` | re-check the motor id |
| 405 | `{"error": "Method not allowed. Use POST."}` (other verbs) | use GET or POST |
| 422 | `{"error": "<Verado special order / no published price message>"}` | fall back to phone |
| 429 | `{"error": "Too many requests. Please try again in a moment.", "code": "rate_limited"}` with `Retry-After: 600` | back off |
| 500 | `{"error": "<message>"}` | retry once, then deep link or (905) 342-2153 |
| HBW valuation upstream | `{"error", "code", "notes"}` at the upstream status | retry or send to /trade-in-value |

## Checks

`npx tsgo --noEmit`, `npm run typecheck:edge -- supabase/functions/public-quote-api/index.ts`, the agent-surface and schema validation scripts, a local curl of the GET forms against the deployed function, and a desktop/mobile render of /agents.

## Deployment note

Yes, the edge function deploys separately from the frontend. `supabase/functions/public-quote-api` ships through the Supabase functions deploy workflow; the /agents page, llms.txt and mcp.json ship with the Vercel frontend build. Both must land for the docs and the behaviour to agree.

## Not changing

Pricing logic, the quote builder UI, any other page, secrets, tables.
