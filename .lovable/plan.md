

## Current State

Your analytics system already tracks a lot, but the **quote funnel has gaps** that hide where people are getting stuck.

### What's tracked today (quote activity events):
- `motor_selected`, `options_configured`, `purchase_path_chosen`, `trade_in_entered`, `financing_calculated`, `quote_abandoned`
- Page views and exit pages (via `usePageViewTracker`)

### What's missing from the funnel:
The quote flow is: Motor → Options → Purchase Path → Boat Info → Trade-In → Installation → Promo Selection → Package Selection → Summary → Submit

But the tracker only fires events for 5 of these 10 steps. **Boat Info completion, Installation completion, Promo Selection, Package Selection, Summary viewed, and Quote Submitted are all invisible** in the funnel data. This means if people are dropping off at the Promo Selection page or the Installation page, you'd never know.

### The weekly report funnel is also incomplete:
It shows: `Visitors → Motor → Options → Trade-In → Financing → Saved`
Missing: Purchase Path, Boat Info, Installation, Promo, Package, Summary steps — and the drop-off percentages between consecutive steps.

## Plan

### 1. Add missing quote step events to `useQuoteActivityTracker.ts`

Add detection for these new event types:
- `boat_info_completed` — fires when boat info is filled
- `installation_configured` — fires when installation config is done  
- `promo_selected` — fires when a promo option is chosen
- `package_selected` — fires when package selection is completed
- `summary_viewed` — fires when user reaches the summary page
- `quote_submitted` — fires when a quote is actually submitted/saved

### 2. Enhance the weekly report funnel with all steps

Update `supabase/functions/weekly-quote-report/index.ts` to:
- Query the new event types alongside existing ones
- Show the full 10-step funnel with drop-off percentages between each consecutive step
- Highlight the **biggest drop-off point** (e.g., "Biggest drop: 62% lost between Options → Purchase Path")
- Add a "Drop-off Hotspots" section showing the top 3 steps where people quit, with counts

### 3. Add `purchase_path_chosen` to the funnel (already tracked but not in the report)

The `purchase_path_chosen` event already exists in the tracker but isn't included in the weekly report funnel — add it.

### Files changed:
- `src/hooks/useQuoteActivityTracker.ts` — add 6 new event detectors
- `supabase/functions/weekly-quote-report/index.ts` — expand funnel to all steps + add drop-off analysis section

