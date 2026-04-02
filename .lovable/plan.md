

# Performance Optimization — Motor Selection Page

## Problem
On a cold browser (no cache), the motor cards page is sluggish to load and delayed to interact with. This is caused by several compounding issues.

## Root Causes Identified

### 1. Per-card hook explosion (~40 motors × 6 hooks each)
Every `MotorCardPreview` independently instantiates:
- `useActivePromotions()` — Supabase query (cached, but still creates state/effect per card)
- `useMotorComparison()` — context consumer
- `useFeatureDiscovery()` — localStorage read
- `useRecentlyViewed()` — context consumer
- `useHapticFeedback()` — callback creation
- `useSmartImageScale()` — state + callback
- `useIsMobile()` — media query listener

That's **~280 hook instances** for 40 motors, all mounting simultaneously.

### 2. Per-card async image resolution
Each card runs `getMotorImageByPriority()` and `getMotorImageGallery()` on mount — potential Supabase queries per card, all firing at once.

### 3. Framer Motion stagger animation fighting CSS `!important`
The CSS in `premium-motor.css` line 44 has `transform: none !important` on motor cards, which fights framer-motion's transform-based animations, causing layout thrashing as the browser resolves conflicting styles.

### 4. JSON-LD `<script>` injection per card
Each card injects a `dangerouslySetInnerHTML` script tag for product schema — 40 DOM insertions on render.

### 5. Auto image scraping fires edge function calls
`useAutoImageScraping` invokes Supabase edge functions for motors without images on every page load.

## Plan

### Fix 1: Lift shared hooks to parent, pass as props
**File:** `src/pages/quote/MotorSelectionPage.tsx`, `src/components/motors/MotorCardPreview.tsx`

Move `useActivePromotions`, `useMotorComparison`, `useFeatureDiscovery`, `useRecentlyViewed` calls to `MotorSelectionContent` and pass the needed values as props to each card. This eliminates ~160 redundant hook instances.

### Fix 2: Wrap MotorCardPreview in React.memo
**File:** `src/components/motors/MotorCardPreview.tsx`

Prevent re-renders when parent state changes (search, filters) don't affect a specific card's props.

### Fix 3: Remove CSS transform conflict
**File:** `src/styles/premium-motor.css`

Remove `transform: none !important` from `.motor-card` (line 44). This was added to fix modal stacking but fights framer-motion animations. The modal already uses `createPortal` to document.body, so this override is unnecessary.

### Fix 4: Defer below-fold cards with Intersection Observer
**File:** `src/components/motors/MotorCardPreview.tsx`

Defer async image resolution (`getMotorImageByPriority`, `getMotorImageGallery`) until the card is near the viewport. The hero image from the parent is used immediately; gallery/priority resolution only fires when the card scrolls into view.

### Fix 5: Batch product schema into single script
**File:** `src/pages/quote/MotorSelectionPage.tsx`

Instead of 40 individual `<script>` tags, generate one `ItemList` schema with all products in the parent component.

### Fix 6: Throttle auto image scraping
**File:** `src/hooks/useAutoImageScraping.ts`

Add a `sessionStorage` check to only run scraping once per session, not on every page visit.

### Fix 7: Disable framer-motion stagger on revisit
**File:** `src/pages/quote/MotorSelectionPage.tsx`

The `hasInitiallyLoaded` flag already exists but only prevents scroll. Use it to also skip the stagger animation entirely on filter changes (set `initial={false}` when `hasInitiallyLoaded` is true — already done on line 1018, confirmed working).

## Files changed

| # | File | Change |
|---|------|--------|
| 1 | `src/components/motors/MotorCardPreview.tsx` | Accept shared hooks as props, add React.memo, defer image resolution to viewport entry |
| 2 | `src/pages/quote/MotorSelectionPage.tsx` | Lift hooks to parent, pass as props, batch product schema |
| 3 | `src/styles/premium-motor.css` | Remove `transform: none !important` from motor cards |
| 4 | `src/hooks/useAutoImageScraping.ts` | Add session-once guard |

## Expected Impact
- **~70% fewer hook instances** on initial mount
- **~40 fewer async calls** on load (deferred to scroll)
- **Eliminated layout thrashing** from CSS/framer-motion conflict
- **Faster Time to Interactive** — cards clickable sooner

