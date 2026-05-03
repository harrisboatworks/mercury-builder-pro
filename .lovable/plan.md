# /repower Header Restyle

Match the mockup's premium dark header on `/repower` only — without touching the shared `LuxuryHeader` used by every other page.

## What changes

1. **Create `src/components/repower/RepowerHeader.tsx`**
   - Fixed-position header, transparent over hero, fades to dark navy `#050E1C/92` with blur after 60px scroll.
   - Left lockup: `harris-logo-white.png` + divider + `mercury-logo.png` (inverted to white) + small "Mercury Repower / Centre · Rice Lake" wordmark in cream + gold (matches mockup's logo-text block).
   - Center: full nav row in cream text — Engines, Promotions, Repower, Trade-In, Financing, About, Blog, FAQ, Contact (collapses to hamburger under `lg`).
   - Right: red "Build Quote" CTA (`#C8102E` → `#9A0C24` hover, uppercase tracked) + Sign In link (or user state) + mobile menu trigger.
   - Reuses existing `HamburgerMenu` for mobile.
   - Typography: Inter Tight for display elements, Inter for nav (already in use via `font-display` / `font-sans` tokens established in Phase 1).

2. **Edit `src/components/repower/RepowerLayout.tsx`**
   - Replace the imported `LuxuryHeader` with the new `RepowerHeader`.
   - Remove the `<style>` injection that was hacking transparency onto the global header (no longer needed).
   - Keep the scroll-state tracking off — the new header owns its own scroll behavior.

3. **No other pages affected.** `LuxuryHeader` continues to render on `/`, `/promotions`, etc.

## Notes on hero offset

`HeroRepower` is already `min-h-screen` with `flex items-center` and heavy top padding (`py-32 md:py-40`), so the fixed header sits cleanly over it without adding a top spacer.

## Files

- create: `src/components/repower/RepowerHeader.tsx`
- edit:   `src/components/repower/RepowerLayout.tsx`
