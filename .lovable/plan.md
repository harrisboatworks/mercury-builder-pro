# Consent-gated analytics and expired-promotion safeguards

## Scope
Implement only the three requested changes. No deployment, campaign sends, production writes, pricing-source changes, dependency changes or generated-output edits.

## 1. GA4 consent gating
- Remove the unconditional GA4 loader and configuration from `index.html`, retaining a denied Consent Mode v2 default.
- Load/configure GA4 once, only after Accept or a stored accepted choice, through `src/lib/analytics.ts` and the existing consent banner.
- Gate analytics events and dataLayer event mirrors on accepted consent. Discard events before a choice or after Decline rather than replaying them later.
- Preserve the existing consent-gated Google Ads conversions, empty-label behaviour and deduplication. Keep the banner appearance unchanged.

## 2. Disable the expired GET7 campaign
- Disable sends in `supabase/functions/send-get7-campaign/index.ts` after the existing administrator check, before recipient lookup or any email/SMS action, including test mode.
- Return a clear campaign-disabled response. This avoids advertising the expired March offer or relabelling a different promotion as GET7.
- Do not change any database promotion record or send a test campaign.

## 3. Agent financing expiry guard
- Update `supabase/functions/agent-quote-api/index.ts` so special financing is used only when the relevant live promotion contains an eligible special-financing option within its start/end dates.
- Reuse the existing America/Toronto date rules, including the whole last day.
- When no special-financing promotion is active, calculate financing using the canonical standard tiers, not the hard-coded promotional default or a client-provided promotional rate.
- Preserve the financing minimum and other quote calculations. Leave rate source values unchanged.

## Technical scope and tests
Expected implementation paths: `index.html`, `src/lib/analytics.ts`, `src/components/analytics/ConsentBanner.tsx`, the two named Edge entry points, and focused tests. Add a small shared financing helper only if necessary to consume the canonical policy safely from Edge code; document any structural choice in `AGENTS.md`.

Tests will cover no analytics loader/events before a choice or after Decline, accepted returning visitors, one-time GA4 loading, preserved Ads conversion behaviour, disabled campaign email/SMS/test paths, active versus expired/future special financing, the Toronto midnight boundary, and standard-tier fallback.

Run focused tests, the README frontend validation and scoped Edge typechecks. Verify consent behaviour in the local browser without sending leads or campaigns. Report exact changed files, available automatic commit SHA, results and any checks blocked by deployment being prohibited.

## Approval boundary
This plan is surfaced before implementation because the requested work touches pricing logic, protected Edge functions and more than five files under the project rules.
