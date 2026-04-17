

# Mercury Repower — Top 5 Sprint Plan

## What I confirmed by reading the code

Before planning, I traced each fix back to the source. Two findings change the shape of the work:

**1. The resume-email funnel has THREE separate problems, not one.**

| Problem | Root cause | Status |
|---|---|---|
| Day-0 "Your quote is saved" email | `send-saved-quote-email` sends from `quotes@hbwsales.ca`, NOT the verified `mercuryrepower.ca` domain. Likely a Gmail spam/SPF mismatch. | Triggered on save, deliverability suspect |
| Day-2/5/9 follow-up sequence | `start-abandoned-quote-sequence` queries columns `customer_email` and `customer_name` — these **do not exist** on `saved_quotes` (the columns are `email`, with no name field). Function errors out, zero quotes ever enter the sequence. | Broken at the column level |
| Cron schedule | No `cron.schedule(…)` migration exists for `start-abandoned-quote-sequence`. The function is never invoked. | Never runs |

So 657 saved quotes with 0.02 access count is explained by: (a) day-0 email lands in spam from wrong domain, (b) follow-up sequence is dead code that never ran, (c) even if it ran, it would error. That matches the audit data exactly.

**2. The homepage is not a motor catalog.** `src/pages/Index.tsx` is actually a "Welcome back / resume your quote" landing page that redirects users with in-progress quotes into the configurator, and shows nothing useful for a first-time visitor. Audit observation was right (wrong front door), but the rewrite is greenfield rather than a rewrite of an existing catalog. The motor grid lives at `/quote/motor-selection`. Moving content to `/motors` is unnecessary — the routing is already correct.

## The 5 fixes, in build order

### Fix 1 — Repair the resume-quote email funnel (highest ROI)

Three sub-fixes, all required for the funnel to actually work:

**1a. Fix the day-0 email sender domain**
- Change `from` in `send-saved-quote-email` from `quotes@hbwsales.ca` to `quotes@mercuryrepower.ca` (or the verified subdomain). Audit deliverability via `email_send_log` after deploy.

**1b. Fix the abandoned-quote sequence column mismatch**
- Update `start-abandoned-quote-sequence/index.ts` to read from `email` (not `customer_email`) and pull customer name from `quote_state` JSON (not the non-existent `customer_name` column).
- Skip rows where `email` is empty or where the row already has a deposit.

**1c. Schedule the cron**
- Add migration scheduling `start-abandoned-quote-sequence` to run daily at 14:00 UTC (10 AM ET — same window as existing promo-notifications cron).

**Acceptance:** A test saved quote 25 hours old enters `email_sequence_queue` on the next cron run; the existing `process-email-sequence` function (already wired up in the codebase) sends the Day-2/5/9 emails.

### Fix 2 — Homepage rewrite (full landing page)

Per your "Full landing page" choice. Replace the "Welcome back" page at `/` with a proper landing page. Routing already supports this — `/quote/motor-selection` is the configurator, no need to move it.

**Above the fold:**
- H1: **"Real Mercury Repower Prices. No Forms. No Games."**
- Subhead: *Build your live quote in under 3 minutes. Mercury Platinum Dealer on Rice Lake, family-owned since 1947.*
- Primary CTA: **Build Your Quote** → `/quote/motor-selection`
- Secondary: **See Saved Quotes** (only if logged in)
- Trust row: Mercury Platinum badge · Family-owned since 1947 · 905-342-2153 · Google rating

**Below the fold:**
- "How it works" — 3 cards: Pick your motor → Configure trade-in & financing → Lock with refundable deposit
- "Why repower?" — short pitch tied to your repower infographic at `/repower-assets/hbw-repower-infographic.png`
- 3 testimonial cards (real Google reviews, rounded "4.6")
- Final CTA band

**Resume-quote behavior:** if the user has an in-progress quote in QuoteContext, show a small banner at the top ("Resume your quote — 60% complete") instead of taking over the page.

### Fix 3 — Sticky transparent-pricing ribbon (site-wide)

A thin top bar on every page (above the header):

> **Live Mercury pricing. No "call for quote." Build yours in 3 minutes →**

Dismissible (sets `localStorage.dismissed_pricing_ribbon = true`), reappears on next visit. Visible on mobile and desktop.

### Fix 4 — Trust copy correction (per your answer: both are correct)

Audit copy across the site to use accurate phrasing:
- **"Family-owned since 1947"** for the dealership history
- **"Mercury dealer since 1965"** where Mercury-specific history is mentioned
- Round the displayed Google rating from `4.6294` → `4.6` in `GoogleRatingBadge` (currently shows the raw number)
- Files to touch: `Index.tsx` (new), `About.tsx`, `GoogleRatingBadge.tsx`, all SEO meta description strings (`*SEO.tsx` files), email template footers

### Fix 5 — FAQ rebuild + meta tag rewrite

**FAQ content:** `/faq` has 310 impressions, position 42, 0 clicks because the page has no actual Q&A content. `FAQPageSEO` is already wired up. We populate `src/data/faqData.ts` (per memory note) with 15-20 real Q&As covering: repower timing, what's included, cost range, Mercury vs other brands, trade-in basics, financing minimums, shaft length, lead times, commissioning, warranty (3-year standard with promo bonuses), pickup-only policy, deposit refundability. Render them visibly on `/faq` and confirm `FAQPage` JSON-LD includes all entries.

**Meta tag rewrites** (target: CTR > 3% on position 4-10 queries):
- `/` (HomepageSEO): "Mercury Repower Quotes Online — Real Prices, No Forms | Harris Boat Works" / "Build a real Mercury outboard quote in 3 minutes. Live CAD pricing, financing, trade-in. Mercury Platinum Dealer on Rice Lake since 1947."
- `/blog/mercury-75-vs-90-vs-115-comparison`: lead with "Real prices" and "Compare Mercury 75/90/115"
- `/blog/best-mercury-outboard-pontoon-boats`: lead with the HP recommendation and "live pricing"

## What I'm NOT doing in this sprint (and why)

- **Mobile performance overhaul** — real (6.2s load) but multi-day; lower ROI than fixing the dead resume-email funnel
- **/trade-in-value rebuild** — redirect to `/quote/trade-in` for now
- **5-email nurture sequence beyond what `process-email-sequence` already does** — fix the trigger first, then evaluate
- **GA4 wiring + UTM tagging** — instrumentation matters but is non-blocking
- **Blog → configurator deep-links** — easy, but waits for homepage/FAQ to compound

## Files changed (estimate)

| Layer | Files |
|---|---|
| Edge functions | `send-saved-quote-email/index.ts` (sender), `start-abandoned-quote-sequence/index.ts` (column fix) |
| Migration | 1 new migration: schedule `start-abandoned-quote-sequence` cron daily |
| Pages | `src/pages/Index.tsx` (full rewrite), `src/pages/Faq.tsx` (render data) |
| Components | New `PricingRibbon.tsx` mounted in `App.tsx`; `GoogleRatingBadge.tsx` rounding fix; new homepage sections |
| Data/SEO | `src/data/faqData.ts` (15-20 Q&As); 3 meta tag rewrites in `HomepageSEO`, blog SEO files |
| Trust copy audit | About page, email template footers, SEO description strings |

## Acceptance criteria

- A new saved quote receives the day-0 email from `mercuryrepower.ca`, not `hbwsales.ca`
- The cron job appears in `cron.job` and successfully inserts rows into `email_sequence_queue` on its next run
- `/` renders a landing page with the new hero and CTA, no "Welcome Back" loop for first-time visitors
- Pricing ribbon visible on all pages, dismissible, persists per-browser
- `/faq` shows 15+ visible Q&As, FAQPage schema validates in Google Rich Results Test
- All site instances of "1947" and "1965" reflect the agreed phrasing; rating displays as "4.6"

