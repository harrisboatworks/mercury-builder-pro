
## Mercuryrepower.ca AX (Agent Experience) Implementation Plan

Auditing the Perplexity recommendations against the actual codebase, here's what's already done, what's broken, and what to ship.

### Already done ✅
- `/llms.txt` exists at root (good content, but has Verado mention to remove)
- robots.txt allowlists GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Anthropic-AI, Google-Extended, Applebot-Extended, cohere-ai
- `/.well-known/ai.txt` and `/security.txt` exist
- Per-page canonicals exist via Helmet on most SEO components
- FAQPage schema is on `/faq` (just deduped last turn)
- Sitemap + RSS feed published

### P0 bugs to fix now

**1. Wrong phone number on `/finance-calculator`**
- `src/pages/FinanceCalculator.tsx:409-410` shows `(705) 750-1414` linking `tel:+17057501414`
- All 140 other references use `(905) 342-2153`
- **Fix:** Replace with `(905) 342-2153` / `tel:+19053422153`

**2. Wrong canonical on `/repower`**
- `src/components/seo/RepowerPageSEO.tsx:144` points canonical to `https://harrisboatworks.ca/repower` (legacy domain) instead of `https://mercuryrepower.ca/repower`
- **Fix:** Use `${SITE_URL}/repower`

**3. Verado in `/llms.txt`**
- Line 13 lists Verado despite the strict no-Verado memory rule
- **Fix:** Remove Verado line; keep FourStroke, Pro XS, SeaPro, Racing

**4. Missing bot allowlist additions**
- Add `OAI-SearchBot`, `Meta-ExternalAgent`, `Amazonbot` to `public/robots.txt` (ChatGPT-User already present)

### P1: Discovery + Trust Layer

**5. Add `/.well-known/brand.json`**
New file with: brand colors (from index.css tokens), logo URL, tone-of-voice notes ("warm, local, family business since 1947, Mercury dealer since 1965, no hype"), preferred phrasing ("repower" not "engine swap"), Verado exclusion note, geography served, contact info. Lets agents render the brand authentically.

**6. Add `/agents` page (HTML route)**
A public page documenting:
- Available endpoints (motors API below, future MCP server)
- Authoritative source-of-truth rules (CAD pricing, pickup-only, no Verado, no financing under $5k)
- Geography served (Ontario, primary radius 150km from Rice Lake)
- What requires human confirmation (final price, install scheduling, trade-in)
- Contact for agent operators

Add `/agents` route in `src/App.tsx` and a new `src/pages/AgentsHub.tsx`.

### P1: Action Layer — Public motors feed

**7. Create `public-motors-api` edge function** (replaces the "expose `/api/motors.json`" rec)
- Public, no-auth, read-only
- Returns active motor inventory: id, model_display, hp, family, shaft_length, control_type, msrp, sale_price, dealer_price, availability, image, slug, `priceValidUntil` (24h from request), `lastUpdated`
- Uses pricing hierarchy from `motor-selling-price-hierarchy` memory (manual_overrides > sale_price > dealer_price > msrp)
- CORS open
- Cache headers: `Cache-Control: public, max-age=300`
- Response shape:
  ```json
  {
    "site": "mercuryrepower.ca",
    "currency": "CAD",
    "lastUpdated": "2026-04-20T...",
    "priceValidUntil": "2026-04-21T...",
    "count": N,
    "motors": [{...}]
  }
  ```
- Add link in llms.txt: `Public motor feed: https://<project>.supabase.co/functions/v1/public-motors-api`

### P2: Deferred (next iteration, not this turn)

- Generate `.md` twins of top 10 pages → requires SSR/build-time generation; heavier change
- Deep-linkable pre-filled URLs (`/quote?hp=90&shaft=L&...`) → requires QuoteBuilder URL param parsing
- HMAC-signed quote tokens with `priceValidUntil` → ties into deposit/quote PDF system
- Full MCP server (`motor.search`, `motor.get`, `quote.build`) → larger architectural lift
- Last-updated timestamps on promos/inventory UI surfaces
- Product+Offer JSON-LD per individual `/motors/{slug}` page

These are valuable but scope-heavy. Ship the P0+P1 wave first, then I'll plan P2 separately.

### Files to change/create this turn

**Edits:**
- `src/pages/FinanceCalculator.tsx` — phone fix
- `src/components/seo/RepowerPageSEO.tsx` — canonical fix
- `public/llms.txt` — remove Verado, add motors API endpoint
- `public/robots.txt` — add OAI-SearchBot, Meta-ExternalAgent, Amazonbot
- `src/App.tsx` — register `/agents` route

**New:**
- `public/.well-known/brand.json`
- `src/pages/AgentsHub.tsx`
- `supabase/functions/public-motors-api/index.ts`
- `supabase/functions/public-motors-api/cors.ts` (or inline)

### After deploy — verification checklist
1. Visit `/finance-calculator`, confirm phone is 905-342-2153
2. View source on `/repower`, confirm canonical = mercuryrepower.ca
3. `curl https://mercuryrepower.ca/llms.txt` — no Verado
4. `curl https://mercuryrepower.ca/.well-known/brand.json` — returns JSON
5. `curl <project>.supabase.co/functions/v1/public-motors-api` — returns motor array with CAD pricing
6. Visit `/agents` — page renders
7. Re-submit fixed pages in Google Search Console for re-validation

### Open question

The public motors API needs a stable host. Two options:
- **A:** Edge function URL (`*.supabase.co/functions/v1/public-motors-api`) — works today, ugly URL
- **B:** Map to `mercuryrepower.ca/api/motors.json` via a redirect/proxy — requires SPA route or hosting-level rewrite, harder on Lovable hosting

I'll go with **A** and document the URL in `/llms.txt` and `/agents`. If you later add custom hosting rewrites, we can alias it. Ack?
