# Use Repower header on Motor Selection page

Replace the legacy `QuoteLayout` (LuxuryHeader) on `/quote/motor-selection` with the same `RepowerHeader` used on Home (`/`), so the chrome matches.

## Approach

`RepowerLayout` is hard-coded to a dark `#050E1C` background, which is wrong for the cream Motors page. So we'll **use `RepowerHeader` directly** (not `RepowerLayout`) and keep the page's existing `bg-repower-paper` sections.

## Changes

**`src/pages/quote/MotorSelectionPage.tsx`**

1. Swap the import:
   ```tsx
   // remove
   import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
   // add
   import { RepowerHeader } from '@/components/repower/RepowerHeader';
   ```

2. Replace both `<QuoteLayout>...</QuoteLayout>` wrappers (loading state ~L933, main render ~L952) with a plain wrapper that mounts `RepowerHeader` and adds top padding to clear the fixed header (~80px):
   ```tsx
   <div className="min-h-screen bg-repower-paper">
     <RepowerHeader />
     <main className="pt-[88px]">
       {/* existing children */}
     </main>
   </div>
   ```

3. The existing `onSearchClick` / `showSearchIcon` props on `QuoteLayout` are dropped — search is already accessible via the page's own search bar section. Keep `setShowSearchOverlay` wired in case other CTAs use it; otherwise it's a no-op visually.

4. `VoiceStatusBanner` stays as the first child inside `<main>`.

## Notes

- Admin Mode banner from `QuoteLayout` is removed on this page. If needed, re-add a small inline banner above `<RepowerHeader>` gated on `state.isAdminQuote && isAdmin`.
- Hamburger / mobile menu is already built into `RepowerHeader` via `RepowerMobileMenu`.
- No other quote-flow pages are touched — they keep `QuoteLayout` with the progress stepper.
