## Problem

At ~1024–1280px the desktop nav in `RepowerHeader` gets crowded:
- "Trade-In" wraps to two lines
- The Repower Center logo (now full-color) eats horizontal space, squeezing the 9 nav links + Build Quote + Sign In
- Nav only appears at `lg` (1024px), but there isn't enough room until ~1280px

## Fix (in `src/components/repower/RepowerHeader.tsx`)

1. **Prevent label wrapping** on every nav `<Link>` — add `whitespace-nowrap`.
2. **Tighten the logo lockup at mid sizes**:
   - Repower Center logo: `h-7 md:h-8 lg:h-9 xl:h-10` (was up to `h-11`)
   - Reduce gaps: `gap-2 lg:gap-3` instead of `gap-2 sm:gap-3 md:gap-4`
   - Reduce left padding before Repower badge: `pl-2 lg:pl-3` (was up to `pl-4`)
3. **Push nav to a higher breakpoint** so it only shows when it actually fits:
   - Hide desktop nav until `xl` (1280px): `hidden xl:flex`
   - Show hamburger below `xl`: `xl:hidden`
   - Tighten nav gaps: `gap-5 2xl:gap-7`
4. **Right cluster compaction**:
   - Build Quote button: `px-4 py-2 text-[11px]` at base, `lg:px-5 lg:py-2.5 lg:text-xs`
   - Sign In moves to `xl:inline-flex` (matches nav visibility)
5. **Allow nav row to shrink gracefully**: add `min-w-0` to the logo Link container and `flex-1 justify-center` to the nav so it centers in remaining space.

## Result

- 1024–1279px: clean header with logo lockup + Build Quote + hamburger (no cramped half-nav)
- ≥1280px: full nav, no wrapping, balanced spacing
- Logo lockup stays readable at all sizes

## Files

- edit: `src/components/repower/RepowerHeader.tsx`
