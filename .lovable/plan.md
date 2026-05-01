## Goal

Make the global `UnifiedMobileBar` less intrusive on mobile by being route-aware. No new desktop bars, no compare drawer, no spec provenance toggle, no backend/inventory/spec changes.

## Current state (verified)

- `UnifiedMobileBar` is mounted globally in `src/App.tsx` and gates show/hide via two arrays inside `src/components/quote-builder/UnifiedMobileBar.tsx`:
  - `SHOW_ON_PAGES = ['/', '/motors', '/quote', '/financing', '/accessories', '/repower']`
  - `HIDE_ON_PAGES = ['/quote/success', '/login', '/auth', '/dashboard', '/settings', '/admin', '/test', '/staging', '/my-quotes', '/deposits', '/contact']`
- On `/` (homepage) the bar currently renders with the fallback config (label "Continue", target `/quote/summary`) — irrelevant and confusing. There is no `'/' ` entry in `PAGE_CONFIG`.
- On `/motors/:slug` (motor detail) the bar renders immediately on page load, overlapping the new price/trust card.
- On `/quote/motor-selection` the bar already shows; it currently renders even when no motor is selected and no preview is open (label "Configure"), creating a second visible CTA stack near the top picker.
- Chat/Voice on mobile is **integrated into** the UnifiedMobileBar itself (the standalone `AIChatButton` is desktop-only via `useIsMobileOrTablet`), so the only collision risk is the bar's own height vs sticky page content. Need to ensure spacing.

## Changes (single file: `src/components/quote-builder/UnifiedMobileBar.tsx`)

All edits are scoped to the visibility gate and the motor-detail/motor-selection branches. No styling overhaul.

### 1. Homepage (`/`) — hide the bar entirely

Add `'/'` handling that returns `false` from `shouldShow`. The homepage already has its own prominent "Build Your Quote" hero CTA + trust chips above the fold (just polished in the prior pass). A second floating CTA competes with it and shows an irrelevant "Continue → /quote/summary" fallback.

Implementation: in the `shouldShow` `useMemo`, special-case `location.pathname === '/'` to return `false`. Leave other `SHOW_ON_PAGES` behavior intact.

### 2. Motor detail (`/motors/:slug`) — scroll-gated, compact, contextual

Show the bar only after the user scrolls past the in-page price/CTA card so it never overlaps the trust block. When shown, render a compact variant: motor price + "Build Quote" only (no nudge row, no progress chip).

Implementation:
- Detect motor-detail route: `location.pathname.startsWith('/motors/')`.
- Add a local `useState` + `useEffect` that listens to `window.scrollY > 600` (approx height of hero + price card on 390-wide viewport) to flip a `revealed` flag with a small debounce.
- Until `revealed`, return `null` from the bar's render (or render an empty fragment) for this route.
- When revealed: render an existing compact branch — title = motor model from a lightweight URL-derived fallback or skip if no `state.motor`; label = "Build Quote"; nextPath = `/quote/motor-selection`. Suppress the nudge row and comparison strip on this route to keep it small and reviewable.
- Bottom padding: keep `pb-[env(safe-area-inset-bottom)]` (already set on inner sticky containers) so it sits above iOS home indicator. Chat is in-bar on mobile so no collision.

### 3. Motor selection (`/quote/motor-selection`) — only show after a motor is chosen

The selected-motor price bar should only appear once the user has a motor (selected or previewing in the configurator). Right now it renders the "Configure" CTA at all times, which acts as a second CTA bar over the selection grid.

Implementation:
- In `shouldShow`, add: if `pathname === '/quote/motor-selection'` and neither `state.motor` nor `state.previewMotor` is set, return `false`.
- Leave existing logic for the preview/selected states untouched (Configure/Select This Motor/Continue labels still work).
- Confirm no other duplicate bar exists on this page: `MotorSelection.tsx` already had its `MobileStickyCTA` removed in the prior pass; `GlobalStickyQuoteBar` is desktop-only and already excludes all `/quote/*` routes. Verified — no duplicates.

### 4. Chat/Voice non-collision

- Mobile: `AIChatButton` is hidden via `useIsMobileOrTablet`, so the only "chat" affordance on mobile lives inside `UnifiedMobileBar` itself — no overlay collision possible.
- Voice button (`useVoiceSafe`) is also rendered inside the bar; no separate floating element on these routes.
- Action item: when the bar is hidden (homepage, pre-selection on motor-selection, pre-scroll on motor detail), no chat affordance disappears on mobile because the in-bar chat goes with it. To preserve access on those routes, render a **minimal** mobile chat-only pill (just the existing AI button, no nudges, no price) in those states. Reuse the existing `<motion.button>` chat trigger inside the bar by extracting it into a tiny `<MobileChatOnlyPill />` sub-render at the bottom of `UnifiedMobileBar.tsx`. Position: `fixed bottom-4 right-4 z-40`, same look as desktop chat button, mobile-only.

This guarantees: Chat/Voice always reachable on mobile, but never stacked on top of a full bar.

## Files touched

- `src/components/quote-builder/UnifiedMobileBar.tsx` — visibility gate updates + scroll listener for motor-detail + extract a small mobile chat-only pill for hidden-bar states.

No other files modified. No CSS files, no routes, no contexts, no backend, no specs.

## Verification (post-implementation)

Use `browser--navigate_to_sandbox` at 390×844 and `browser--screenshot` for:

1. `/` — confirm no bottom bar; floating chat-only pill bottom-right; hero CTA unobstructed.
2. `/quote/motor-selection` — bar hidden until a motor is tapped/previewed; chat-only pill visible; after selecting, full bar appears with price + Continue.
3. One motor detail page (e.g., `/motors/proxs-150hp-150-elpt-proxs`) — on first paint no bar over the price card; chat-only pill visible; after scrolling ~600px down, compact bar appears with price + "Build Quote".

Report back with the three screenshots and a one-line summary per route.
