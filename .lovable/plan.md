

# Speed Up Motor Detail Modal Loading

## The Problem

When a user clicks a motor card on the selection page, the `MotorDetailsPremiumModal` (1,051 lines) is **lazy-loaded on click**. This means the entire component chunk — plus its heavy imports (`SpecSheetPDFDownload`, `MotorDocumentsSection`, `MotorVideosSection`, `FinanceCalculatorDrawer`, `MotorImageGallery`, `framer-motion`, Supabase queries) — must be fetched and parsed before anything appears. The `ModalSkeleton` fallback renders during this time, but on slower connections or cold caches this creates a noticeable delay.

## Strategy: Prefetch on Hover/Touch + Preload on Page Idle

Instead of waiting for a click, we'll **trigger the chunk download earlier** so it's already cached when the user clicks.

### Changes

**1. `src/components/motors/MotorCardPreview.tsx`**
- Add a **prefetch on hover/touch** — when `onMouseEnter` or `onTouchStart` fires, trigger the dynamic import so the chunk starts downloading. The existing `preloadConfiguratorImagesHighPriority` call already runs here, so we piggyback on it.
- Add a module-level prefetch function that calls `import('./MotorDetailsPremiumModal')` (returns are discarded — we just want the chunk in the browser cache).

**2. `src/lib/configurator-preload.ts`** (or new `modal-preload.ts`)
- Add the modal chunk to the **idle-time preloader**. After the motor cards have loaded and the page is idle, use `requestIdleCallback` to trigger `import('./MotorDetailsPremiumModal')`. This means for most users the chunk is already cached before they even hover.

**3. `src/pages/quote/MotorSelectionPage.tsx`**
- After motors finish loading, fire the idle preload for the modal chunk. This ensures the heaviest component is pre-cached while the user browses cards.

### What This Does NOT Change
- No visual changes — the modal looks and behaves identically
- No PDF changes
- The `ModalSkeleton` fallback remains as a safety net for very slow connections
- No changes to the modal component itself

### Expected Impact
- **Hover prefetch**: ~200-500ms head start (typical hover-to-click time)
- **Idle preload**: Modal chunk cached before user even considers clicking — **near-instant** modal open for most users
- Combined: eliminates the perceived loading delay in almost all scenarios

