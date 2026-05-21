## Problem

On desktop between ~1366px and ~1500px, the header in `src/components/repower/RepowerHeader.tsx` tries to fit too much on one row:

- Logo lockup: Harris logo + divider + Mercury logo + divider + Mercury Repower Center badge
- 10 nav links (Engines, Promotions, Repower, Trade-In Value, Tools, Financing, About, Blog, FAQ, Contact)
- Build Quote button + Sign In

The lockup uses `overflow-hidden`, so when space runs out the Repower Center badge gets visually clipped rather than wrapping, and nav links sit flush against it with almost no gap.

## Options (pick one or combine)

**1. Raise the desktop nav breakpoint (smallest change)**
Change `min-[1366px]` to `min-[1500px]` (or `xl:` = 1280 → `2xl:` = 1536) on the nav, Build Quote, and Sign In. Below that, show the compact "Quote" button + hamburger that already exists. Pro: zero layout risk. Con: more screens fall back to the hamburger.

**2. Slim the logo lockup at mid-desktop widths**
Hide the Mercury wordmark (middle logo) between 1366px and ~1500px, keep Harris + Repower Center badge. The Mercury brand is still represented by the Repower Center badge. Pro: keeps full nav visible earlier. Con: small brand compromise at one breakpoint band.

**3. Trim the nav itself**
Move 2 lower-priority links (e.g. Blog, FAQ) into a "More" dropdown, or drop them from the top bar entirely at 1366–1500px and only show them ≥1500px. Keeps logos intact.

**4. Fix the clipping symptom only**
Remove `overflow-hidden` from the logo lockup and add a real min-gap (e.g. `gap-6`) between the lockup and the nav so nothing can visually sit "behind" the badge. Doesn't solve tightness, just the overlap appearance.

**Recommended combo:** #1 + #4. Push the full nav to `min-[1500px]`, and remove `overflow-hidden` plus add a guaranteed gap so the lockup can never visually collide with the nav. Between 1280–1499px users get the compact "Quote" button + hamburger, which already works well.

## Files touched

- `src/components/repower/RepowerHeader.tsx` only (presentation change, no logic).

## Questions before I implement

- Do you want to keep all 10 nav links visible on large desktop, or is it OK to move Blog/FAQ into a "More" menu?
- Is it acceptable for 1366–1499px screens to use the hamburger (option 1), or do you want the full nav to stay visible at 1366px and we slim the logo lockup instead (option 2)?
