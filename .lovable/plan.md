## Six-item code-review fix plan

### 1. Premier → Platinum sitewide (BLOCKING for Google Ads)

Findings (via `rg -c "Premier Dealer|Mercury Premier"`):
- 443 hits in `src/data/blogArticles.ts`, 92 in `scripts/static-prerender.mjs`, 83 in `supabase/functions/_shared/blog-index-generated.ts`.
- Meaningful clusters in `src/data/locations*.ts`, `src/data/landing/mercuryLineupLandings.ts`, `src/data/{mandarin,punjabi,urdu,tagalog,spanish,korean,hindi,french}BlogArticles.ts`, all `src/components/seo/Mercury*SEO.tsx` (incl. `MercuryProXS250SEO.tsx`), many `public/blog/mercury-dealer-*-hbw.md` (including the "Canonical anchor" HTML comment), plus `AI-Chatbot-Knowledge-Base.md`, `docs/`, `public/sitemap.xml` note, `public/rss.xml`, `public/motors/*.md`, `src/pages/landing/*`, `public/site.webmanifest`, `src/components/ui/luxury-header.tsx`, `src/components/ui/hamburger-menu.tsx`, `src/components/trust/DealerTrustStrip.tsx`.

Approach:
- Single semantic replacement: `Mercury Premier Dealer` → `Mercury Platinum Dealer`; standalone `Premier Dealer` → `Platinum Dealer`; `Mercury Premier` (when used as tier) → `Mercury Platinum`. Skip false positives (e.g. "premier" as an adjective unrelated to dealer tier — I'll grep first and only touch tier phrases).
- Bulk `sed` across the codebase, then hand-review `src/data/blogArticles.ts` (443 hits) and the language-mirror files in one pass.
- Locate the source of the "Canonical anchor: … Mercury Premier Dealer" HTML comment (currently in `public/blog/mercury-outboard-overheat-high-speed.md` and likely templated by an import/generator script). If it lives in `scripts/import-wave1-drafts.mjs` / `inject-related-guides.mjs` / a shared constant, fix at the source so regenerated files stay correct.
- Regenerate derived artifacts: `supabase/functions/_shared/blog-index-generated.ts` (produced by `scripts/generate-blog-index.ts`) — after edits, re-run its generator so the derived file matches source.

### 2. Price consistency on `/mercury/*` landing pages (BLOCKING)

Root cause on `/mercury/pro-xs-250` (`src/pages/landing/MercuryProXS250.tsx` + `src/components/seo/MercuryProXS250SEO.tsx`): the SEO component's title/description/OG hardcode `$34,848` (the cheapest ELPT variant), while the visible price and JSON-LD Offer schema iterate `PRO_XS_250_VARIANTS` from source-of-truth prices. The `$34,848` string is baked into 4 spots in the SEO file plus the intro paragraph in the page.

Fix:
- Derive one `fromPrice = Math.min(...PRO_XS_250_VARIANTS.map(v => v.hbwPrice))` (formatted as CAD) in a single place (export from the variants module).
- Rewrite `<title>`, `<meta name="description">`, `og:title`, `og:description`, `twitter:*` in `MercuryProXS250SEO.tsx` to interpolate `fromPrice`. Same for the intro paragraph in `MercuryProXS250.tsx`.
- Apply the same audit + fix to `Mercury115ProXS.tsx` + `Mercury115ProXSSEO` (if a dedicated SEO file exists — otherwise it uses `MercuryLineupLandingSEO`) and `Mercury150HP.tsx`. Read each, find hardcoded `$X,XXX` in meta/title, replace with derived min-price from the same variant array driving the schema.
- No pricing VALUES change — only text sources unify.

### 3. `/api/agents/*` proxy

Current state: `public/motors/*.md` and `public/catalog.md` were rewritten by `scripts/rewrite-agent-urls.mjs` to `https://www.mercuryrepower.ca/api/agents/{quote,motors,pricing,promotions,inventory}`, but no `rewrites` block exists in `vercel.json` and no `api/agents/*.ts` handlers exist. Requests 404 / return empty.

Fix (Vercel `rewrites`):
```json
"rewrites": [
  { "source": "/api/agents/quote/:path*",      "destination": "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-quote-api/:path*" },
  { "source": "/api/agents/quote",             "destination": "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-quote-api" },
  { "source": "/api/agents/motors/:path*",     "destination": "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api/:path*" },
  ... same for pricing / promotions / inventory / mcp
]
```
- Verify which `public-*-api` functions actually exist (`ls supabase/functions | grep -E 'public-|agent-'`). Only wire up those that exist; note gaps in reply.
- Post-deploy verification is user-side (this environment doesn't deploy).

### 4. Harden `submit-quote-lead` edge function

- Add honeypot: extend Zod schema with an optional `website` (or `company_website`) string; if non-empty, return `{ success: true, quoteId: null }` (200) without inserting. Frontend never sets it.
- Rate limit via existing `_shared/rate-limit.ts` (`checkRateLimit` + `rateLimitedResponse`), buckets: `submit-quote-lead:ip:<ip>` and `submit-quote-lead:email:<lowercased>`, both 5/hour. Extract IP from `x-forwarded-for`. Return 429 with `rateLimitedResponse` on breach.
- Preserve anonymous flow: no change to `anonymous_session_id` handling.

### 5. Fix `PageTransition` at the root

`src/components/ui/page-transition.tsx` uses framer-motion `variants` with `opacity: 0 → 1`; on some browsers the promise from `animate` never resolves, stranding at `opacity: 0`.

Fix:
- Use `initial={{ opacity: 0, y: 20 }}` + `animate={{ opacity: 1, y: 0 }}` (object form, not variant names) so framer's own completion state is deterministic, and add `style={{ opacity: 1 }}` as the resting fallback — framer's inline style overrides during animation but the DOM defaults back to 1 if animation is cancelled.
- Also handle `useReducedMotion()` explicitly and skip opacity when reduced.
- Add `onAnimationComplete` that force-sets opacity to 1 via ref as a final safety net.
- Revert `src/pages/quote/SchedulePage.tsx` to wrap in `<PageTransition>` and drop the inline `style={{ opacity: 1 }}` workarounds.

### 6. Generator for `public/motors/*.md`

- Create `scripts/generate-motor-markdown.mjs` reading canonical motor data (already produced by `generate-canonical-pricing.mjs` — reuse its output JSON) and a single template string.
- Emit both filename schemes currently on disk (e.g. `fourstroke-20hp-20-eh-fourstroke.md` AND `fs-20-eh.md`) so no URL breaks. Build the alias table from the current directory listing so nothing is lost; commit it as a constant in the script.
- Delete old checked-in `.md` files and let the script regenerate on prebuild.
- Wire into `package.json` prebuild AFTER `generate:canonical-pricing` and BEFORE `rewrite:agent-urls` (so rewrites still apply if the template ever regresses).

### Order of execution

1 & 2 first (ship-blocking), then 5 (small, isolated), then 4, then 3 (needs vercel.json), then 6 (largest refactor).

### Technical notes

- Item 1's `_shared/blog-index-generated.ts` is derived from `scripts/generate-blog-index.ts` — I'll re-run that instead of hand-editing the derived file.
- Item 3: I cannot verify live proxy responses from this sandbox; verification is post-deploy. I'll note this in the reply.
- Item 4: existing `check_rate_limit` RPC is already used by `capture-chat-lead` with a `5 per hour` shape — I'll mirror that call pattern.
- Item 6: preserving both filename schemes is non-negotiable — script will read the current filesystem to build the alias map on first run, then that map is committed.
